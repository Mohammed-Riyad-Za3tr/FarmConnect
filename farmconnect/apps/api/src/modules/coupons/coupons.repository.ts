import { prisma } from '../../prisma/client';
const prismaAny = prisma as any;

const couponSelect = {
  id: true,
  code: true,
  producerId: true,
  type: true,
  amount: true,
  startsAt: true,
  endsAt: true,
  usageLimit: true,
  usedCount: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const couponsRepository = {
  findProducerProfileByUserId(userId: string) {
    return prisma.producerProfile.findUnique({ where: { userId }, select: { id: true } });
  },

  createCoupon(data: {
    code: string;
    producerId: string;
    type: 'PERCENT' | 'FIXED';
    amount: number;
    startsAt: Date;
    endsAt: Date;
    usageLimit?: number;
    isActive: boolean;
  }) {
    return prismaAny.coupon.create({ data, select: couponSelect });
  },

  listProducerCoupons(producerId: string) {
    return prismaAny.coupon.findMany({
      where: { producerId },
      orderBy: [{ createdAt: 'desc' }],
      select: couponSelect,
    });
  },

  findProducerCouponById(producerId: string, couponId: string) {
    return prismaAny.coupon.findFirst({ where: { id: couponId, producerId }, select: couponSelect });
  },

  updateProducerCoupon(producerId: string, couponId: string, data: Record<string, unknown>) {
    return prisma.$transaction(async (tx) => {
      const txAny = tx as any;
      await txAny.coupon.updateMany({
        where: { id: couponId, producerId },
        data,
      });
      return txAny.coupon.findUniqueOrThrow({ where: { id: couponId }, select: couponSelect });
    });
  },

  deleteProducerCoupon(producerId: string, couponId: string) {
    return prisma.$transaction(async (tx) => {
      const txAny = tx as any;
      const existing = await txAny.coupon.findFirst({
        where: { id: couponId, producerId },
        select: couponSelect,
      });
      if (!existing) {
        return null;
      }
      await txAny.coupon.delete({ where: { id: couponId } });
      return existing;
    });
  },

  findActiveCouponByCode(code: string, now: Date) {
    return prismaAny.coupon.findFirst({
      where: {
        code,
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      select: couponSelect,
    });
  },

  incrementCouponUsage(couponId: string) {
    return prismaAny.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
      select: couponSelect,
    });
  },
};
