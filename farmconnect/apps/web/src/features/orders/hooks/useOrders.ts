import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cartKeys } from '@/features/cart/hooks/useCart';

import {
  addDeliveryUpdateApi,
  checkoutFromCartApi,
  createPaymentIntentApi,
  createReviewApi,
  generateDeliveryVerificationTokenApi,
  getOrderTrackingApi,
  getBuyerOrderDetailApi,
  getOrderPaymentStatusApi,
  getProducerOrderDetailApi,
  listBuyerOrdersApi,
  listProducerOrdersApi,
  transitionProducerOrderStatusApi,
  verifyDeliveryTokenApi,
  type CheckoutPayload,
  type CreateDeliveryUpdatePayload,
  type CreatePaymentIntentPayload,
  type CreateReviewPayload,
  type ListOrdersQuery,
  type OrderStatus,
  type VerifyDeliveryTokenPayload,
} from '../api/orders.api';

export const orderKeys = {
  buyerList: (query: ListOrdersQuery) => ['orders', 'buyer', query] as const,
  buyerDetail: (orderId: string) => ['orders', 'buyer', orderId] as const,
  buyerPaymentStatus: (orderId: string) => ['orders', 'buyer', orderId, 'payment-status'] as const,
  tracking: (orderId: string) => ['orders', 'tracking', orderId] as const,
  producerList: (query: ListOrdersQuery) => ['orders', 'producer', query] as const,
  producerDetail: (orderId: string) => ['orders', 'producer', orderId] as const,
};

export function useCheckoutFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CheckoutPayload) => checkoutFromCartApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: ['orders', 'buyer'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'producer'] });
    },
  });
}

export function useBuyerOrders(query: ListOrdersQuery) {
  return useQuery({
    queryKey: orderKeys.buyerList(query),
    queryFn: () => listBuyerOrdersApi(query),
  });
}

export function useBuyerOrderDetail(orderId: string) {
  return useQuery({
    queryKey: orderKeys.buyerDetail(orderId),
    queryFn: () => getBuyerOrderDetailApi(orderId),
    enabled: !!orderId,
  });
}

export function useProducerOrders(query: ListOrdersQuery) {
  return useQuery({
    queryKey: orderKeys.producerList(query),
    queryFn: () => listProducerOrdersApi(query),
  });
}

export function useProducerOrderDetail(orderId: string) {
  return useQuery({
    queryKey: orderKeys.producerDetail(orderId),
    queryFn: () => getProducerOrderDetailApi(orderId),
    enabled: !!orderId,
  });
}

export function useTransitionProducerOrderStatus(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: OrderStatus) => transitionProducerOrderStatusApi(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'producer'] });
      queryClient.invalidateQueries({ queryKey: orderKeys.producerDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: ['orders', 'buyer'] });
    },
  });
}

export function useCreatePaymentIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { orderId: string; payload: CreatePaymentIntentPayload }) =>
      createPaymentIntentApi(input.orderId, input.payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.buyerDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.buyerPaymentStatus(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: ['orders', 'buyer'] });
    },
  });
}

export function useBuyerOrderPaymentStatus(orderId: string) {
  return useQuery({
    queryKey: orderKeys.buyerPaymentStatus(orderId),
    queryFn: () => getOrderPaymentStatusApi(orderId),
    enabled: !!orderId,
    refetchInterval: 10_000,
  });
}

export function useOrderTracking(orderId: string) {
  return useQuery({
    queryKey: orderKeys.tracking(orderId),
    queryFn: () => getOrderTrackingApi(orderId),
    enabled: !!orderId,
    refetchInterval: 10_000,
  });
}

export function useAddDeliveryUpdate(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDeliveryUpdatePayload) => addDeliveryUpdateApi(orderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.tracking(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.buyerDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.producerDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: ['orders', 'buyer'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'producer'] });
    },
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReviewApi(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.buyerDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: ['products', 'public'] });
    },
  });
}

export function useGenerateDeliveryVerificationToken(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateDeliveryVerificationTokenApi(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.producerDetail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.buyerDetail(orderId) });
    },
  });
}

export function useVerifyDeliveryToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyDeliveryTokenPayload) => verifyDeliveryTokenApi(payload),
    onSuccess: (_order, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.producerDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.buyerDetail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: ['orders', 'producer'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'buyer'] });
    },
  });
}
