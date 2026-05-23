import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../hooks/useNotifications';
import { formatOrderDate } from '@/features/orders/utils/order.utils';
import { useTranslation } from 'react-i18next';
import { BellRing, CheckCheck } from 'lucide-react';
import { getNotificationText } from '../utils/notification-text';
import { useNotificationVisibility } from '../state/notification-visibility';

function cardTone(readAt: string | null) {
  if (readAt) {
    return 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900';
  }

  return 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/10';
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const notificationsQuery = useNotifications({ limit: 100, offset: 0 });
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  const items = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const { mode, visibleItems, clearOne, clearVisible, setMode } = useNotificationVisibility(items);

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-lime-50 to-amber-50 p-5 dark:border-emerald-900/50 dark:from-emerald-900/20 dark:via-gray-900 dark:to-amber-900/10">
        <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-white"><BellRing className="h-6 w-6 text-primary-600" />{t('notifications.centerTitle')}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {t('notifications.centerSubtitle')}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {t('notifications.unreadCount', { count: unreadCount })}
          </span>
          <button
            type="button"
            onClick={() => clearVisible()}
            disabled={!visibleItems.length}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            {t('notifications.clearVisible')}
          </button>
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || unreadCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 disabled:opacity-50 dark:border-primary-700/70 dark:bg-primary-900/30 dark:text-primary-200 dark:hover:bg-primary-900/50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t('notifications.markAllRead')}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode('LAST_30_DAYS')}
            className={mode === 'LAST_30_DAYS' ? 'font-semibold text-primary-700' : 'text-gray-600 dark:text-gray-300'}
          >
            {t('notifications.last30Days')}
          </button>
          <span className="text-gray-400">|</span>
          <button
            type="button"
            onClick={() => setMode('ACTIVE_PLUS_LAST_DELIVERED')}
            className={mode === 'ACTIVE_PLUS_LAST_DELIVERED' ? 'font-semibold text-primary-700' : 'text-gray-600 dark:text-gray-300'}
          >
            {t('notifications.activePlusLastDelivered')}
          </button>
        </div>
      </header>

      {notificationsQuery.isLoading ? (
        <p className="text-sm text-gray-500">{t('notifications.loading')}</p>
      ) : visibleItems.length ? (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const text = getNotificationText(item, t);

            return (
              <article key={item.id} className={`rounded-xl border p-4 ${cardTone(item.readAt)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{text.title}</p>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {t(`notifications.types.${item.type}`, { defaultValue: item.type })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!item.readAt ? (
                      <button
                        type="button"
                        onClick={() => markReadMutation.mutate(item.id)}
                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700/70 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
                      >
                        {t('notifications.markRead')}
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-gray-500">{t('notifications.readState')}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => clearOne(item.id)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    >
                      {t('notifications.clear')}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{text.body}</p>
                <p className="mt-2 text-xs text-gray-500">{formatOrderDate(item.createdAt)}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700">
          {t('notifications.none')}
        </div>
      )}
    </div>
  );
}
