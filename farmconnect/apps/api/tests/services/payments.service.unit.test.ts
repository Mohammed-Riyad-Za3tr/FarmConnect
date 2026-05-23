import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockCreatePaymentIntent = vi.fn();
const mockConstructWebhookEvent = vi.fn();

vi.mock('../../src/modules/payments/providers/stripe.provider', () => ({
  StripeProvider: class {
    createPaymentIntent = mockCreatePaymentIntent;
    constructWebhookEvent = mockConstructWebhookEvent;
  },
}));

vi.mock('../../src/modules/payments/payments.repository', () => ({
  paymentsRepository: {
    findBuyerOrderWithPayment: vi.fn(),
    upsertPendingPaymentForOrder: vi.fn(),
    setOrderPaymentStatus: vi.fn(),
    createPaymentEvent: vi.fn(),
    getBuyerOrderPaymentStatus: vi.fn(),
    findPaymentByGatewayRef: vi.fn(),
    processStripeSuccessTransaction: vi.fn(),
    markPaymentFailed: vi.fn(),
    getOrderNotificationAudience: vi.fn(),
  },
}));

vi.mock('../../src/modules/notifications/notifications.service', () => ({
  notificationsService: {
    createOrderNotification: vi.fn(),
  },
}));

import { BadRequestError } from '../../src/core/errors';
import { notificationsService } from '../../src/modules/notifications/notifications.service';
import { paymentsRepository } from '../../src/modules/payments/payments.repository';
import { paymentsService } from '../../src/modules/payments/payments.service';

const mockedRepo = vi.mocked(paymentsRepository);
const mockedNotifications = vi.mocked(notificationsService);

describe('paymentsService unit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRepo.getOrderNotificationAudience.mockResolvedValue({
      id: 'order-1',
      buyerId: 'buyer-1',
      items: [],
    } as never);
    mockedNotifications.createOrderNotification.mockResolvedValue({} as never);
  });

  it('returns alreadyPaid when order is already paid', async () => {
    mockedRepo.findBuyerOrderWithPayment.mockResolvedValue({
      id: 'order-1',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      payment: { id: 'pay-1' },
      total: 100,
      currency: 'DZD',
    } as never);

    const result = await paymentsService.createPaymentIntentForOrder('buyer-1', 'BUYER', 'order-1', {
      provider: 'STRIPE',
      returnUrl: 'https://example.com/return',
    });

    expect(result.alreadyPaid).toBe(true);
    expect(result.intent).toBeNull();
    expect(mockCreatePaymentIntent).not.toHaveBeenCalled();
  });

  it('rejects payment intent creation when order total is not positive', async () => {
    mockedRepo.findBuyerOrderWithPayment.mockResolvedValue({
      id: 'order-2',
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      payment: null,
      total: 0,
      currency: 'DZD',
    } as never);

    await expect(
      paymentsService.createPaymentIntentForOrder('buyer-1', 'BUYER', 'order-2', {
        provider: 'STRIPE',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('processes stripe success webhook and emits notifications', async () => {
    mockConstructWebhookEvent.mockReturnValue({
      id: 'evt_success_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123', status: 'succeeded' } },
    });

    mockedRepo.findPaymentByGatewayRef.mockResolvedValue({
      id: 'payment-1',
      orderId: 'order-3',
      status: 'PENDING',
    } as never);

    mockedRepo.processStripeSuccessTransaction.mockResolvedValue({
      applied: true,
      reason: 'UPDATED',
    } as never);

    const result = await paymentsService.handleStripeWebhook(
      'stripe-signature',
      Buffer.from('{"id":"evt_success_1"}'),
    );

    expect(result.received).toBe(true);
    expect(result.processed).toBe(true);
    expect(result.reason).toBe('UPDATED');
    expect(mockedRepo.processStripeSuccessTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'payment-1',
        stripeEventId: 'evt_success_1',
      }),
    );
    expect(mockedNotifications.createOrderNotification).toHaveBeenCalled();
  });
});
