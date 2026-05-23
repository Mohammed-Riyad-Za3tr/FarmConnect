import { useCallback, useEffect, useMemo, useState } from 'react';

import type { InAppNotification } from '../api/notifications.api';

export type NotificationFilterMode = 'LAST_30_DAYS' | 'ACTIVE_PLUS_LAST_DELIVERED';

const HIDDEN_NOTIFICATION_IDS_KEY = 'fc_hidden_notifications';
const NOTIFICATION_FILTER_MODE_KEY = 'fc_notification_filter_mode';

function loadHiddenIds(): string[] {
  try {
    const raw = window.localStorage.getItem(HIDDEN_NOTIFICATION_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

function saveHiddenIds(ids: string[]) {
  window.localStorage.setItem(HIDDEN_NOTIFICATION_IDS_KEY, JSON.stringify(ids));
}

function loadFilterMode(): NotificationFilterMode {
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_FILTER_MODE_KEY);
    if (raw === 'LAST_30_DAYS' || raw === 'ACTIVE_PLUS_LAST_DELIVERED') {
      return raw;
    }
  } catch {
    // no-op
  }
  return 'LAST_30_DAYS';
}

function saveFilterMode(mode: NotificationFilterMode) {
  window.localStorage.setItem(NOTIFICATION_FILTER_MODE_KEY, mode);
}

function applyMode(items: InAppNotification[], mode: NotificationFilterMode): InAppNotification[] {
  if (mode === 'LAST_30_DAYS') {
    const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return items.filter((item) => new Date(item.createdAt).getTime() >= threshold);
  }

  const delivered = items
    .filter((item) => item.type === 'ORDER_DELIVERED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latestDelivered = delivered[0];

  return items.filter((item) => {
    if (item.type !== 'ORDER_DELIVERED') return true;
    return latestDelivered ? item.id === latestDelivered.id : false;
  });
}

export function useNotificationVisibility(items: InAppNotification[]) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [mode, setMode] = useState<NotificationFilterMode>('LAST_30_DAYS');

  useEffect(() => {
    setHiddenIds(loadHiddenIds());
    setMode(loadFilterMode());
  }, []);

  const visibleItems = useMemo(() => {
    const hidden = new Set(hiddenIds);
    return applyMode(items, mode).filter((item) => !hidden.has(item.id));
  }, [hiddenIds, items, mode]);

  const clearOne = useCallback((id: string) => {
    setHiddenIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveHiddenIds(next);
      return next;
    });
  }, []);

  const clearVisible = useCallback(() => {
    setHiddenIds((prev) => {
      const nextSet = new Set(prev);
      for (const item of visibleItems) {
        nextSet.add(item.id);
      }
      const next = Array.from(nextSet);
      saveHiddenIds(next);
      return next;
    });
  }, [visibleItems]);

  const updateMode = useCallback((nextMode: NotificationFilterMode) => {
    setMode(nextMode);
    saveFilterMode(nextMode);
  }, []);

  return {
    mode,
    visibleItems,
    clearOne,
    clearVisible,
    setMode: updateMode,
  };
}
