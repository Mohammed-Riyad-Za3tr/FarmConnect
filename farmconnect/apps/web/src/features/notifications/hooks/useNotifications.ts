import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  listNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  type ListNotificationsQuery,
} from '../api/notifications.api';

export const notificationKeys = {
  list: (query: ListNotificationsQuery) => ['notifications', query] as const,
  all: ['notifications'] as const,
};

export function useNotifications(query: ListNotificationsQuery) {
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => listNotificationsApi(query),
    refetchInterval: 20_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationReadApi(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
