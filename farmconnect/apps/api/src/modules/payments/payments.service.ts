import type { Prisma, Role } from '@prisma/client';

import { config } from '../../config';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from '../../core/errors';
import { notificationsService } from '../notifications/notifications.service';
import { paymentsRepository } from './payments.repository';
import type { CreatePaymentIntentDto } from './payments.schemas';
import type { PaymentProviderId } from './providers/payment-provider';
import { BaridiMobProvider } from './providers/baridimob.provider';
import { StripeProvider } from './providers/stripe.provider';

function ensureBuyer(role: Role) {
  if (role !== 'BUYER') {
    throw new ForbiddenError('Only buyers can perform this action');
  }
}

function decimalToNumber(value: unknown): number {
  return Number(value ?? 0);
}

function toJsonObject(value: unknown): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}

function mapProviderToMethod(provider: PaymentProviderId) {
  if (provider === 'BARIDIMOB') {
    return 'EDAHABIA' as const;
  }
  return 'CIB_CARD' as const;
}

function resolveProvider(providerId: PaymentProviderId) {
  if (providerId === 'BARIDIMOB') {
    return new BaridiMobProvider();
  }

  return new StripeProvider(config.STRIPE_SECRET_KEY);
}

async function notifyPaymentParticipants(input: {
  orderId: string;
  type: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED';
  title: string;
  body: string;
  data: Prisma.InputJsonObject;
}) {
  const audience = await paymentsRepository.getOrderNotificationAudience(input.orderId);
  if (!audience) {
    return;
  }

  const producerUserIds = Array.from(
    new Set(
      audience.items
        .map((item) => item.product?.producer?.userId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  await Promise.allSettled([
    notificationsService.createOrderNotification({
      userId: audience.buyerId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
    }),
    ...producerUserIds.map((producerUserId) =>
      notificationsService.createOrderNotification({
        userId: producerUserId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data,
      }),
    ),
  ]);
}

export const paymentsService = {
  async createPaymentIntentForOrder(
    userId: string,
    role: Role,
    orderId: string,
    dto: CreatePaymentIntentDto,
  ) {
    ensureBuyer(role);

    const order = await paymentsRepository.findBuyerOrderWithPayment(orderId, userId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new BadRequestError('Cannot create a payment intent for a closed order');
    }

    if (order.paymentStatus === 'PAID') {
      return {
        orderId: order.id,
        orderPaymentStatus: order.paymentStatus,
        payment: order.payment,
        intent: null,
        alreadyPaid: true,
      };
    }

    const provider = resolveProvider(dto.provider);

    const amount = decimalToNumber(order.total);
    if (amount <= 0) {
      throw new BadRequestError('Order total must be greater than zero to create payment intent');
    }

    const intent = await provider.createPaymentIntent({
      orderId: order.id,
      amount,
      currency: order.currency,
      metadata: {
        orderId: order.id,
        buyerId: userId,
      },
      returnUrl: dto.returnUrl,
    });

    const payment = await paymentsRepository.upsertPendingPaymentForOrder({
      orderId: order.id,
      method: mapProviderToMethod(dto.provider),
      amount,
      currency: order.currency,
      gatewayRef: intent.gatewayRef,
      gatewayResponse: toJsonObject(intent.raw),
    });

    await paymentsRepository.setOrderPaymentStatus(order.id, 'PENDING');

    await paymentsRepository.createPaymentEvent(payment.id, 'INITIATED', {
      provider: intent.provider,
      gatewayRef: intent.gatewayRef,
      status: intent.status,
      returnUrl: dto.returnUrl ?? null,
    });

    if (dto.provider === 'BARIDIMOB') {
      await paymentsRepository.processStripeSuccessTransaction({
        paymentId: payment.id,
        stripeEventId: `baridimob:${intent.gatewayRef}`,
        eventType: 'baridimob.payment.completed',
        paidAt: new Date(),
        gatewayResponse: toJsonObject({
          ...(intent.raw as Record<string, unknown>),
          autoCaptured: true,
          provider: 'BARIDIMOB',
        }),
      });

      const completed = await paymentsRepository.getBuyerOrderPaymentStatus(order.id, userId);

      await notifyPaymentParticipants({
        orderId: order.id,
        type: 'PAYMENT_SUCCESS',
        title: `Payment received for order #${order.id.slice(0, 8)}`,
        body: 'BaridiMob payment was completed successfully.',
        data: {
          orderId: order.id,
          provider: 'BARIDIMOB',
          gatewayRef: intent.gatewayRef,
        },
      });

      return {
        orderId: order.id,
        orderPaymentStatus: completed?.paymentStatus ?? ('PAID' as const),
        payment: completed?.payment ?? payment,
        intent,
        alreadyPaid: false,
      };
    }

    return {
      orderId: order.id,
      orderPaymentStatus: 'PENDING' as const,
      payment,
      intent,
      alreadyPaid: false,
    };
  },

  async getBuyerPaymentStatus(userId: string, role: Role, orderId: string) {
    ensureBuyer(role);

    const order = await paymentsRepository.getBuyerOrderPaymentStatus(orderId, userId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    return {
      orderId: order.id,
      orderPaymentStatus: order.paymentStatus,
      payment: order.payment,
    };
  },

  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    const stripeProvider = new StripeProvider(config.STRIPE_SECRET_KEY);

    const event = stripeProvider.constructWebhookEvent(
      rawBody,
      signature,
      config.STRIPE_WEBHOOK_SECRET,
    );

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const gatewayRef = intent.id;

      const payment = await paymentsRepository.findPaymentByGatewayRef(gatewayRef);
      if (!payment) {
        return {
          received: true,
          processed: false,
          reason: 'PAYMENT_NOT_FOUND',
          eventType: event.type,
          eventId: event.id,
        };
      }

      try {
        const result = await paymentsRepository.processStripeSuccessTransaction({
          paymentId: payment.id,
          stripeEventId: event.id,
          eventType: event.type,
          paidAt: new Date(),
          gatewayResponse: toJsonObject(intent),
        });

        if (result.applied) {
          await notifyPaymentParticipants({
            orderId: payment.orderId,
            type: 'PAYMENT_SUCCESS',
            title: `Payment received for order #${payment.orderId.slice(0, 8)}`,
            body: 'Stripe payment was confirmed successfully.',
            data: {
              orderId: payment.orderId,
              provider: 'STRIPE',
              gatewayRef,
              stripeEventId: event.id,
            },
          });
        }

        return {
          received: true,
          processed: result.applied,
          reason: result.reason,
          eventType: event.type,
          eventId: event.id,
        };
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('NEGATIVE_STOCK_GUARD:')) {
          throw new ConflictError('Payment captured but stock validation failed; no changes were applied');
        }

        if (err instanceof Error && err.message.startsWith('PAYMENT_PRODUCT_MISSING:')) {
          throw new ConflictError('Payment captured but order item product is missing; no changes were applied');
        }

        throw err;
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      const gatewayRef = intent.id;

      const payment = await paymentsRepository.findPaymentByGatewayRef(gatewayRef);
      if (!payment) {
        return {
          received: true,
          processed: false,
          reason: 'PAYMENT_NOT_FOUND',
          eventType: event.type,
          eventId: event.id,
        };
      }

      const result = await paymentsRepository.markPaymentFailed({
        paymentId: payment.id,
        stripeEventId: event.id,
        gatewayResponse: toJsonObject(intent),
      });

      if (result.applied) {
        await notifyPaymentParticipants({
          orderId: payment.orderId,
          type: 'PAYMENT_FAILED',
          title: `Payment failed for order #${payment.orderId.slice(0, 8)}`,
          body: 'Stripe payment failed. You can retry payment from the order details page.',
          data: {
            orderId: payment.orderId,
            provider: 'STRIPE',
            gatewayRef,
            stripeEventId: event.id,
          },
        });
      }

      return {
        received: true,
        processed: result.applied,
        reason: result.reason,
        eventType: event.type,
        eventId: event.id,
      };
    }

    return {
      received: true,
      processed: false,
      reason: 'EVENT_IGNORED',
      eventType: event.type,
      eventId: event.id,
    };
  },

  ensureStripeWebhookConfigured() {
    if (!config.STRIPE_SECRET_KEY || !config.STRIPE_WEBHOOK_SECRET) {
      throw new ServiceUnavailableError('Stripe webhook is not configured');
    }
  },
};
