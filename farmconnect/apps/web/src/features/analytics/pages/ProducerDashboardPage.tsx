import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, Boxes, LayoutDashboard, PackageCheck, ShoppingBag, Wallet } from 'lucide-react';

import { ProducerAiInsightWidgets } from '@/features/ai-insights/components/ProducerAiInsightWidgets';
import { useAuth } from '@/app/providers/AuthProvider';
import { formatOrderDate } from '@/features/orders/utils/order.utils';

import { useProducerAnalytics } from '../hooks/useProducerAnalytics';

export function ProducerDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [range, setRange] = useState<'today' | 'week'>('week');
  const analyticsQuery = useProducerAnalytics({
    range,
    lowStockThreshold: 10,
    lowSalesBottomN: 5,
  });

  const chartMaxRevenue = useMemo(() => {
    const points = analyticsQuery.data?.timeseries ?? [];
    const max = points.reduce((acc, point) => Math.max(acc, point.revenue), 0);
    return max > 0 ? max : 1;
  }, [analyticsQuery.data?.timeseries]);

  function money(value: number, currency = 'DZD') {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-teal-50 p-5 dark:border-sky-900/50 dark:from-sky-900/20 dark:via-gray-900 dark:to-teal-900/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <LayoutDashboard className="h-6 w-6 text-primary-600" />
              {t('analytics.producerTitle')}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {t('dashboard.welcomeBack', { name: user?.fullName ?? '' })}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('analytics.producerSubtitle')}</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-1 text-xs dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setRange('today')}
              className={[
                'rounded-md px-2 py-1 font-semibold',
                range === 'today'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {t('analytics.rangeToday')}
            </button>
            <button
              type="button"
              onClick={() => setRange('week')}
              className={[
                'rounded-md px-2 py-1 font-semibold',
                range === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {t('analytics.rangeWeek')}
            </button>
          </div>
        </div>
      </header>

      {analyticsQuery.isLoading ? (
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      ) : analyticsQuery.isError || !analyticsQuery.data ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {t('analytics.loadFailed')}
        </p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard icon={<Wallet className="h-4 w-4" />} label={t('analytics.totalRevenue')} value={money(analyticsQuery.data.kpis.totalRevenue)} tone="teal" />
            <KpiCard icon={<ShoppingBag className="h-4 w-4" />} label={t('analytics.totalOrders')} value={String(analyticsQuery.data.kpis.totalOrders)} tone="sky" />
            <KpiCard icon={<Boxes className="h-4 w-4" />} label={t('analytics.itemsSold')} value={String(analyticsQuery.data.kpis.itemsSold)} tone="amber" />
            <KpiCard icon={<BarChart3 className="h-4 w-4" />} label={t('analytics.avgOrderValue')} value={money(analyticsQuery.data.kpis.avgOrderValue)} tone="violet" />
            <KpiCard
              icon={<PackageCheck className="h-4 w-4" />}
              label={t('analytics.activeProducts')}
              value={String(analyticsQuery.data.kpis.activeProducts)}
              tone="emerald"
              onClick={() => navigate('/dashboard/products?status=ACTIVE')}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/20">
              <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">{t('analytics.lowStockTitle')}</h2>
              <div className="mt-3 space-y-2">
                {analyticsQuery.data.warnings.lowStockProducts.length ? (
                  analyticsQuery.data.warnings.lowStockProducts.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                      <span className="line-clamp-1">{item.title}</span>
                      <span className="font-semibold">{t('products.stock', { value: item.stock })}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-amber-800 dark:text-amber-300">{t('analytics.noLowStock')}</p>
                )}
              </div>
            </article>

            <article className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-900/20">
              <h2 className="text-sm font-semibold text-rose-900 dark:text-rose-200">{t('analytics.lowSalesTitle')}</h2>
              <div className="mt-3 space-y-2">
                {analyticsQuery.data.warnings.lowSalesProducts.length ? (
                  analyticsQuery.data.warnings.lowSalesProducts.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-xs text-rose-900 dark:text-rose-200">
                      <span className="line-clamp-1">{item.title}</span>
                      <span className="font-semibold">{money(item.revenue)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-rose-800 dark:text-rose-300">{t('analytics.noLowSales')}</p>
                )}
              </div>
            </article>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('ai.dashboardSectionTitle')}</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('ai.dashboardSectionSubtitle')}</p>
              </div>
              <Link
                to="/dashboard/ai-insights"
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-900/30 dark:text-indigo-300"
              >
                {t('ai.openFullInsights')}
              </Link>
            </div>

            <div className="mt-3">
              <ProducerAiInsightWidgets
                compact
                products={analyticsQuery.data.topProducts.map((item) => ({
                  id: item.productId,
                  label: item.title,
                }))}
                initialProductId={analyticsQuery.data.topProducts[0]?.productId}
              />
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-xl border border-gray-200 bg-white p-4 xl:col-span-2 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('analytics.dailyPerformance')}</h2>
              <div className="mt-4 flex h-44 items-end gap-1 overflow-x-auto">
                {analyticsQuery.data.timeseries.map((point) => {
                  const height = Math.max(8, Math.round((point.revenue / chartMaxRevenue) * 100));
                  return (
                    <div key={point.date} className="group flex min-w-6 flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-t bg-gradient-to-t from-sky-600 to-cyan-400 transition-opacity group-hover:opacity-85" style={{ height: `${height}%` }} />
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{point.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('analytics.statusBreakdown')}</h2>
              <div className="mt-3 space-y-2">
                {analyticsQuery.data.statusBreakdown.map((entry) => (
                  <div key={entry.status} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs dark:bg-gray-800/70">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{t(`orders.status.${entry.status}`, { defaultValue: entry.status })}</span>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-gray-700 dark:bg-gray-700 dark:text-gray-100">{entry.count}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('analytics.topProducts')}</h2>
              {analyticsQuery.data.topProducts.length ? (
                <div className="mt-3 overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                        <th className="pb-2">{t('analytics.product')}</th>
                        <th className="pb-2">{t('analytics.orders')}</th>
                        <th className="pb-2">{t('analytics.unitsSold')}</th>
                        <th className="pb-2 text-right">{t('analytics.revenue')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsQuery.data.topProducts.map((item) => (
                        <tr key={item.productId} className="border-t border-gray-100 text-xs text-gray-700 dark:border-gray-800 dark:text-gray-200">
                          <td className="py-2 font-medium">{item.title}</td>
                          <td className="py-2">{item.orders}</td>
                          <td className="py-2">{item.itemsSold}</td>
                          <td className="py-2 text-right font-semibold">{money(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('analytics.noTopProducts')}</p>
              )}
            </article>

            <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('analytics.recentOrders')}</h2>
              {analyticsQuery.data.recentOrders.length ? (
                <div className="mt-3 overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                        <th className="pb-2">{t('analytics.order')}</th>
                        <th className="pb-2">{t('analytics.buyer')}</th>
                        <th className="pb-2">{t('analytics.status')}</th>
                        <th className="pb-2">{t('analytics.date')}</th>
                        <th className="pb-2 text-right">{t('analytics.subtotal')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsQuery.data.recentOrders.map((order) => (
                        <tr key={order.id} className="border-t border-gray-100 text-xs text-gray-700 dark:border-gray-800 dark:text-gray-200">
                          <td className="py-2 font-semibold">#{order.id.slice(0, 8)}</td>
                          <td className="py-2">{order.buyerName}</td>
                          <td className="py-2">{t(`orders.status.${order.status}`, { defaultValue: order.status })}</td>
                          <td className="py-2">{formatOrderDate(order.createdAt)}</td>
                          <td className="py-2 text-right font-semibold">{money(order.subtotal, order.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('analytics.noRecentOrders')}</p>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: 'teal' | 'sky' | 'amber' | 'violet' | 'emerald';
  onClick?: () => void;
}) {
  const toneClass: Record<typeof tone, string> = {
    teal: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900/60 dark:bg-teal-900/20 dark:text-teal-200',
    sky: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-200',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-200',
    violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-900/20 dark:text-violet-200',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-200',
  };

  return (
    <article
      onClick={onClick}
      className={`rounded-xl border p-3 ${toneClass[tone]} ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (event) => (event.key === 'Enter' ? onClick() : undefined) : undefined}
    >
      <p className="inline-flex items-center gap-1 text-xs font-semibold">{icon}{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </article>
  );
}
