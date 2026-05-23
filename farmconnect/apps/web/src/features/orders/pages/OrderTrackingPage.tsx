import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import { useAuth } from '@/app/providers/AuthProvider';
import { getApiErrorMessage } from '@/shared/utils/api-error';

import { DELIVERY_STATUS_VALUES, type DeliveryStatus } from '../api/orders.api';
import { DeliveryStatusTimeline } from '../components/DeliveryStatusTimeline';
import { MapTrackerPlaceholder } from '../components/MapTrackerPlaceholder';
import { useAddDeliveryUpdate, useOrderTracking } from '../hooks/useOrders';
import { formatOrderDate, statusLabel } from '../utils/order.utils';

export function OrderTrackingPage() {
  const { t } = useTranslation();
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId ?? '';
  const { user } = useAuth();

  const trackingQuery = useOrderTracking(orderId);
  const updateMutation = useAddDeliveryUpdate(orderId);

  const [status, setStatus] = useState<DeliveryStatus>('PREPARING');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const latest = useMemo(() => {
    const updates = trackingQuery.data?.deliveryTrackings ?? [];
    if (!updates.length) return undefined;
    return updates[updates.length - 1];
  }, [trackingQuery.data?.deliveryTrackings]);

  async function submitUpdate(e: React.FormEvent) {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync({
        status,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
      });

      toast.success(t('orders.deliveryUpdatePosted'));
      setDescription('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('orders.couldNotPostDeliveryUpdate')));
    }
  }

  if (trackingQuery.isLoading) {
    return <p className="text-sm text-gray-500">{t('orders.loadingTracking')}</p>;
  }

  if (trackingQuery.isError || !trackingQuery.data) {
    return <p className="text-sm text-red-600">{t('orders.couldNotLoadOrderTracking')}</p>;
  }

  const order = trackingQuery.data;
  const isProducer = user?.role === 'PRODUCER';

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-lime-50 to-amber-50 p-5 dark:border-emerald-900/50 dark:from-emerald-900/20 dark:via-gray-900 dark:to-amber-900/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('orders.orderTrackingShort', { id: order.id.slice(0, 8) })}</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {t('orders.lastUpdated', { date: formatOrderDate(order.updatedAt) })}
            </p>
          </div>
          <Link
            to={`/dashboard/orders/${order.id}`}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {t('orders.backToOrder')}
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-white/70 bg-white/70 p-3 dark:border-gray-700 dark:bg-gray-900/60">
            <p className="text-xs uppercase tracking-wide text-gray-500">{t('orders.orderStatusLabel')}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{t(`orders.status.${order.status}`, { defaultValue: statusLabel(order.status) })}</p>
          </article>
          <article className="rounded-xl border border-white/70 bg-white/70 p-3 dark:border-gray-700 dark:bg-gray-900/60">
            <p className="text-xs uppercase tracking-wide text-gray-500">{t('orders.paymentLabel')}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{t(`orders.paymentStatus.${order.paymentStatus}`, { defaultValue: statusLabel(order.paymentStatus) })}</p>
          </article>
          <article className="rounded-xl border border-white/70 bg-white/70 p-3 dark:border-gray-700 dark:bg-gray-900/60">
            <p className="text-xs uppercase tracking-wide text-gray-500">{t('orders.deliveryLabel')}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{t(`orders.deliveryStatus.${order.deliveryStatus}`, { defaultValue: statusLabel(order.deliveryStatus) })}</p>
          </article>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <DeliveryStatusTimeline currentStatus={order.deliveryStatus} trackings={order.deliveryTrackings} />
        </div>
        <div className="space-y-4">
          <MapTrackerPlaceholder latest={latest} />

          {isProducer ? (
            <form onSubmit={submitUpdate} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('orders.postDeliveryUpdate')}</h2>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeliveryStatus)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                {DELIVERY_STATUS_VALUES.map((item) => (
                  <option key={item} value={item}>
                    {t(`orders.deliveryStatus.${item}`, { defaultValue: statusLabel(item) })}
                  </option>
                ))}
              </select>

              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('orders.locationOptional')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={t('orders.descriptionOptional')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {updateMutation.isPending ? t('orders.submitting') : t('orders.submitUpdate')}
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  );
}
