import { Link } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';

import { formatOrderDate } from '@/features/orders/utils/order.utils';

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../hooks/useNotifications';
import { getNotificationText } from '../utils/notification-text';
import { useNotificationVisibility } from '../state/notification-visibility';

function rowTone(readAt: string | null) {
  if (readAt) {
    return 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900';
  }

  return 'border-red-200 bg-red-50/80 dark:border-red-900/40 dark:bg-red-900/10';
}

export function NotificationPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const notificationsQuery = useNotifications({ limit: 8, offset: 0 });
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const items = useMemo(() => notificationsQuery.data?.items ?? [], [notificationsQuery.data?.items]);
  const { mode, visibleItems, clearOne, clearVisible, setMode } = useNotificationVisibility(items);

  async function onRead(id: string) {
    await markReadMutation.mutateAsync(id);
  }

  useEffect(() => {
    if (!open) return;

    function onDocumentClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('mousedown', onDocumentClick);
    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('mousedown', onDocumentClick);
      window.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          'relative inline-flex items-center rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
          compact ? 'h-9 w-9 justify-center p-0' : 'px-3 py-1.5',
        ].join(' ')}
        aria-label={
          unreadCount > 0
            ? t('notifications.ariaUnread', { count: unreadCount })
            : t('notifications.title')
        }
      >
        <Bell className="h-4 w-4" />
        {!compact ? <span className="ms-2">{t('notifications.title')}</span> : null}
        {unreadCount > 0 ? (
          <span
            className={[
              'inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white',
              compact ? 'absolute -top-1 end-[-0.25rem]' : 'ms-2',
            ].join(' ')}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute z-[70] mt-2 w-[min(92vw,360px)] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl ltr:right-0 rtl:left-0 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('notifications.title')}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => clearVisible()}
                disabled={!visibleItems.length}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                {t('notifications.clear')}
              </button>
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending || unreadCount === 0}
                className="rounded-md border border-primary-300 bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100 disabled:opacity-50 dark:border-primary-700/70 dark:bg-primary-900/40 dark:text-primary-200 dark:hover:bg-primary-900/60"
              >
                {t('notifications.markAllRead')}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2 text-xs dark:border-gray-800">
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

          <div className="max-h-[360px] space-y-2 overflow-auto p-3">
            {notificationsQuery.isLoading ? (
              <p className="text-sm text-gray-500">{t('notifications.loading')}</p>
            ) : visibleItems.length ? (
              visibleItems.map((item) => {
                const text = getNotificationText(item, t);

                return (
                  <article
                    key={item.id}
                    className={`rounded-xl border p-3 transition ${rowTone(item.readAt)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{text.title}</p>
                        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {t(`notifications.types.${item.type}`, { defaultValue: item.type })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!item.readAt ? (
                          <button
                            type="button"
                            onClick={() => onRead(item.id)}
                            className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700/70 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
                          >
                            {t('notifications.readAction')}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => clearOne(item.id)}
                          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                        >
                          {t('notifications.clear')}
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{text.body}</p>
                    <p className="mt-1 text-[11px] text-gray-500">{formatOrderDate(item.createdAt)}</p>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">{t('notifications.none')}</p>
            )}
          </div>

          <div className="border-t border-gray-200 px-4 py-2 text-end dark:border-gray-800">
            <Link
              to="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-primary-700 hover:text-primary-600"
            >
              {t('notifications.openPage')}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
