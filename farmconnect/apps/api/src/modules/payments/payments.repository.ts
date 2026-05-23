import type { PaymentMethod, PaymentStatus, PaymentEventType, Prisma } from '@prisma/client';

import { prisma } from '../../prisma/client';

const paymentEventSelect = {
  id: true,
  type: true,
  payload: true,
  createdAt: true,
} as const;

const paymentSelect = {
  id: true,
  orderId: true,
  method: true,
  status: true,
  amount: true,
  currency: true,
  gatewayRef: true,
  gatewayResponse: true,
  paidAt: true,
  failedAt: true,
  createdAt: true,
  updatedAt: true,
  events: {
    select: paymentEventSelect,
    orderBy: { createdAt: 'desc' as const },
    take: 10,
  },
} as const;

export const paymentsRepository = {
  findBuyerOrderWithPayment(orderId: string, buyerId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, buyerId },
      select: {
        id: true,
        buyerId: true,
        status: true,
        paymentStatus: true,
        total: true,
        currency: true,
        payment: {
          select: paymentSelect,
        },
      },
    });
  },

  getBuyerOrderPaymentStatus(orderId: string, buyerId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, buyerId },
      select: {
        id: true,
        paymentStatus: true,
        payment: {
          select: paymentSelect,
        },
      },
    });
  },

  async upsertPendingPaymentForOrder(input: {
    orderId: string;
    method: PaymentMethod;
    amount: number;
    currency: string;
    gatewayRef: string;
    gatewayResponse: Prisma.InputJsonObject;
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({
        where: { orderId: input.orderId },
        select: { id: true, status: true },
      });

      if (existing?.status === 'PAID') {
        return tx.payment.findUniqueOrThrow({
          where: { id: existing.id },
          select: paymentSelect,
        });
      }

      if (existing) {
        await tx.payment.update({
          where: { id: existing.id },
          data: {
            method: input.method,
            status: 'PENDING',
            amount: input.amount,
            currency: input.currency,
            gatewayRef: input.gatewayRef,
            gatewayResponse: input.gatewayResponse,
            failedAt: null,
          },
        });

        return tx.payment.findUniqueOrThrow({
          where: { id: existing.id },
          select: paymentSelect,
        });
      }

      const created = await tx.payment.create({
        data: {
          orderId: input.orderId,
          method: input.method,
          status: 'PENDING',
          amount: input.amount,
          currency: input.currency,
          gatewayRef: input.gatewayRef,
          gatewayResponse: input.gatewayResponse,
        },
      });

      return tx.payment.findUniqueOrThrow({
        where: { id: created.id },
        select: paymentSelect,
      });
    });
  },

  createPaymentEvent(paymentId: string, type: PaymentEventType, payload: Prisma.InputJsonObject) {
    return prisma.paymentEvent.create({
      data: {
        paymentId,
        type,
        payload,
      },
      select: paymentEventSelect,
    });
  },

  setOrderPaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
    return prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus },
      select: { id: true, paymentStatus: true },
    });
  },

  findPaymentByGatewayRef(gatewayRef: string) {
    return prisma.payment.findFirst({
      where: { gatewayRef },
      select: {
        id: true,
        orderId: true,
        status: true,
      },
    });
  },

  getOrderNotificationAudience(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        buyerId: true,
        items: {
          select: {
            product: {
              select: {
                producer: {
                  select: {
                    userId: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  async markPaymentFailed(input: {
    paymentId: string;
    stripeEventId: string;
    gatewayResponse: Prisma.InputJsonObject;
  }) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: input.paymentId },
        select: { id: true, orderId: true },
      });

      if (!payment) {
        return { applied: false as const, reason: 'PAYMENT_NOT_FOUND' };
      }

      const existingEvent = await tx.paymentEvent.findFirst({
        where: {
          paymentId: payment.id,
          payload: {
            path: ['stripeEventId'],
            equals: input.stripeEventId,
          },
        },
        select: { id: true },
      });

      if (existingEvent) {
        return { applied: false as const, reason: 'EVENT_ALREADY_PROCESSED' };
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          gatewayResponse: input.gatewayResponse,
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: 'FAILED' },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          type: 'FAILED',
          payload: {
            stripeEventId: input.stripeEventId,
            reason: 'Gateway payment failure event received',
          },
        },
      });

      return { applied: true as const, reason: 'UPDATED' };
    });
  },

  async processStripeSuccessTransaction(input: {
    paymentId: string;
    stripeEventId: string;
    eventType: string;
    paidAt: Date;
    gatewayResponse: Prisma.InputJsonObject;
  }) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: input.paymentId },
        select: {
          id: true,
          orderId: true,
          status: true,
          order: {
            select: {
              id: true,
              status: true,
              paymentStatus: true,
              currency: true,
              items: {
                select: {
                  id: true,
                  productId: true,
                  quantity: true,
                  total: true,
                  currency: true,
                  product: {
                    select: {
                      id: true,
                      stock: true,
                      producerId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!payment) {
        return { applied: false as const, reason: 'PAYMENT_NOT_FOUND' };
      }

      const existingEvent = await tx.paymentEvent.findFirst({
        where: {
          paymentId: payment.id,
          payload: {
            path: ['stripeEventId'],
            equals: input.stripeEventId,
          },
        },
        select: { id: true },
      });

      if (existingEvent) {
        return { applied: false as const, reason: 'EVENT_ALREADY_PROCESSED' };
      }

      const claimed = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: { not: 'PAID' },
        },
        data: {
          status: 'PAID',
          paidAt: input.paidAt,
          failedAt: null,
          gatewayResponse: input.gatewayResponse,
        },
      });

      if (claimed.count === 0) {
        await tx.paymentEvent.create({
          data: {
            paymentId: payment.id,
            type: 'CAPTURED',
            payload: {
              stripeEventId: input.stripeEventId,
              eventType: input.eventType,
              duplicate: true,
              note: 'Payment was already marked as PAID',
            },
          },
        });

        return { applied: false as const, reason: 'PAYMENT_ALREADY_PAID' };
      }

      const payoutByProducer = new Map<string, { amount: number; currency: string }>();

      for (const item of payment.order.items) {
        if (!item.productId || !item.product) {
          throw new Error(`PAYMENT_PRODUCT_MISSING:${item.id}`);
        }

        const stockUpdate = await tx.product.updateMany({
          where: {
            id: item.product.id,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (stockUpdate.count === 0) {
          throw new Error(`NEGATIVE_STOCK_GUARD:${item.product.id}`);
        }

        const producerId = item.product.producerId;
        const current = payoutByProducer.get(producerId);
        const lineTotal = Number(item.total);

        payoutByProducer.set(producerId, {
          amount: (current?.amount ?? 0) + lineTotal,
          currency: item.currency,
        });
      }

      if (payoutByProducer.size > 0) {
        await tx.payout.createMany({
          data: Array.from(payoutByProducer.entries()).map(([producerProfileId, value]) => ({
            producerProfileId,
            amount: value.amount,
            currency: value.currency,
            status: 'PENDING',
            notes: `Auto placeholder payout for paid order ${payment.orderId}`,
          })),
        });
      }

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          type: 'CAPTURED',
          payload: {
            stripeEventId: input.stripeEventId,
            eventType: input.eventType,
            payoutEntriesCreated: payoutByProducer.size,
            orderStatusAfterPayment: 'CONFIRMED',
          },
        },
      });

      return { applied: true as const, reason: 'UPDATED', orderId: payment.orderId };
    });
  },
};
