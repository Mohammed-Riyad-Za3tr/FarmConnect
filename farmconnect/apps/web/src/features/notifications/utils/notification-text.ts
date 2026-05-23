import type { TFunction } from 'i18next';

import type { InAppNotification } from '../api/notifications.api';

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function orderRefFromNotification(item: InAppNotification): string {
  const data = asObject(item.data);
  const orderId = typeof data.orderId === 'string' ? data.orderId : '';
  if (orderId) return orderId.slice(0, 8);

  const match = item.title.match(/#([a-zA-Z0-9]{6,12})/);
  return match?.[1] ?? '--------';
}

function statusLabel(t: TFunction<'translation'>, rawStatus: string | undefined): string {
  if (!rawStatus) return '';
  return t(`orders.status.${rawStatus}`, { defaultValue: rawStatus.replaceAll('_', ' ') });
}

export function getNotificationText(
  item: InAppNotification,
  t: TFunction<'translation'>,
): { title: string; body: string } {
  const data = asObject(item.data);
  const ref = orderRefFromNotification(item);
  const dataStatus = typeof data.status === 'string' ? data.status : undefined;

  if (item.type === 'ORDER_PLACED') {
    return {
      title: t('notifications.messages.orderPlacedTitle', { orderRef: ref }),
      body: t('notifications.messages.orderPlacedBody'),
    };
  }

  if (
    item.type === 'ORDER_CONFIRMED' ||
    item.type === 'ORDER_SHIPPED' ||
    item.type === 'ORDER_DELIVERED' ||
    item.type === 'ORDER_CANCELLED' ||
    (item.type === 'GENERAL' && dataStatus)
  ) {
    const effectiveStatus =
      dataStatus ??
      (item.type === 'ORDER_CONFIRMED'
        ? 'CONFIRMED'
        : item.type === 'ORDER_SHIPPED'
          ? 'SHIPPED'
          : item.type === 'ORDER_DELIVERED'
            ? 'DELIVERED'
            : item.type === 'ORDER_CANCELLED'
              ? 'CANCELLED'
              : undefined);

    return {
      title: t('notifications.messages.orderStatusChangedTitle', { orderRef: ref }),
      body: t('notifications.messages.orderStatusChangedBody', {
        status: statusLabel(t, effectiveStatus),
      }),
    };
  }

  if (item.type === 'PAYMENT_SUCCESS') {
    return {
      title: t('notifications.messages.paymentSuccessTitle', { orderRef: ref }),
      body: t('notifications.messages.paymentSuccessBody'),
    };
  }

  if (item.type === 'PAYMENT_FAILED') {
    return {
      title: t('notifications.messages.paymentFailedTitle', { orderRef: ref }),
      body: t('notifications.messages.paymentFailedBody'),
    };
  }

  return {
    title: item.title,
    body: item.body,
  };
}
