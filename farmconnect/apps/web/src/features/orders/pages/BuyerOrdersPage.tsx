import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/shared/utils/api-error';

import { ORDER_STATUS_VALUES, type OrderStatus } from '../api/orders.api';
import { useBuyerOrders } from '../hooks/useOrders';
import { asCurrency, formatOrderDate, statusLabel } from '../utils/order.utils';
import { OrderStatusBadge } from '../components/OrderStatusBadge';

export function BuyerOrdersPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  const status = (params.get('status') as OrderStatus | null) ?? '';
  const offset = Number(params.get('offset') ?? '0');
  const limit = 10;

  const query = useBuyerOrders({
    status: status || undefined,
    limit,
    offset,
  });

  function updateParam(key: string, value?: string) {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'offset') next.set('offset', '0');
    setParams(next);
  }

  if (query.isLoading) {
    return <p className="text-sm text-gray-500">{t('orders.loadingOrders')}</p>;
  }

  if (query.isError || !query.data) {
    return <p className="text-sm text-red-600">{getApiErrorMessage(query.error, t('orders.couldNotLoadYourOrders'))}</p>;
  }

  const hasMore = offset + query.data.items.length < query.data.total;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('orders.myOrders')}</h1>
        <select
          value={status}
          onChange={(e) => updateParam('status', e.target.value || undefined)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">{t('orders.allStatuses')}</option>
          {ORDER_STATUS_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`orders.status.${value}`, { defaultValue: statusLabel(value) })}
            </option>
          ))}
        </select>
      </div>

      {query.data.items.length ? (
        <div className="space-y-3">
          {query.data.items.map((order) => {
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <article key={order.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('orders.orderNumberShort', { id: order.id.slice(0, 8) })}</p>
                    <p className="text-xs text-gray-500">{t('orders.placedOn', { date: formatOrderDate(order.createdAt) })}</p>
                  </div>
                  <OrderStatusBadge value={order.status} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <span>{t('orders.itemsCount', { count: itemCount })}</span>
                  <span>{asCurrency(order.total, order.currency)}</span>
                  <span>{t('orders.paymentLabel')}: <OrderStatusBadge value={order.paymentStatus} kind="payment" /></span>
                </div>

                <div className="mt-4">
                  <Link
                    to={`/dashboard/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Eye className="h-4 w-4" />
                    {t('orders.viewDetails')}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700">
          {t('orders.noOrdersFound')}
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
        <span className="text-gray-700 dark:text-gray-200">
          {t('orders.showingRange', {
            start: Math.min(offset + 1, query.data.total),
            end: Math.min(offset + query.data.items.length, query.data.total),
            total: query.data.total,
          })}
        </span>
        <div className="flex gap-2">
          <button
            disabled={offset <= 0}
            onClick={() => updateParam('offset', String(Math.max(0, offset - limit)))}
            className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('common.previous')}
          </button>
          <button
            disabled={!hasMore}
            onClick={() => updateParam('offset', String(offset + limit))}
            className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {t('common.next')}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
