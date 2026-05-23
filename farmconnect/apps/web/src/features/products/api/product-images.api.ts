import { apiClient } from '@/shared/api/client';

export interface ProductImageRecord {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  position: number;
  createdAt: string;
}

export interface AddProductImagePayload {
  sourceUrl: string;
  altText?: string;
  position?: number;
}

export async function listOwnProductImagesApi(productId: string): Promise<ProductImageRecord[]> {
  const { data } = await apiClient.get<{ data: { images: ProductImageRecord[] } }>(
    `/api/products/me/${productId}/images`,
  );
  return data.data.images;
}

export async function addOwnProductImageApi(
  productId: string,
  payload: AddProductImagePayload,
): Promise<ProductImageRecord> {
  const { data } = await apiClient.post<{ data: { image: ProductImageRecord } }>(
    `/api/products/me/${productId}/images`,
    payload,
  );
  return data.data.image;
}

export async function deleteOwnProductImageApi(productId: string, imageId: string): Promise<ProductImageRecord> {
  const { data } = await apiClient.delete<{ data: { image: ProductImageRecord } }>(
    `/api/products/me/${productId}/images/${imageId}`,
  );
  return data.data.image;
}
