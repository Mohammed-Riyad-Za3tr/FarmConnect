import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addOwnProductImageApi,
  deleteOwnProductImageApi,
  listOwnProductImagesApi,
  type AddProductImagePayload,
} from '../api/product-images.api';

export const productImageKeys = {
  list: (productId: string) => ['products', 'images', productId] as const,
};

export function useOwnProductImages(productId: string) {
  return useQuery({
    queryKey: productImageKeys.list(productId),
    queryFn: () => listOwnProductImagesApi(productId),
    enabled: !!productId,
  });
}

export function useAddOwnProductImage(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddProductImagePayload) => addOwnProductImageApi(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productImageKeys.list(productId) });
      queryClient.invalidateQueries({ queryKey: ['products', 'own', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', 'own'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'public'] });
    },
  });
}

export function useDeleteOwnProductImage(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId }: { imageId: string }) => deleteOwnProductImageApi(productId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productImageKeys.list(productId) });
      queryClient.invalidateQueries({ queryKey: ['products', 'own', productId] });
      queryClient.invalidateQueries({ queryKey: ['products', 'own'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'public'] });
    },
  });
}
