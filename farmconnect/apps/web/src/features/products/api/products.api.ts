import { apiClient } from '@/shared/api/client';
import type { CategoryDto } from '@farmconnect/shared';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';
export type ProductUnit = 'KG' | 'PIECE' | 'BOX';
export type ProductLogType = 'WATERING' | 'HARVEST' | 'FERTILIZE' | 'OTHER';

export interface LocalizedText {
  en?: string;
  ar?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
  createdAt: string;
}

export interface ProductBase {
  id: string;
  categoryId: string | null;
  title: LocalizedText;
  description: LocalizedText;
  slug: string;
  price: string | number;
  currency: string;
  unit: ProductUnit;
  recipePdfUrl?: string | null;
  harvestDate?: string | null;
  harvestWindowStart?: string | null;
  harvestWindowEnd?: string | null;
  isSeasonal?: boolean;
  seasonStartMonth?: number | null;
  seasonEndMonth?: number | null;
  stock: number;
  minOrderQty: number;
  maxOrderQty: number;
  status: ProductStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
}

export interface PublicProduct extends ProductBase {
  ratingAverage: number | null;
  ratingCount: number;
  isFavorite: boolean;
  hasActiveOffer: boolean;
  producer: {
    id: string;
    businessName: string;
    wilaya: string;
    commune: string;
    verificationStatus: string;
    latitude: number | string | null;
    longitude: number | string | null;
    user: {
      id: string;
      fullName: string;
      avatarUrl: string | null;
    };
    ratingAverage: number | null;
    ratingCount: number;
    isFavorite: boolean;
  };
  category: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    parentId: string | null;
  } | null;
  similarProducts?: Array<Omit<PublicProduct, 'similarProducts'>>;
}

export interface OwnProduct extends ProductBase {
  deletedAt?: string | null;
  category: {
    id: string;
    slug: string;
    nameEn: string;
    nameAr: string;
    parentId: string | null;
  } | null;
}

export type ProductCategory = CategoryDto;

export interface ListPublicProductsQuery {
  q?: string;
  categoryId?: string;
  categorySlug?: string;
  wilaya?: string;
  minPrice?: number;
  maxPrice?: number;
  buyerLat?: number;
  buyerLng?: number;
  inStockOnly?: boolean;
  onlyOffers?: boolean;
  onlyFavoriteProducers?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating_desc' | 'distance_asc';
}

export interface ListOwnProductsQuery {
  status?: ProductStatus;
  categoryId?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export interface UpsertProductPayload {
  categoryId?: string | null;
  title: LocalizedText;
  description: LocalizedText;
  slug?: string;
  price: number;
  currency: string;
  unit: ProductUnit;
  recipePdfUrl?: string | null;
  harvestDate?: string | null;
  harvestWindowStart?: string | null;
  harvestWindowEnd?: string | null;
  isSeasonal?: boolean;
  seasonStartMonth?: number | null;
  seasonEndMonth?: number | null;
  stock: number;
  minOrderQty: number;
  maxOrderQty: number;
  status: ProductStatus;
  tags: string[];
}

export interface PublicCatalogResponse {
  items: PublicProduct[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  distanceSortNote?: string;
}

export interface ProductLog {
  id: string;
  productId: string;
  type: ProductLogType;
  note: string;
  happenedAt: string;
  createdBy: string;
  createdAt: string;
}

export interface OwnProductsResponse {
  items: OwnProduct[];
  total: number;
  limit: number;
  offset: number;
}

function toParams(input: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (!value.length) return;
      params.set(key, value.join(','));
      return;
    }
    params.set(key, String(value));
  });
  return params;
}

export async function listPublicProductsApi(query: ListPublicProductsQuery): Promise<PublicCatalogResponse> {
  const { data } = await apiClient.get<{ data: PublicCatalogResponse }>('/api/products', {
    params: toParams(query as Record<string, unknown>),
  });
  return data.data;
}

export async function getPublicProductApi(slug: string): Promise<PublicProduct> {
  const { data } = await apiClient.get<{ data: { product: PublicProduct } }>(`/api/products/${slug}`);
  return data.data.product;
}

export async function listProductCategoriesApi(): Promise<ProductCategory[]> {
  const { data } = await apiClient.get<{ data: { categories: ProductCategory[] } }>('/api/products/categories');
  return data.data.categories;
}

export async function listOwnProductsApi(query: ListOwnProductsQuery): Promise<OwnProductsResponse> {
  const { data } = await apiClient.get<{ data: OwnProductsResponse }>('/api/products/me', {
    params: toParams(query as Record<string, unknown>),
  });
  return data.data;
}

export async function getOwnProductApi(productId: string): Promise<OwnProduct> {
  const { data } = await apiClient.get<{ data: { product: OwnProduct } }>(`/api/products/me/${productId}`);
  return data.data.product;
}

export async function createOwnProductApi(payload: UpsertProductPayload): Promise<OwnProduct> {
  const { data } = await apiClient.post<{ data: { product: OwnProduct } }>('/api/products/me', payload);
  return data.data.product;
}

export async function updateOwnProductApi(productId: string, payload: Partial<UpsertProductPayload>): Promise<OwnProduct> {
  const { data } = await apiClient.patch<{ data: { product: OwnProduct } }>(`/api/products/me/${productId}`, payload);
  return data.data.product;
}

export async function deleteOwnProductApi(productId: string): Promise<OwnProduct> {
  const { data } = await apiClient.delete<{ data: { product: OwnProduct } }>(`/api/products/me/${productId}`);
  return data.data.product;
}

export async function listOwnProductLogsApi(productId: string): Promise<ProductLog[]> {
  const { data } = await apiClient.get<{ data: { logs: ProductLog[] } }>(`/api/products/me/${productId}/logs`);
  return data.data.logs;
}

export async function createOwnProductLogApi(
  productId: string,
  payload: { type: ProductLogType; note: string; happenedAt: string },
): Promise<ProductLog> {
  const { data } = await apiClient.post<{ data: { log: ProductLog } }>(`/api/products/me/${productId}/logs`, payload);
  return data.data.log;
}
