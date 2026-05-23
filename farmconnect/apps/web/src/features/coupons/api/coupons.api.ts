import { apiClient } from '@/shared/api/client';

export type CouponType = 'PERCENT' | 'FIXED';

export interface Coupon {
  id: string;
  code: string;
  producerId: string;
  type: CouponType;
  amount: string | number;
  startsAt: string;
  endsAt: string;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertCouponPayload {
  code: string;
  type: CouponType;
  amount: number;
  startsAt: string;
  endsAt: string;
  usageLimit?: number;
  isActive?: boolean;
}

export async function listProducerCouponsApi(): Promise<Coupon[]> {
  const { data } = await apiClient.get<{ data: { coupons: Coupon[] } }>('/api/coupons/producer');
  return data.data.coupons;
}

export async function createProducerCouponApi(payload: UpsertCouponPayload): Promise<Coupon> {
  const { data } = await apiClient.post<{ data: { coupon: Coupon } }>('/api/coupons/producer', payload);
  return data.data.coupon;
}

export async function updateProducerCouponApi(couponId: string, payload: Partial<UpsertCouponPayload>): Promise<Coupon> {
  const { data } = await apiClient.patch<{ data: { coupon: Coupon } }>(`/api/coupons/producer/${couponId}`, payload);
  return data.data.coupon;
}

export async function deleteProducerCouponApi(couponId: string): Promise<Coupon> {
  const { data } = await apiClient.delete<{ data: { coupon: Coupon } }>(`/api/coupons/producer/${couponId}`);
  return data.data.coupon;
}
