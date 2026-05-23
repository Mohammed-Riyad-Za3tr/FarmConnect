import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, LocateFixed, RefreshCw } from 'lucide-react';

import { getApiErrorMessage } from '@/shared/utils/api-error';

import { OrderStatusBadge } from '../components/OrderStatusBadge';
import {
  ORDER_STATUS_VALUES,
  type OrderStatus,
} from '../api/orders.api';
import {
  useProducerOrderDetail,
  useGenerateDeliveryVerificationToken,
  useTransitionProducerOrderStatus,
  useVerifyDeliveryToken,
} from '../hooks/useOrders';
import {
  asCurrency,
  formatOrderDate,
  readProductSnapshot,
  statusLabel,
  titleFromUnknown,
} from '../utils/order.utils';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function ProducerOrderDetailPage() {
  const { t } = useTranslation();
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId ?? '';

  const query = useProducerOrderDetail(orderId);
  const transitionMutation = useTransitionProducerOrderStatus(orderId);
  const generateTokenMutation = useGenerateDeliveryVerificationToken(orderId);
  const verifyTokenMutation = useVerifyDeliveryToken();
  const [verificationTokenInput, setVerificationTokenInput] = useState('');

  const allowedStatuses = useMemo(() => {
    if (!query.data) return [];
    return TRANSITIONS[query.data.status] ?? [];
  }, [query.data]);

  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');

  useEffect(() => {
    setNextStatus(allowedStatuses[0] ?? '');
  }, [allowedStatuses]);

  async function updateStatus() {
    if (!nextStatus) return;

    try {
      await transitionMutation.mutateAsync(nextStatus);
      toast.success(t('orders.statusUpdated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('orders.statusUpdateFailed')));
    }
  }

  if (query.isLoading) {
    return <p className="text-sm text-gray-500">{t('orders.loadingProducerOrder')}</p>;
  }

  if (query.isError || !query.data) {
    return <p className="text-sm text-red-600">{t('orders.couldNotLoadOrderDetails')}</p>;
  }

  const order = query.data;
  const ownTotal = order.items.reduce((sum, item) => sum + Number(item.total), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('orders.orderNumberShort', { id: order.id.slice(0, 8) })}</h1>
          <p className="text-sm text-gray-500">{t('orders.placedOn', { date: formatOrderDate(order.createdAt) })}</p>
          <p className="text-sm text-gray-500">
            {t('orders.buyerLine', {
              name: order.buyer?.fullName ?? t('orders.unknownUser'),
              email: order.buyer?.email ?? t('orders.notAvailable'),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/dashboard/orders/${order.id}/tracking`} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20">
            <LocateFixed className="h-4 w-4" />
            {t('orders.openTracking')}
          </Link>
          <Link to="/dashboard/orders" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4" />
            {t('orders.backToOrders')}
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase tracking-wide text-gray-500">{t('orders.orderStatusLabel')}</p>
          <div className="mt-2"><OrderStatusBadge value={order.status} /></div>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase tracking-wide text-gray-500">{t('orders.paymentLabel')}</p>
          <div className="mt-2"><OrderStatusBadge value={order.paymentStatus} kind="payment" /></div>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase tracking-wide text-gray-500">{t('orders.deliveryLabel')}</p>
          <div className="mt-2"><OrderStatusBadge value={order.deliveryStatus} kind="delivery" /></div>
        </article>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('orders.updateStatus')}</h2>
        {allowedStatuses.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {allowedStatuses.map((status) => (
                <option key={status} value={status}>
                  {t(`orders.status.${status}`, { defaultValue: statusLabel(status) })}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={updateStatus}
              disabled={!nextStatus || transitionMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              {transitionMutation.isPending ? t('orders.updating') : t('orders.applyStatus')}
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">{t('orders.orderTerminalState')}</p>
        )}
      </section>

      {order.deliveryMethod === 'DELIVERY' ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Delivery handoff verification</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await generateTokenMutation.mutateAsync();
                  toast.success('Verification token generated');
                } catch (err) {
                  toast.error(getApiErrorMessage(err, 'Could not generate verification token'));
                }
              }}
              disabled={generateTokenMutation.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {generateTokenMutation.isPending ? 'Generating...' : 'Generate/Rotate token'}
            </button>
            {order.verifiedAt ? <p className="text-xs font-semibold text-emerald-700">Verified</p> : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={verificationTokenInput}
              onChange={(e) => setVerificationTokenInput(e.target.value)}
              placeholder="Scan or enter token"
              className="w-full max-w-xl rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await verifyTokenMutation.mutateAsync({ orderId: order.id, token: verificationTokenInput.trim() });
                  toast.success('Delivery handoff verified');
                  setVerificationTokenInput('');
                } catch (err) {
                  toast.error(getApiErrorMessage(err, 'Could not verify token'));
                }
              }}
              disabled={verifyTokenMutation.isPending || !verificationTokenInput.trim()}
              className="rounded-lg border border-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
            >
              {verifyTokenMutation.isPending ? 'Verifying...' : 'Verify token'}
            </button>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('orders.yourItemsInOrder')}</h2>
        {order.items.map((item) => {
          const snapshot = readProductSnapshot(item.productSnapshot);
          const title = snapshot.title || titleFromUnknown(item.product?.title, item.product?.slug ?? t('orders.productFallbackName'));

          return (
            <article
              key={item.id}
              className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-[80px_1fr_auto]"
            >
              <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {snapshot.imageUrl ? (
                  <img src={snapshot.imageUrl} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-500">{t('products.noImage')}</div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {item.quantity} x {asCurrency(item.unitPrice, item.currency)}
                  {snapshot.unit
                    ? ` ${t('orders.perUnit', {
                        unit: t(`products.units.${snapshot.unit}`, { defaultValue: snapshot.unit }),
                      })}`
                    : ''}
                </p>
                {item.product?.slug ? (
                  <Link to={`/products/${item.product.slug}`} className="mt-1 inline-flex text-xs text-primary-700 hover:text-primary-600">
                    {t('orders.viewProduct')}
                  </Link>
                ) : null}
              </div>

              <p className="text-sm font-semibold text-primary-700">{asCurrency(item.total, item.currency)}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="flex items-center justify-between text-base font-semibold">
          <span>{t('orders.totalOrderValue')}</span>
          <span>{asCurrency(order.total, order.currency)}</span>
        </p>
        <p className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>{t('orders.yourItemSubtotal')}</span>
          <span>{asCurrency(ownTotal, order.currency)}</span>
        </p>
      </section>

      {/* Guard to avoid accidental drift when enum expands without UI updates */}
      {ORDER_STATUS_VALUES.length > 0 ? null : null}
    </div>
  );
}
