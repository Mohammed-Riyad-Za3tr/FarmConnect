import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAdminAuditLogs } from '../hooks/useAdmin';
import type { AdminAuditAction } from '../api/admin.api';

const AUDIT_ACTIONS: AdminAuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VERIFY', 'REJECT', 'SUSPEND', 'UNSUSPEND'];

export function AdminAuditLogsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [action, setAction] = useState<'' | AdminAuditAction>('');
  const [targetType, setTargetType] = useState('');

  const query = useMemo(
    () => ({
      q: q.trim() || undefined,
      action: action || undefined,
      targetType: targetType.trim() || undefined,
      limit: 50,
      offset: 0,
    }),
    [action, q, targetType],
  );

  const logsQuery = useAdminAuditLogs(query);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('admin.auditLogs.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('admin.auditLogs.subtitle')}</p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label>
            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('common.search')}</span>
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              className={inputClass()}
              placeholder={t('admin.auditLogs.searchPlaceholder')}
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('admin.auditLogs.actionFilter')}</span>
            <select value={action} onChange={(event) => setAction(event.target.value as typeof action)} className={inputClass()}>
              <option value="">{t('admin.auditLogs.allActions')}</option>
              {AUDIT_ACTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('admin.auditLogs.targetTypeFilter')}</span>
            <input
              value={targetType}
              onChange={(event) => setTargetType(event.target.value)}
              className={inputClass()}
              placeholder={t('admin.auditLogs.targetTypePlaceholder')}
            />
          </label>
        </div>
      </section>

      {logsQuery.isLoading ? <p className="text-sm text-gray-500">{t('common.loading')}</p> : null}

      {logsQuery.data?.items.length ? (
        <>
          <div className="space-y-3 md:hidden">
            {logsQuery.data.items.map((item) => (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
                  <p className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">{item.action}</p>
                </div>

                <div className="mt-3 text-xs">
                  <p className="text-gray-500 dark:text-gray-400">{t('admin.auditLogs.actor')}</p>
                  {item.actor ? (
                    <div className="mt-0.5">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{item.actor.fullName}</p>
                      <p className="text-gray-500 dark:text-gray-400">{item.actor.email}</p>
                    </div>
                  ) : (
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{t('admin.auditLogs.systemActor')}</span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{t('admin.auditLogs.target')}</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-200">{item.targetType}</p>
                    <p className="text-gray-500 dark:text-gray-400">{item.targetId}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{t('admin.auditLogs.ipAddress')}</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-200">{item.ipAddress ?? '-'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2">{t('admin.auditLogs.date')}</th>
                  <th className="px-4 py-2">{t('admin.auditLogs.action')}</th>
                  <th className="px-4 py-2">{t('admin.auditLogs.actor')}</th>
                  <th className="px-4 py-2">{t('admin.auditLogs.target')}</th>
                  <th className="px-4 py-2">{t('admin.auditLogs.ipAddress')}</th>
                </tr>
              </thead>
              <tbody>
                {logsQuery.data.items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 text-xs text-gray-700 dark:border-gray-800 dark:text-gray-200">
                    <td className="px-4 py-2">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 font-semibold">{item.action}</td>
                    <td className="px-4 py-2">
                      {item.actor ? (
                        <div>
                          <p className="font-semibold">{item.actor.fullName}</p>
                          <p className="text-gray-500 dark:text-gray-400">{item.actor.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">{t('admin.auditLogs.systemActor')}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-semibold">{item.targetType}</p>
                      <p className="text-gray-500 dark:text-gray-400">{item.targetId}</p>
                    </td>
                    <td className="px-4 py-2">{item.ipAddress ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : logsQuery.isLoading ? null : (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t('admin.auditLogs.noResults')}
        </div>
      )}
    </div>
  );
}

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
}
