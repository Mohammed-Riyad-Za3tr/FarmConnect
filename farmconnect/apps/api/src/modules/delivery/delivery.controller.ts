import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '../../core/errors';
import { sendSuccess } from '../../core/response';
import { CreateDeliveryUpdateSchema } from './delivery.schemas';
import { deliveryService } from './delivery.service';

function authContext(req: Request) {
  if (!req.user) {
    throw new BadRequestError('Authenticated user context is missing');
  }

  return {
    userId: req.user.id,
    role: req.user.role,
  };
}

export async function getOrderTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const orderId = String(req.params.orderId ?? '');

    const order = await deliveryService.getOrderTracking(auth.userId, auth.role, orderId);

    sendSuccess(res, { order });
  } catch (err) {
    next(err);
  }
}

export async function addDeliveryUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const orderId = String(req.params.orderId ?? '');
    const dto = CreateDeliveryUpdateSchema.parse(req.body ?? {});

    const tracking = await deliveryService.addDeliveryUpdate(auth.userId, auth.role, orderId, dto);

    sendSuccess(res, { tracking }, { message: 'Delivery update added' });
  } catch (err) {
    next(err);
  }
}
