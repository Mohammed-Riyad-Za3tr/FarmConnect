import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '../../core/errors';
import { sendSuccess } from '../../core/response';
import { CreatePaymentIntentSchema } from './payments.schemas';
import { paymentsService } from './payments.service';

function authContext(req: Request) {
  if (!req.user) {
    throw new BadRequestError('Authenticated user context is missing');
  }
  return { userId: req.user.id, role: req.user.role };
}

export async function createPaymentIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const orderId = String(req.params.orderId ?? '');
    const dto = CreatePaymentIntentSchema.parse(req.body ?? {});

    const data = await paymentsService.createPaymentIntentForOrder(auth.userId, auth.role, orderId, dto);

    sendSuccess(res, data, { message: 'Payment intent created' });
  } catch (err) {
    next(err);
  }
}

export async function getBuyerPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const orderId = String(req.params.orderId ?? '');

    const data = await paymentsService.getBuyerPaymentStatus(auth.userId, auth.role, orderId);

    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function handleStripeWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    paymentsService.ensureStripeWebhookConfigured();

    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string' || !signature) {
      throw new BadRequestError('Stripe signature header is required');
    }

    const body = req.body;
    if (!Buffer.isBuffer(body)) {
      throw new BadRequestError('Stripe webhook requires raw request body');
    }

    const result = await paymentsService.handleStripeWebhook(signature, body);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
