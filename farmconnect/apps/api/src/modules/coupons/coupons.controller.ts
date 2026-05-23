import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '../../core/errors';
import { sendCreated, sendSuccess } from '../../core/response';
import { couponsService } from './coupons.service';
import { CreateCouponSchema, UpdateCouponSchema } from './coupons.schemas';

function authContext(req: Request) {
  if (!req.user) {
    throw new BadRequestError('Authenticated user context is missing');
  }
  return { userId: req.user.id, role: req.user.role };
}

export async function createProducerCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const dto = CreateCouponSchema.parse(req.body);
    const coupon = await couponsService.createProducerCoupon(auth.userId, auth.role, dto);
    sendCreated(res, { coupon }, 'Coupon created');
  } catch (err) {
    next(err);
  }
}

export async function listProducerCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const coupons = await couponsService.listProducerCoupons(auth.userId, auth.role);
    sendSuccess(res, { coupons });
  } catch (err) {
    next(err);
  }
}

export async function updateProducerCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const couponId = String(req.params.couponId ?? '');
    const dto = UpdateCouponSchema.parse(req.body);
    const coupon = await couponsService.updateProducerCoupon(auth.userId, auth.role, couponId, dto);
    sendSuccess(res, { coupon }, { message: 'Coupon updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteProducerCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const couponId = String(req.params.couponId ?? '');
    const coupon = await couponsService.deleteProducerCoupon(auth.userId, auth.role, couponId);
    sendSuccess(res, { coupon }, { message: 'Coupon deleted' });
  } catch (err) {
    next(err);
  }
}
