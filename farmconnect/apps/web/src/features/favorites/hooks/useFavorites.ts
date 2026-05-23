import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  listFavoriteProductsApi,
  listFavoriteProducersApi,
  toggleFavoriteProducerApi,
  toggleFavoriteProductApi,
} from '../api/favorites.api';

export const favoriteKeys = {
  products: ['favorites', 'products'] as const,
  producers: ['favorites', 'producers'] as const,
};

export function useFavoriteProducts() {
  return useQuery({
    queryKey: favoriteKeys.products,
    queryFn: listFavoriteProductsApi,
  });
}

export function useFavoriteProducers() {
  return useQuery({
    queryKey: favoriteKeys.producers,
    queryFn: listFavoriteProducersApi,
  });
}

export function useToggleFavoriteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => toggleFavoriteProductApi(productId),
    onSuccess: (result) => {
      queryClient.setQueriesData({ queryKey: ['products', 'public'] }, (current) =>
        patchProductFavoriteState(current, result.productId, result.isFavorite),
      );
      queryClient.invalidateQueries({ queryKey: ['products', 'public'] });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.products });
    },
  });
}

export function useToggleFavoriteProducer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (producerId: string) => toggleFavoriteProducerApi(producerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'public'] });
      queryClient.invalidateQueries({ queryKey: favoriteKeys.producers });
    },
  });
}

function patchProductFavoriteState(current: unknown, productId: string, isFavorite: boolean): unknown {
  if (!current || typeof current !== 'object') return current;

  if ('items' in (current as Record<string, unknown>) && Array.isArray((current as { items?: unknown[] }).items)) {
    return {
      ...(current as Record<string, unknown>),
      items: (current as { items: unknown[] }).items.map((item) => patchSingleProduct(item, productId, isFavorite)),
    };
  }

  return patchSingleProduct(current, productId, isFavorite);
}

function patchSingleProduct(current: unknown, productId: string, isFavorite: boolean): unknown {
  if (!current || typeof current !== 'object') return current;

  const record = current as Record<string, unknown>;
  const similarProducts: unknown = Array.isArray(record.similarProducts)
    ? record.similarProducts.map((item) => patchSingleProduct(item, productId, isFavorite))
    : record.similarProducts;

  if (record.id !== productId) {
    return similarProducts === record.similarProducts ? current : { ...record, similarProducts };
  }

  return {
    ...record,
    isFavorite,
    similarProducts,
  };
}
