import { apiClient } from '@/shared/api/client';

export const ORDER_STATUS_VALUES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'BANK_TRANSFER' | 'CIB_CARD' | 'EDAHABIA';

export type PaymentProvider = 'STRIPE' | 'BARIDIMOB';

export type PaymentEventType =
  | 'INITIATED'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CHARGEBACK';

export type DeliveryStatus =
  | 'NOT_SHIPPED'
  | 'PREPARING'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'RETURNED';

export const DELIVERY_STATUS_VALUES: DeliveryStatus[] = [
  'NOT_SHIPPED',
  'PREPARING',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED_DELIVERY',
  'RETURNED',
];

export type DeliveryMethod = 'PICKUP' | 'DELIVERY';

export interface OrderAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  wilaya: string;
  commune: string;
  street: string;
  postalCode: string | null;
}

export interface OrderBuyer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productSnapshot: unknown;
  quantity: number;
  unitPrice: string | number;
  total: string | number;
  currency: string;
  recipePdfUrl?: string | null;
  product: {
    id: string;
    slug: string;
    title: unknown;
    producerId: string;
    producer: {
      id: string;
      userId: string;
      businessName: string;
      wilaya: string;
      commune: string;
    };
  } | null;
  review?: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerAddressId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  deliveryMethod?: DeliveryMethod;
  deliveryFee?: string | number | null;
  deliveryVerificationToken?: string | null;
  verifiedAt?: string | null;
  couponCode?: string | null;
  discountAmount?: string | number | null;
  total: string | number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  buyerAddress?: OrderAddress | null;
  buyer?: OrderBuyer;
  items: OrderItem[];
}

export interface DeliveryTrackingUpdate {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  location: string | null;
  description: string | null;
  occurredAt: string;
}

export interface OrderTracking {
  id: string;
  buyerId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  total: string | number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  buyer?: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  deliveryTrackings: DeliveryTrackingUpdate[];
}

export interface PaymentEvent {
  id: string;
  type: PaymentEventType;
  payload: unknown;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: string | number;
  currency: string;
  gatewayRef: string | null;
  gatewayResponse: unknown;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  events: PaymentEvent[];
}

export interface CheckoutPayload {
  deliveryMethod: DeliveryMethod;
  couponCode?: string;
  addressId?: string;
  notes?: string;
}

export interface CreatePaymentIntentPayload {
  provider: PaymentProvider;
  returnUrl?: string;
}

export interface CreateDeliveryUpdatePayload {
  status: DeliveryStatus;
  location?: string;
  description?: string;
}

export interface PaymentIntentResult {
  provider: PaymentProvider;
  gatewayRef: string;
  status: 'PENDING' | 'REQUIRES_ACTION';
  clientSecret?: string;
  redirectUrl?: string;
  raw: Record<string, unknown>;
}

export interface CreatePaymentIntentResponse {
  orderId: string;
  orderPaymentStatus: PaymentStatus;
  payment: Payment | null;
  intent: PaymentIntentResult | null;
  alreadyPaid: boolean;
}

export interface OrderPaymentStatusResponse {
  orderId: string;
  orderPaymentStatus: PaymentStatus;
  payment: Payment | null;
}

export interface ListOrdersQuery {
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

export interface ListOrdersResponse {
  items: Order[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateReviewPayload {
  orderId: string;
  productId: string;
  rating: number;
  comment?: string;
}

export interface VerifyDeliveryTokenPayload {
  orderId: string;
  token: string;
}

function toParams(input: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  return params;
}

export async function checkoutFromCartApi(payload: CheckoutPayload): Promise<Order> {
  const { data } = await apiClient.post<{ data: { order: Order } }>('/api/orders/checkout', payload);
  return data.data.order;
}

export async function listBuyerOrdersApi(query: ListOrdersQuery): Promise<ListOrdersResponse> {
  const { data } = await apiClient.get<{ data: ListOrdersResponse }>('/api/orders/buyer', {
    params: toParams(query as Record<string, unknown>),
  });
  return data.data;
}

export async function getBuyerOrderDetailApi(orderId: string): Promise<Order> {
  const { data } = await apiClient.get<{ data: { order: Order } }>(`/api/orders/buyer/${orderId}`);
  return data.data.order;
}

export async function listProducerOrdersApi(query: ListOrdersQuery): Promise<ListOrdersResponse> {
  const { data } = await apiClient.get<{ data: ListOrdersResponse }>('/api/orders/producer', {
    params: toParams(query as Record<string, unknown>),
  });
  return data.data;
}

export async function getProducerOrderDetailApi(orderId: string): Promise<Order> {
  const { data } = await apiClient.get<{ data: { order: Order } }>(`/api/orders/producer/${orderId}`);
  return data.data.order;
}

export async function transitionProducerOrderStatusApi(
  orderId: string,
  status: OrderStatus,
): Promise<Order> {
  const { data } = await apiClient.patch<{ data: { order: Order } }>(
    `/api/orders/producer/${orderId}/status`,
    { status },
  );
  return data.data.order;
}

export async function createPaymentIntentApi(
  orderId: string,
  payload: CreatePaymentIntentPayload,
): Promise<CreatePaymentIntentResponse> {
  const { data } = await apiClient.post<{ data: CreatePaymentIntentResponse }>(
    `/api/payments/orders/${orderId}/intents`,
    payload,
  );

  return data.data;
}

export async function getOrderPaymentStatusApi(orderId: string): Promise<OrderPaymentStatusResponse> {
  const { data } = await apiClient.get<{ data: OrderPaymentStatusResponse }>(
    `/api/payments/orders/${orderId}/status`,
  );

  return data.data;
}

export async function getOrderTrackingApi(orderId: string): Promise<OrderTracking> {
  const { data } = await apiClient.get<{ data: { order: OrderTracking } }>(
    `/api/delivery/orders/${orderId}/tracking`,
  );

  return data.data.order;
}

export async function addDeliveryUpdateApi(
  orderId: string,
  payload: CreateDeliveryUpdatePayload,
): Promise<DeliveryTrackingUpdate> {
  const { data } = await apiClient.post<{ data: { tracking: DeliveryTrackingUpdate } }>(
    `/api/delivery/orders/${orderId}/updates`,
    payload,
  );

  return data.data.tracking;
}

export async function createReviewApi(payload: CreateReviewPayload): Promise<OrderItem['review']> {
  const { data } = await apiClient.post<{ data: { review: NonNullable<OrderItem['review']> } }>(
    '/api/reviews',
    payload,
  );
  return data.data.review;
}

export async function generateDeliveryVerificationTokenApi(orderId: string): Promise<Order> {
  const { data } = await apiClient.post<{ data: { order: Order } }>(
    `/api/orders/producer/${orderId}/delivery-verification-token`,
  );
  return data.data.order;
}

export async function verifyDeliveryTokenApi(payload: VerifyDeliveryTokenPayload): Promise<Order> {
  const { data } = await apiClient.post<{ data: { order: Order } }>(`/api/orders/delivery/verify`, payload);
  return data.data.order;
}
