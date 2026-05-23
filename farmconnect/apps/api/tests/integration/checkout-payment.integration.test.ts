import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../../src/app';
import { ordersService } from '../../src/modules/orders/orders.service';
import { paymentsService } from '../../src/modules/payments/payments.service';

const accessSecret = process.env['JWT_ACCESS_SECRET'] ?? 'test-access-secret-that-is-at-least-32-chars!!';

function authHeader(userId = 'buyer-1', role = 'BUYER') {
  const token = jwt.sign({ sub: userId, email: 'buyer@example.com', role }, accessSecret);
  return `Bearer ${token}`;
}

describe('Checkout and payments integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/orders/checkout requires authentication', async () => {
    const response = await request(app).post('/api/orders/checkout').send({});

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/orders/checkout creates order for authenticated buyer', async () => {
    vi.spyOn(ordersService, 'checkout').mockResolvedValue({
      id: 'order-1',
      items: [],
    } as never);

    const response = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', authHeader())
      .send({ notes: 'Leave at front gate' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.order.id).toBe('order-1');
    expect(ordersService.checkout).toHaveBeenCalledWith(
      'buyer-1',
      'BUYER',
      expect.objectContaining({ notes: 'Leave at front gate' }),
    );
  });

  it('POST /api/payments/orders/:orderId/intents validates payload', async () => {
    const response = await request(app)
      .post('/api/payments/orders/order-1/intents')
      .set('Authorization', authHeader())
      .send({ provider: 'STRIPE', returnUrl: 'not-a-url' });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/payments/orders/:orderId/intents creates payment intent', async () => {
    vi.spyOn(paymentsService, 'createPaymentIntentForOrder').mockResolvedValue({
      orderId: 'order-1',
      orderPaymentStatus: 'PENDING',
      payment: null,
      intent: {
        provider: 'STRIPE',
        gatewayRef: 'pi_1',
        status: 'PENDING',
        raw: { id: 'pi_1' },
      },
      alreadyPaid: false,
    });

    const response = await request(app)
      .post('/api/payments/orders/order-1/intents')
      .set('Authorization', authHeader())
      .send({ provider: 'STRIPE', returnUrl: 'https://example.com/return' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.orderId).toBe('order-1');
  });

  it('POST /api/payments/webhooks/stripe processes raw webhook payload', async () => {
    vi.spyOn(paymentsService, 'ensureStripeWebhookConfigured').mockImplementation(() => {});
    vi.spyOn(paymentsService, 'handleStripeWebhook').mockResolvedValue({
      received: true,
      processed: true,
      reason: 'UPDATED',
      eventType: 'payment_intent.succeeded',
      eventId: 'evt_1',
    });

    const body = Buffer.from(JSON.stringify({ id: 'evt_1' }));

    const response = await request(app)
      .post('/api/payments/webhooks/stripe')
      .set('stripe-signature', 'sig_test')
      .set('content-type', 'application/json')
      .send(body);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.processed).toBe(true);
    expect(paymentsService.handleStripeWebhook).toHaveBeenCalledWith('sig_test', expect.any(Buffer));
  });

  it('replays checkout response for duplicate idempotency key', async () => {
    vi.spyOn(ordersService, 'checkout').mockResolvedValue({
      id: 'order-333',
      items: [],
    } as never);

    const key = 'checkout-key-123';

    const first = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', authHeader())
      .set('X-Idempotency-Key', key)
      .send({ notes: 'first' });

    const second = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', authHeader())
      .set('X-Idempotency-Key', key)
      .send({ notes: 'second-ignored' });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.data.order.id).toBe('order-333');
    expect(second.headers['x-idempotency-status']).toBe('replayed');
    expect(ordersService.checkout).toHaveBeenCalledTimes(1);
  });

  it('returns BAD_REQUEST for malformed JSON with requestId', async () => {
    const response = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', authHeader())
      .set('Content-Type', 'application/json')
      .set('X-Request-ID', 'req-hardening-123')
      .send('{"notes": "broken"');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('BAD_REQUEST');
    expect(response.body.requestId).toBe('req-hardening-123');
  });
});
