import { useTranslation } from 'react-i18next';

import type { DeliveryTrackingUpdate } from '../api/orders.api';

export function MapTrackerPlaceholder({
  latest,
}: {
  latest: DeliveryTrackingUpdate | undefined;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50 p-5 dark:border-emerald-900/40 dark:from-emerald-900/10 dark:via-gray-900 dark:to-amber-900/10">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-2xl dark:bg-emerald-500/20" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-200/40 blur-2xl dark:bg-amber-500/20" />

      <div className="relative">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('orders.mapTrackerTitle')}</h3>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          {t('orders.mapTrackerDescription')}
        </p>

        <div className="mt-4 rounded-xl border border-white/70 bg-white/70 p-4 backdrop-blur dark:border-gray-700 dark:bg-gray-900/60">
          <p className="text-xs uppercase tracking-wide text-gray-500">{t('orders.latestKnownPosition')}</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
            {latest?.location ?? t('orders.noLocationShared')}
          </p>
          {latest?.description ? (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{latest.description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
