import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getAdminDashboardSummaryApi,
  listAdminAuditLogsApi,
  listAdminOrdersApi,
  listAdminProductsApi,
  listAdminUsersApi,
  moderateAdminUserApi,
  moderateAdminProductApi,
  type ListAdminAuditLogsQuery,
  type ListAdminOrdersQuery,
  type ListAdminProductsQuery,
  type ListAdminUsersQuery,
  type AdminProductStatus,
} from '../api/admin.api';

export const adminKeys = {
  summary: ['admin', 'summary'] as const,
  users: (query: ListAdminUsersQuery) => ['admin', 'users', query] as const,
  products: (query: ListAdminProductsQuery) => ['admin', 'products', query] as const,
  orders: (query: ListAdminOrdersQuery) => ['admin', 'orders', query] as const,
  auditLogs: (query: ListAdminAuditLogsQuery) => ['admin', 'audit-logs', query] as const,
};

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: adminKeys.summary,
    queryFn: getAdminDashboardSummaryApi,
  });
}

export function useAdminUsers(query: ListAdminUsersQuery) {
  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => listAdminUsersApi(query),
  });
}

export function useModerateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      status,
      reason,
    }: {
      userId: string;
      status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
      reason?: string;
    }) => moderateAdminUserApi(userId, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useAdminProducts(query: ListAdminProductsQuery) {
  return useQuery({
    queryKey: adminKeys.products(query),
    queryFn: () => listAdminProductsApi(query),
  });
}

export function useModerateAdminProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, status }: { productId: string; status: AdminProductStatus }) =>
      moderateAdminProductApi(productId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'own'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useAdminOrders(query: ListAdminOrdersQuery) {
  return useQuery({
    queryKey: adminKeys.orders(query),
    queryFn: () => listAdminOrdersApi(query),
  });
}

export function useAdminAuditLogs(query: ListAdminAuditLogsQuery) {
  return useQuery({
    queryKey: adminKeys.auditLogs(query),
    queryFn: () => listAdminAuditLogsApi(query),
  });
}
