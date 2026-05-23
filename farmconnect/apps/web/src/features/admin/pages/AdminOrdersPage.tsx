import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatOrderDate } from '@/features/orders/utils/order.utils';

import { useAdminOrders } from '../hooks/useAdmin';
import type { AdminOrderStatus, AdminPaymentStatus } from '../api/admin.api';

const ORDER_STATUSES: AdminOrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

const PAYMENT_STATUSES: AdminPaymentStatus[] = [
  'UNPAID',
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
];

export function AdminOrdersPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'' | AdminOrderStatus>('');
  const [paymentStatus, setPaymentStatus] = useState<'' | AdminPaymentStatus>('');

  const query = useMemo(
    () => ({
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
      limit: 50,
      offset: 0,
    }),
    [paymentStatus, status],
  );

  const ordersQuery = useAdminOrders(query);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('admin.orders.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('admin.orders.subtitle')}</p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('admin.orders.statusFilter')}</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={inputClass()}>
              <option value="">{t('admin.orders.allStatuses')}</option>
              {ORDER_STATUSES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('admin.orders.paymentStatusFilter')}</span>
            <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as typeof paymentStatus)} className={inputClass()}>
              <option value="">{t('admin.orders.allPaymentStatuses')}</option>
              {PAYMENT_STATUSES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {ordersQuery.isLoading ? <p className="text-sm text-gray-500">{t('common.loading')}</p> : null}

      {ordersQuery.data?.items.length ? (
        <>
          <div className="space-y-3 md:hidden">
            {ordersQuery.data.items.map((item) => (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="font-semibold text-gray-900 dark:text-white">#{item.id.slice(0, 8)}</p>
                <p className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-200">{item.buyer.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.buyer.email}</p>

                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500 dark:text-gray-400">{t('admin.orders.status')}</dt>
                    <dd className="font-semibold text-gray-700 dark:text-gray-200">{item.status}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500 dark:text-gray-400">{t('admin.orders.paymentStatus')}</dt>
                    <dd className="font-semibold text-gray-700 dark:text-gray-200">{item.paymentStatus}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500 dark:text-gray-400">{t('admin.orders.items')}</dt>
                    <dd className="font-semibold text-gray-700 dark:text-gray-200">{item.itemsCount}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500 dark:text-gray-400">{t('admin.orders.date')}</dt>
                    <dd className="font-semibold text-gray-700 dark:text-gray-200">{formatOrderDate(item.createdAt)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500 dark:text-gray-400">{t('admin.orders.total')}</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">{item.total.toLocaleString()} {item.currency}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className="hidden overflow-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2">{t('admin.orders.order')}</th>
                  <th className="px-4 py-2">{t('admin.orders.buyer')}</th>
                  <th className="px-4 py-2">{t('admin.orders.status')}</th>
                  <th className="px-4 py-2">{t('admin.orders.paymentStatus')}</th>
                  <th className="px-4 py-2">{t('admin.orders.items')}</th>
                  <th className="px-4 py-2">{t('admin.orders.date')}</th>
                  <th className="px-4 py-2 text-right">{t('admin.orders.total')}</th>
                </tr>
              </thead>
              <tbody>
                {ordersQuery.data.items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 text-xs text-gray-700 dark:border-gray-800 dark:text-gray-200">
                    <td className="px-4 py-2 font-semibold">#{item.id.slice(0, 8)}</td>
                    <td className="px-4 py-2">
                      <p className="font-semibold">{item.buyer.fullName}</p>
                      <p className="text-gray-500 dark:text-gray-400">{item.buyer.email}</p>
                    </td>
                    <td className="px-4 py-2">{item.status}</td>
                    <td className="px-4 py-2">{item.paymentStatus}</td>
                    <td className="px-4 py-2">{item.itemsCount}</td>
                    <td className="px-4 py-2">{formatOrderDate(item.createdAt)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{item.total.toLocaleString()} {item.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : ordersQuery.isLoading ? null : (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t('admin.orders.noResults')}
        </div>
      )}
    </div>
  );
}

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
}
