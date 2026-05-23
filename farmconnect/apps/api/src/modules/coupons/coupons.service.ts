import type { Role } from '@prisma/client';

import { BadRequestError, ForbiddenError, NotFoundError } from '../../core/errors';
import type { CreateCouponDto, UpdateCouponDto } from './coupons.schemas';
import { couponsRepository } from './coupons.repository';

function ensureProducer(role: Role) {
  if (role !== 'PRODUCER') {
    throw new ForbiddenError('Only producers can perform this action');
  }
}

export const couponsService = {
  async createProducerCoupon(userId: string, role: Role, dto: CreateCouponDto) {
    ensureProducer(role);
    const producer = await couponsRepository.findProducerProfileByUserId(userId);
    if (!producer) throw new NotFoundError('Producer profile');
    return couponsRepository.createCoupon({ ...dto, producerId: producer.id, code: dto.code.toUpperCase() });
  },

  async listProducerCoupons(userId: string, role: Role) {
    ensureProducer(role);
    const producer = await couponsRepository.findProducerProfileByUserId(userId);
    if (!producer) throw new NotFoundError('Producer profile');
    return couponsRepository.listProducerCoupons(producer.id);
  },

  async updateProducerCoupon(userId: string, role: Role, couponId: string, dto: UpdateCouponDto) {
    ensureProducer(role);
    const producer = await couponsRepository.findProducerProfileByUserId(userId);
    if (!producer) throw new NotFoundError('Producer profile');

    const existing = await couponsRepository.findProducerCouponById(producer.id, couponId);
    if (!existing) throw new NotFoundError('Coupon');

    if (dto.startsAt && dto.endsAt && dto.startsAt >= dto.endsAt) {
      throw new BadRequestError('endsAt must be after startsAt');
    }

    return couponsRepository.updateProducerCoupon(producer.id, couponId, {
      ...(dto.code !== undefined ? { code: dto.code.toUpperCase() } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
      ...(dto.startsAt !== undefined ? { startsAt: dto.startsAt } : {}),
      ...(dto.endsAt !== undefined ? { endsAt: dto.endsAt } : {}),
      ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
  },

  async deleteProducerCoupon(userId: string, role: Role, couponId: string) {
    ensureProducer(role);
    const producer = await couponsRepository.findProducerProfileByUserId(userId);
    if (!producer) throw new NotFoundError('Producer profile');

    const existing = await couponsRepository.findProducerCouponById(producer.id, couponId);
    if (!existing) throw new NotFoundError('Coupon');

    return couponsRepository.deleteProducerCoupon(producer.id, couponId);
  },
};
