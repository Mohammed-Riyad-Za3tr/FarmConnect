import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createOwnProductLogApi,
  createOwnProductApi,
  deleteOwnProductApi,
  getOwnProductApi,
  getPublicProductApi,
  listProductCategoriesApi,
  listOwnProductLogsApi,
  listOwnProductsApi,
  listPublicProductsApi,
  updateOwnProductApi,
  type ListOwnProductsQuery,
  type ListPublicProductsQuery,
  type ProductLogType,
  type UpsertProductPayload,
} from '../api/products.api';

export const productKeys = {
  categories: ['products', 'categories'] as const,
  publicList: (query: ListPublicProductsQuery) => ['products', 'public', query] as const,
  publicBySlug: (slug: string) => ['products', 'public', slug] as const,
  ownList: (query: ListOwnProductsQuery) => ['products', 'own', query] as const,
  ownById: (id: string) => ['products', 'own', id] as const,
  ownLogsByProduct: (id: string) => ['products', 'own', id, 'logs'] as const,
};

export function useProductCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: listProductCategoriesApi,
  });
}

export function usePublicProducts(query: ListPublicProductsQuery) {
  return useQuery({
    queryKey: productKeys.publicList(query),
    queryFn: () => listPublicProductsApi(query),
  });
}

export function usePublicProduct(slug: string) {
  return useQuery({
    queryKey: productKeys.publicBySlug(slug),
    queryFn: () => getPublicProductApi(slug),
    enabled: !!slug,
  });
}

export function useOwnProducts(query: ListOwnProductsQuery) {
  return useQuery({
    queryKey: productKeys.ownList(query),
    queryFn: () => listOwnProductsApi(query),
  });
}

export function useOwnProduct(productId: string) {
  return useQuery({
    queryKey: productKeys.ownById(productId),
    queryFn: () => getOwnProductApi(productId),
    enabled: !!productId,
  });
}

export function useCreateOwnProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertProductPayload) => createOwnProductApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'own'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'public'] });
    },
  });
}

export function useOwnProductLogs(productId: string) {
  return useQuery({
    queryKey: productKeys.ownLogsByProduct(productId),
    queryFn: () => listOwnProductLogsApi(productId),
    enabled: !!productId,
  });
}

export function useCreateOwnProductLog(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { type: ProductLogType; note: string; happenedAt: string }) =>
      createOwnProductLogApi(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.ownLogsByProduct(productId) });
    },
  });
}

export function useUpdateOwnProduct(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<UpsertProductPayload>) => updateOwnProductApi(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'own'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'public'] });
      queryClient.invalidateQueries({ queryKey: productKeys.ownById(productId) });
    },
  });
}

export function useDeleteOwnProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => deleteOwnProductApi(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'own'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'public'] });
    },
  });
}
