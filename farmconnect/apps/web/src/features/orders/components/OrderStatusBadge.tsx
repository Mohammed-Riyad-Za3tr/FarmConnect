import { useTranslation } from 'react-i18next';

import { statusLabel } from '../utils/order.utils';

interface OrderStatusBadgeProps {
  value: string;
  kind?: 'order' | 'payment' | 'delivery';
}

function toneClass(value: string, kind: 'order' | 'payment' | 'delivery') {
  if (kind === 'payment') {
    if (value === 'PAID') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (value === 'FAILED') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    if (value === 'UNPAID' || value === 'PENDING') {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }

  if (kind === 'delivery') {
    if (value === 'DELIVERED') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (value === 'IN_TRANSIT' || value === 'OUT_FOR_DELIVERY') {
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300';
    }
    if (value === 'FAILED_DELIVERY' || value === 'RETURNED') {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }

  if (value === 'PENDING' || value === 'CONFIRMED') {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  }
  if (value === 'PROCESSING' || value === 'SHIPPED') {
    return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300';
  }
  if (value === 'DELIVERED') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  }
  if (value === 'CANCELLED' || value === 'REFUNDED') {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  }

  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

export function OrderStatusBadge({ value, kind = 'order' }: OrderStatusBadgeProps) {
  const { t } = useTranslation();
  const group =
    kind === 'payment'
      ? 'paymentStatus'
      : kind === 'delivery'
        ? 'deliveryStatus'
        : 'status';

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${toneClass(value, kind)}`}>
      {t(`orders.${group}.${value}`, { defaultValue: statusLabel(value) })}
    </span>
  );
}
