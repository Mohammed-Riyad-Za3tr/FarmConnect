import { apiClient } from '@/shared/api/client';

export interface CartProductImage {
  url: string;
  altText: string | null;
  position: number;
}

export interface CartProduct {
  id: string;
  slug: string;
  title: unknown;
  price: string | number;
  currency: string;
  unit: string;
  stock: number;
  minOrderQty: number;
  maxOrderQty: number;
  status: string;
  producer: {
    id: string;
    userId: string;
    businessName: string;
    wilaya: string;
    commune: string;
    verificationStatus: string;
  };
  images: CartProductImage[];
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: CartProduct;
  unitPrice: number;
  lineTotal: number;
}

export interface CartSummary {
  itemsCount: number;
  subtotal: number;
  currency: string;
}

export interface Cart {
  id: string;
  buyerId: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
  summary: CartSummary;
}

export interface AddCartItemPayload {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

export async function getCartApi(): Promise<Cart> {
  const { data } = await apiClient.get<{ data: { cart: Cart } }>('/api/cart');
  return data.data.cart;
}

export async function addCartItemApi(payload: AddCartItemPayload): Promise<Cart> {
  const { data } = await apiClient.post<{ data: { cart: Cart } }>('/api/cart/items', payload);
  return data.data.cart;
}

export async function updateCartItemApi(productId: string, payload: UpdateCartItemPayload): Promise<Cart> {
  const { data } = await apiClient.patch<{ data: { cart: Cart } }>(`/api/cart/items/${productId}`, payload);
  return data.data.cart;
}

export async function removeCartItemApi(productId: string): Promise<Cart> {
  const { data } = await apiClient.delete<{ data: { cart: Cart } }>(`/api/cart/items/${productId}`);
  return data.data.cart;
}

export async function clearCartApi(): Promise<Cart> {
  const { data } = await apiClient.delete<{ data: { cart: Cart } }>('/api/cart');
  return data.data.cart;
}
