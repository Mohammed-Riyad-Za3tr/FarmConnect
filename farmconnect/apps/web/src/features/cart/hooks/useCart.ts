import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addCartItemApi,
  clearCartApi,
  getCartApi,
  removeCartItemApi,
  updateCartItemApi,
  type AddCartItemPayload,
  type UpdateCartItemPayload,
} from '../api/cart.api';

export const cartKeys = {
  all: ['cart'] as const,
  detail: ['cart', 'detail'] as const,
};

export function useCart() {
  return useQuery({
    queryKey: cartKeys.detail,
    queryFn: getCartApi,
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddCartItemPayload) => addCartItemApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { productId: string; payload: UpdateCartItemPayload }) =>
      updateCartItemApi(input.productId, input.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => removeCartItemApi(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCartApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}
