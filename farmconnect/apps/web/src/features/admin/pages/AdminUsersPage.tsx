import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

import { getApiErrorMessage } from '@/shared/utils/api-error';

import { useAdminUsers, useModerateAdminUser } from '../hooks/useAdmin';

export function AdminUsersPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'' | 'BUYER' | 'PRODUCER' | 'ADMIN'>('');
  const [status, setStatus] = useState<'' | 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED'>('');

  const query = useMemo(
    () => ({
      q: q.trim() || undefined,
      role: role || undefined,
      status: status || undefined,
      limit: 50,
      offset: 0,
    }),
    [q, role, status],
  );

  const usersQuery = useAdminUsers(query);
  const moderateUserMutation = useModerateAdminUser();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('admin.users.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('admin.users.subtitle')}</p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="sm:col-span-2 lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('common.search')}</span>
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={t('admin.users.searchPlaceholder')}
                className="w-full bg-transparent text-sm text-gray-900 outline-none dark:text-gray-100"
              />
            </div>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('admin.users.roleFilter')}</span>
            <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className={inputClass()}>
              <option value="">{t('admin.users.allRoles')}</option>
              <option value="BUYER">BUYER</option>
              <option value="PRODUCER">PRODUCER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('admin.users.statusFilter')}</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={inputClass()}>
              <option value="">{t('admin.users.allStatuses')}</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
              <option value="DELETED">DELETED</option>
            </select>
          </label>
        </div>
      </section>

      {usersQuery.isLoading ? <p className="text-sm text-gray-500">{t('common.loading')}</p> : null}

      {usersQuery.data?.items.length ? (
        <>
          <div className="space-y-3 md:hidden">
            {usersQuery.data.items.map((item) => (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="font-semibold text-gray-900 dark:text-white">{item.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.email}</p>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500 dark:text-gray-400">{t('admin.users.role')}</dt>
                    <dd className="font-semibold text-gray-700 dark:text-gray-200">{item.role}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500 dark:text-gray-400">{t('admin.users.status')}</dt>
                    <dd className="font-semibold text-gray-700 dark:text-gray-200">{item.status}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500 dark:text-gray-400">{t('admin.users.profile')}</dt>
                    <dd className="font-semibold text-gray-700 dark:text-gray-200">
                      {item.producerProfile?.businessName ?? (item.buyerProfile ? t('admin.users.buyerProfile') : '-')}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500 dark:text-gray-400">{t('admin.users.createdAt')}</dt>
                    <dd className="font-semibold text-gray-700 dark:text-gray-200">{new Date(item.createdAt).toLocaleString()}</dd>
                  </div>
                </dl>
                {item.role !== 'ADMIN' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.status !== 'ACTIVE' ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await moderateUserMutation.mutateAsync({ userId: item.id, status: 'ACTIVE' });
                            toast.success('User reactivated');
                          } catch (error) {
                            toast.error(getApiErrorMessage(error, 'Failed to reactivate user'));
                          }
                        }}
                        className="rounded-md border border-emerald-300 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                      >
                        Reactivate
                      </button>
                    ) : null}
                    {item.status !== 'SUSPENDED' ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await moderateUserMutation.mutateAsync({ userId: item.id, status: 'SUSPENDED' });
                            toast.success('User suspended');
                          } catch (error) {
                            toast.error(getApiErrorMessage(error, 'Failed to suspend user'));
                          }
                        }}
                        className="rounded-md border border-amber-300 px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                      >
                        Suspend
                      </button>
                    ) : null}
                    {item.status !== 'DELETED' ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await moderateUserMutation.mutateAsync({ userId: item.id, status: 'DELETED' });
                            toast.success('User banned');
                          } catch (error) {
                            toast.error(getApiErrorMessage(error, 'Failed to ban user'));
                          }
                        }}
                        className="rounded-md border border-red-300 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                      >
                        Ban
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <div className="hidden overflow-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2">{t('admin.users.user')}</th>
                  <th className="px-4 py-2">{t('admin.users.role')}</th>
                  <th className="px-4 py-2">{t('admin.users.status')}</th>
                  <th className="px-4 py-2">{t('admin.users.profile')}</th>
                  <th className="px-4 py-2">{t('admin.users.createdAt')}</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 text-xs text-gray-700 dark:border-gray-800 dark:text-gray-200">
                    <td className="px-4 py-2">
                      <p className="font-semibold">{item.fullName}</p>
                      <p className="text-gray-500 dark:text-gray-400">{item.email}</p>
                    </td>
                    <td className="px-4 py-2">{item.role}</td>
                    <td className="px-4 py-2">{item.status}</td>
                    <td className="px-4 py-2">
                      {item.producerProfile?.businessName ?? (item.buyerProfile ? t('admin.users.buyerProfile') : '-')}
                    </td>
                    <td className="px-4 py-2">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      {item.role === 'ADMIN' ? (
                        <span className="text-gray-400">Protected</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {item.status !== 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await moderateUserMutation.mutateAsync({ userId: item.id, status: 'ACTIVE' });
                                  toast.success('User reactivated');
                                } catch (error) {
                                  toast.error(getApiErrorMessage(error, 'Failed to reactivate user'));
                                }
                              }}
                              className="rounded-md border border-emerald-300 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                            >
                              Reactivate
                            </button>
                          ) : null}
                          {item.status !== 'SUSPENDED' ? (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await moderateUserMutation.mutateAsync({ userId: item.id, status: 'SUSPENDED' });
                                  toast.success('User suspended');
                                } catch (error) {
                                  toast.error(getApiErrorMessage(error, 'Failed to suspend user'));
                                }
                              }}
                              className="rounded-md border border-amber-300 px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                            >
                              Suspend
                            </button>
                          ) : null}
                          {item.status !== 'DELETED' ? (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await moderateUserMutation.mutateAsync({ userId: item.id, status: 'DELETED' });
                                  toast.success('User banned');
                                } catch (error) {
                                  toast.error(getApiErrorMessage(error, 'Failed to ban user'));
                                }
                              }}
                              className="rounded-md border border-red-300 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                            >
                              Ban
                            </button>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : usersQuery.isLoading ? null : (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t('admin.users.noResults')}
        </div>
      )}
    </div>
  );
}

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
}
