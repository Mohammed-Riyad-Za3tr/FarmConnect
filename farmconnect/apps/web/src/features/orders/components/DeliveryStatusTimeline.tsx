import { useTranslation } from 'react-i18next';

import { statusLabel, formatOrderDate } from '../utils/order.utils';
import type { DeliveryTrackingUpdate } from '../api/orders.api';

const STATUS_STEPS: Array<{
  code: DeliveryTrackingUpdate['status'];
  label: string;
}> = [
  { code: 'NOT_SHIPPED', label: 'Not shipped' },
  { code: 'PREPARING', label: 'Preparing' },
  { code: 'IN_TRANSIT', label: 'In transit' },
  { code: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { code: 'DELIVERED', label: 'Delivered' },
];

function statusIndex(status: DeliveryTrackingUpdate['status']) {
  const index = STATUS_STEPS.findIndex((step) => step.code === status);
  if (index >= 0) return index;

  if (status === 'FAILED_DELIVERY' || status === 'RETURNED') {
    return STATUS_STEPS.length - 1;
  }

  return 0;
}

export function DeliveryStatusTimeline({
  currentStatus,
  trackings,
}: {
  currentStatus: DeliveryTrackingUpdate['status'];
  trackings: DeliveryTrackingUpdate[];
}) {
  const { t } = useTranslation();
  const activeStep = statusIndex(currentStatus);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-5">
        {STATUS_STEPS.map((step, index) => {
          const done = index <= activeStep;
          return (
            <div key={step.code} className="flex items-center gap-2">
              <span
                className={[
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
                ].join(' ')}
              >
                {index + 1}
              </span>
              <p className={done ? 'text-xs font-semibold text-emerald-700 dark:text-emerald-300' : 'text-xs text-gray-500'}>
                {t(`orders.deliveryStatus.${step.code}`, { defaultValue: step.label })}
              </p>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {trackings.length ? (
          trackings
            .slice()
            .reverse()
            .map((tracking) => (
              <article key={tracking.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t(`orders.deliveryStatus.${tracking.status}`, { defaultValue: statusLabel(tracking.status) })}
                  </p>
                  <p className="text-xs text-gray-500">{formatOrderDate(tracking.occurredAt)}</p>
                </div>
                {tracking.location ? (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('orders.locationLine', { location: tracking.location })}</p>
                ) : null}
                {tracking.description ? (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{tracking.description}</p>
                ) : null}
              </article>
            ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
            {t('orders.noDeliveryUpdates')}
          </div>
        )}
      </div>
    </div>
  );
}
