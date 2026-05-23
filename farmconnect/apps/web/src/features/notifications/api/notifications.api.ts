import { apiClient } from '@/shared/api/client';

export type NotificationType =
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PRODUCT_LOW_STOCK'
  | 'PRODUCER_VERIFIED'
  | 'PRODUCER_REJECTED'
  | 'GENERAL';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export interface InAppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data: unknown;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface ListNotificationsQuery {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListNotificationsResponse {
  items: InAppNotification[];
  total: number;
  unreadCount: number;
  limit: number;
  offset: number;
}

function toParams(input: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  return params;
}

export async function listNotificationsApi(query: ListNotificationsQuery): Promise<ListNotificationsResponse> {
  const { data } = await apiClient.get<{ data: ListNotificationsResponse }>('/api/notifications', {
    params: toParams(query as Record<string, unknown>),
  });

  return data.data;
}

export async function markNotificationReadApi(notificationId: string): Promise<InAppNotification> {
  const { data } = await apiClient.patch<{ data: { notification: InAppNotification } }>(
    `/api/notifications/${notificationId}/read`,
  );

  return data.data.notification;
}

export async function markAllNotificationsReadApi(): Promise<{ updatedCount: number }> {
  const { data } = await apiClient.patch<{ data: { updatedCount: number } }>('/api/notifications/read-all');
  return data.data;
}
