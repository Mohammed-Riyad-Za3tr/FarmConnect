import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createProducerCouponApi,
  deleteProducerCouponApi,
  listProducerCouponsApi,
  updateProducerCouponApi,
  type UpsertCouponPayload,
} from '../api/coupons.api';

export const couponKeys = {
  producer: ['coupons', 'producer'] as const,
};

export function useProducerCoupons() {
  return useQuery({
    queryKey: couponKeys.producer,
    queryFn: listProducerCouponsApi,
  });
}

export function useCreateProducerCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertCouponPayload) => createProducerCouponApi(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponKeys.producer }),
  });
}

export function useUpdateProducerCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { couponId: string; payload: Partial<UpsertCouponPayload> }) =>
      updateProducerCouponApi(input.couponId, input.payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponKeys.producer }),
  });
}

export function useDeleteProducerCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponId: string) => deleteProducerCouponApi(couponId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: couponKeys.producer }),
  });
}
