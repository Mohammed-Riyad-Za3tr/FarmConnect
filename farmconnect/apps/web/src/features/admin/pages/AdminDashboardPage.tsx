import { useTranslation } from 'react-i18next';
import { Boxes, ClipboardList, ShieldCheck, Store, UserRound, Wallet } from 'lucide-react';

import { formatOrderDate } from '@/features/orders/utils/order.utils';
import { useAdminDashboardSummary } from '../hooks/useAdmin';

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const summaryQuery = useAdminDashboardSummary();

  function money(value: number, currency = 'DZD') {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <ShieldCheck className="h-6 w-6 text-primary-600" />
          {t('nav.admin')}
        </h1>
        <p className="mt-1 text-gray-500">{t('admin.platformOverview')}</p>
      </header>

      {summaryQuery.isLoading ? <p className="text-sm text-gray-500">{t('common.loading')}</p> : null}

      {summaryQuery.data ? (
        <>
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Card icon={<UserRound className="h-4 w-4" />} label={t('admin.dashboard.totalUsers')} value={String(summaryQuery.data.counts.usersTotal)} />
            <Card icon={<Store className="h-4 w-4" />} label={t('admin.dashboard.activeProducts')} value={String(summaryQuery.data.counts.productsActive)} />
            <Card icon={<ClipboardList className="h-4 w-4" />} label={t('admin.dashboard.totalOrders')} value={String(summaryQuery.data.counts.ordersTotal)} />
            <Card icon={<Wallet className="h-4 w-4" />} label={t('admin.dashboard.paidRevenue')} value={money(summaryQuery.data.paidRevenue)} />
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Boxes className="h-4 w-4 text-primary-600" />
                {t('admin.dashboard.breakdown')}
              </h2>
              <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-200">
                <Row label={t('admin.dashboard.buyers')} value={summaryQuery.data.counts.buyersTotal} />
                <Row label={t('admin.dashboard.producers')} value={summaryQuery.data.counts.producersTotal} />
                <Row label={t('admin.dashboard.admins')} value={summaryQuery.data.counts.adminsTotal} />
                <Row label={t('admin.dashboard.totalProducts')} value={summaryQuery.data.counts.productsTotal} />
                <Row label={t('admin.dashboard.pendingOrders')} value={summaryQuery.data.counts.pendingOrders} />
                <Row label={t('admin.dashboard.pendingVerifications')} value={summaryQuery.data.counts.pendingVerifications} />
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4 xl:col-span-2 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('admin.dashboard.recentOrders')}</h2>
              {summaryQuery.data.recentOrders.length ? (
                <>
                  <div className="mt-3 space-y-2 md:hidden">
                    {summaryQuery.data.recentOrders.map((order) => (
                      <article key={order.id} className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 text-xs dark:border-gray-700 dark:bg-gray-800/50">
                        <p className="font-semibold text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</p>
                        <p className="mt-1 text-gray-700 dark:text-gray-200">{order.buyer.fullName}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                          <span className="text-gray-500 dark:text-gray-400">{t('admin.dashboard.status')}</span>
                          <span className="text-gray-700 dark:text-gray-200">{t(`orders.status.${order.status}`, { defaultValue: order.status })}</span>
                          <span className="text-gray-500 dark:text-gray-400">{t('admin.dashboard.date')}</span>
                          <span className="text-gray-700 dark:text-gray-200">{formatOrderDate(order.createdAt)}</span>
                          <span className="text-gray-500 dark:text-gray-400">{t('admin.dashboard.total')}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{money(order.total, order.currency)}</span>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-3 hidden overflow-auto md:block">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                          <th className="pb-2">{t('admin.dashboard.order')}</th>
                          <th className="pb-2">{t('admin.dashboard.buyer')}</th>
                          <th className="pb-2">{t('admin.dashboard.status')}</th>
                          <th className="pb-2">{t('admin.dashboard.date')}</th>
                          <th className="pb-2 text-right">{t('admin.dashboard.total')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryQuery.data.recentOrders.map((order) => (
                          <tr key={order.id} className="border-t border-gray-100 text-xs text-gray-700 dark:border-gray-800 dark:text-gray-200">
                            <td className="py-2 font-semibold">#{order.id.slice(0, 8)}</td>
                            <td className="py-2">{order.buyer.fullName}</td>
                            <td className="py-2">{t(`orders.status.${order.status}`, { defaultValue: order.status })}</td>
                            <td className="py-2">{formatOrderDate(order.createdAt)}</td>
                            <td className="py-2 text-right font-semibold">{money(order.total, order.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('admin.dashboard.noRecentOrders')}</p>
              )}
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">{icon}{label}</p>
      <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    </article>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <p className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/70">
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}
