import { apiClient } from '@/shared/api/client';
export interface FavoriteProductItem {
  id: string;
  createdAt: string;
  product: {
    id: string;
    slug: string;
    title: { en?: string; ar?: string };
    price: string | number;
    currency: string;
    unit: string;
    images: Array<{ id: string; url: string; altText: string | null }>;
    producer: {
      businessName: string;
      wilaya: string;
      commune: string;
    };
  };
}

export interface FavoriteProducerItem {
  id: string;
  createdAt: string;
  producer: {
    id: string;
    userId: string;
    businessName: string;
    businessType: string | null;
    bio: string | null;
    wilaya: string;
    commune: string;
    latitude: number | null;
    longitude: number | null;
    verificationStatus: string;
    isFavorite: boolean;
    user: {
      id: string;
      fullName: string;
      avatarUrl: string | null;
    };
  };
}

export async function toggleFavoriteProductApi(productId: string): Promise<{ productId: string; isFavorite: boolean }> {
  const { data } = await apiClient.post<{ data: { productId: string; isFavorite: boolean } }>(
    `/api/favorites/products/${productId}/toggle`,
  );
  return data.data;
}

export async function toggleFavoriteProducerApi(producerId: string): Promise<{ producerId: string; isFavorite: boolean }> {
  const { data } = await apiClient.post<{ data: { producerId: string; isFavorite: boolean } }>(
    `/api/favorites/producers/${producerId}/toggle`,
  );
  return data.data;
}

export async function listFavoriteProductsApi(): Promise<FavoriteProductItem[]> {
  const { data } = await apiClient.get<{ data: { items: FavoriteProductItem[] } }>('/api/favorites/products');
  return data.data.items;
}

export async function listFavoriteProducersApi(): Promise<FavoriteProducerItem[]> {
  const { data } = await apiClient.get<{ data: { items: FavoriteProducerItem[] } }>('/api/favorites/producers');
  return data.data.items;
}
