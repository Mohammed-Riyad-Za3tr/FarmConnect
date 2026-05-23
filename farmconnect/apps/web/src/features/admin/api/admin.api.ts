import { apiClient } from '@/shared/api/client';

export type AdminUserRole = 'BUYER' | 'PRODUCER' | 'ADMIN';
export type AdminUserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED';
export type AdminProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';
export type AdminOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';
  
export type AdminPaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';
export type AdminAuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'VERIFY'
  | 'REJECT'
  | 'SUSPEND'
  | 'UNSUSPEND';

export interface AdminDashboardSummary {
  counts: {
    usersTotal: number;
    buyersTotal: number;
    producersTotal: number;
    adminsTotal: number;
    productsTotal: number;
    productsActive: number;
    ordersTotal: number;
    pendingOrders: number;
    pendingVerifications: number;
  };
  paidRevenue: number;
  recentOrders: Array<{
    id: string;
    status: AdminOrderStatus;
    total: number;
    currency: string;
    createdAt: string;
    buyer: {
      fullName: string;
    };
  }>;
}

export interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  buyerProfile: { id: string } | null;
  producerProfile: {
    id: string;
    businessName: string;
    verificationStatus: string;
  } | null;
}

export interface AdminProductItem {
  id: string;
  slug: string;
  title: { en?: string; ar?: string };
  status: AdminProductStatus;
  price: number;
  currency: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
  producer: {
    id: string;
    businessName: string;
    verificationStatus: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    position: number;
  }>;
}

export interface AdminOrderItem {
  id: string;
  status: AdminOrderStatus;
  paymentStatus: AdminPaymentStatus;
  deliveryStatus: string;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
  buyer: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface AdminAuditLogItem {
  id: string;
  targetType: string;
  targetId: string;
  action: AdminAuditAction;
  changes: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    email: string;
    role: AdminUserRole;
  } | null;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ListAdminUsersQuery {
  q?: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  limit?: number;
  offset?: number;
}

export interface ListAdminProductsQuery {
  q?: string;
  status?: AdminProductStatus;
  limit?: number;
  offset?: number;
}

export interface ListAdminOrdersQuery {
  status?: AdminOrderStatus;
  paymentStatus?: AdminPaymentStatus;
  limit?: number;
  offset?: number;
}

export interface ListAdminAuditLogsQuery {
  q?: string;
  action?: AdminAuditAction;
  actorId?: string;
  targetType?: string;
  limit?: number;
  offset?: number;
}

function toParams(input: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  return params;
}

export async function getAdminDashboardSummaryApi(): Promise<AdminDashboardSummary> {
  const { data } = await apiClient.get<{ data: { summary: AdminDashboardSummary } }>('/api/admin/dashboard/summary');
  return data.data.summary;
}

export async function listAdminUsersApi(query: ListAdminUsersQuery): Promise<ListResponse<AdminUserItem>> {
  const { data } = await apiClient.get<{ data: ListResponse<AdminUserItem> }>('/api/admin/users', {
    params: toParams(query as Record<string, unknown>),
  });
  return data.data;
}

export async function moderateAdminUserApi(
  userId: string,
  payload: { status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'; reason?: string },
): Promise<AdminUserItem> {
  const { data } = await apiClient.patch<{ data: { user: AdminUserItem } }>(
    `/api/admin/users/${userId}/moderation`,
    payload,
  );
  return data.data.user;
}

export async function listAdminProductsApi(query: ListAdminProductsQuery): Promise<ListResponse<AdminProductItem>> {
  const { data } = await apiClient.get<{ data: ListResponse<AdminProductItem> }>('/api/admin/products', {
    params: toParams(query as Record<string, unknown>),
  });
  return data.data;
}

export async function moderateAdminProductApi(
  productId: string,
  payload: { status: AdminProductStatus; reason?: string },
): Promise<AdminProductItem> {
  const { data } = await apiClient.patch<{ data: { product: AdminProductItem } }>(
    `/api/admin/products/${productId}/moderation`,
    payload,
  );
  return data.data.product;
}

export async function listAdminOrdersApi(query: ListAdminOrdersQuery): Promise<ListResponse<AdminOrderItem>> {
  const { data } = await apiClient.get<{ data: ListResponse<AdminOrderItem> }>('/api/admin/orders', {
    params: toParams(query as Record<string, unknown>),
  });
  return data.data;
}

export async function listAdminAuditLogsApi(query: ListAdminAuditLogsQuery): Promise<ListResponse<AdminAuditLogItem>> {
  const { data } = await apiClient.get<{ data: ListResponse<AdminAuditLogItem> }>('/api/admin/audit-logs', {
    params: toParams(query as Record<string, unknown>),
  });
  return data.data;
}
