import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { CircleAlert, CreditCard, Landmark, Star } from 'lucide-react';
import type { AxiosError } from 'axios';

import { useAuth } from '@/app/providers/AuthProvider';
import { getApiErrorMessage } from '@/shared/utils/api-error';

import { OrderStatusBadge } from '../components/OrderStatusBadge';
import type { PaymentProvider } from '../api/orders.api';
import {
  useBuyerOrderDetail,
  useBuyerOrderPaymentStatus,
  useCreateReview,
  useCreatePaymentIntent,
} from '../hooks/useOrders';
import {
  asCurrency,
  formatOrderDate,
  readProductSnapshot,
  statusLabel,
  titleFromUnknown,
} from '../utils/order.utils';
import { generateInvoicePdf } from '../utils/invoice-pdf';

export function BuyerOrderDetailPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId ?? '';
  const query = useBuyerOrderDetail(orderId);
  const paymentQuery = useBuyerOrderPaymentStatus(orderId);
  const createIntentMutation = useCreatePaymentIntent();
  const [provider, setProvider] = useState<PaymentProvider>('STRIPE');
  const [stripeUnavailable, setStripeUnavailable] = useState(false);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string }>>({});
  const [reviewedItems, setReviewedItems] = useState<Record<string, boolean>>({});
  const createReviewMutation = useCreateReview();

  async function initiatePayment() {
    try {
      let result;
      let usedProvider = provider;

      try {
        result = await createIntentMutation.mutateAsync({
          orderId,
          payload: {
            provider,
            returnUrl: window.location.href,
          },
        });
      } catch (intentErr) {
        const intentMessage = getApiErrorMessage(intentErr, t('orders.couldNotInitiatePayment'));
        const intentStatus =
          typeof intentErr === 'object' &&
          intentErr !== null &&
          'response' in intentErr &&
          typeof (intentErr as { response?: { status?: number } }).response?.status === 'number'
            ? (intentErr as { response: { status: number } }).response.status
            : undefined;

        const isStripeUnavailable =
          provider === 'STRIPE' &&
          (
            intentStatus === 503 ||
            (
              intentMessage.toLowerCase().includes('stripe') &&
              (
                intentMessage.toLowerCase().includes('not configured') ||
                intentMessage.toLowerCase().includes('unavailable') ||
                intentMessage.toLowerCase().includes('failed')
              )
            )
          );

        if (!isStripeUnavailable) {
          throw intentErr;
        }

        usedProvider = 'BARIDIMOB';
        setStripeUnavailable(true);
        setProvider('BARIDIMOB');
        toast.error(t('orders.stripeUnavailableSwitching'));

        result = await createIntentMutation.mutateAsync({
          orderId,
          payload: {
            provider: 'BARIDIMOB',
            returnUrl: window.location.href,
          },
        });
      }

      if (result.alreadyPaid) {
        toast.success(t('orders.orderAlreadyPaid'));
        return;
      }

      toast.success(t('orders.paymentIntentCreated', { provider: usedProvider }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('orders.couldNotInitiatePayment')));
    }
  }

  async function submitReview(productId: string, itemId: string) {
    const draft = reviewDrafts[itemId];
    if (!draft?.rating) {
      toast.error(t('orders.reviewChooseRating'));
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        orderId,
        productId,
        rating: draft.rating,
        comment: draft.comment?.trim() || undefined,
      });
      setReviewedItems((prev) => ({ ...prev, [itemId]: true }));
      toast.success(t('orders.reviewSubmitted'));
    } catch (err) {
      const errorStatus = (err as AxiosError | undefined)?.response?.status;
      if (errorStatus === 409) {
        toast.error(t('orders.reviewAlreadySubmitted'));
        return;
      }
      toast.error(getApiErrorMessage(err, t('orders.reviewSubmitFailed')));
    }
  }

  useEffect(() => {
    const items = query.data?.items ?? [];
    if (!items.length) return;
    const reviewed = items.reduce<Record<string, boolean>>((acc, item) => {
      if (item.review) {
        acc[item.id] = true;
      }
      return acc;
    }, {});
    setReviewedItems((prev) => ({ ...prev, ...reviewed }));
  }, [query.data?.items]);

  if (query.isLoading) {
    return <p className="text-sm text-gray-500">{t('orders.loadingOrder')}</p>;
  }

  if (query.isError || !query.data) {
    return <p className="text-sm text-red-600">{t('orders.couldNotLoadOrderDetails')}</p>;
  }
  const orderData = query.data;
  const paymentStatusData = paymentQuery.data;
  const payment = paymentStatusData?.payment;
  const showInitiateAction =
    orderData.paymentStatus !== 'PAID' && orderData.status !== 'CANCELLED' && orderData.status !== 'REFUNDED';
  const canReviewOrder = orderData.status === 'DELIVERED' || orderData.deliveryStatus === 'DELIVERED';
  const qrPayload = orderData.deliveryVerificationToken
    ? `FC_DELIVERY_VERIFY|orderId=${orderData.id}|token=${orderData.deliveryVerificationToken}`
    : null;
  const qrUrl = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}`
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('orders.orderNumberShort', { id: orderData.id.slice(0, 8) })}</h1>
          <p className="text-sm text-gray-500">{t('orders.placedOn', { date: formatOrderDate(orderData.createdAt) })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              void generateInvoicePdf(orderData, {
                buyerName: orderData.buyerAddress?.recipientName ?? user?.fullName,
                paymentMethod: payment?.method ?? null,
              })
            }
            className="rounded-lg border border-primary-300 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/20"
          >
            {t('orders.downloadInvoicePdf')}
          </button>
          <Link to={`/dashboard/orders/${orderData.id}/tracking`} className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/20">
            {t('orders.trackOrder')}
          </Link>
          <Link to="/dashboard/orders" className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            {t('orders.backToOrders')}
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase tracking-wide text-gray-500">{t('orders.orderStatusLabel')}</p>
          <div className="mt-2"><OrderStatusBadge value={orderData.status} /></div>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase tracking-wide text-gray-500">{t('orders.paymentLabel')}</p>
          <div className="mt-2"><OrderStatusBadge value={orderData.paymentStatus} kind="payment" /></div>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs uppercase tracking-wide text-gray-500">{t('orders.deliveryLabel')}</p>
          <div className="mt-2"><OrderStatusBadge value={orderData.deliveryStatus} kind="delivery" /></div>
        </article>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('orders.paymentLabel')}</h2>

        {paymentQuery.isLoading ? (
          <p className="mt-2 text-sm text-gray-500">{t('orders.loadingPaymentStatus')}</p>
        ) : paymentQuery.isError ? (
          <p className="mt-2 text-sm text-red-600">{t('orders.couldNotLoadPaymentStatus')}</p>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-gray-900 dark:text-white">{t('orders.orderPaymentStatus')}:</span>{' '}
                {t(`orders.paymentStatus.${paymentStatusData?.orderPaymentStatus ?? orderData.paymentStatus}`, {
                  defaultValue: paymentStatusData?.orderPaymentStatus ?? orderData.paymentStatus,
                })}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium text-gray-900 dark:text-white">{t('orders.paymentMethod')}:</span>{' '}
                {payment?.method
                  ? t(`orders.paymentMethodValue.${payment.method}`, { defaultValue: payment.method })
                  : t('orders.notInitialized')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">
                <span className="font-medium text-gray-900 dark:text-white">{t('orders.gatewayReference')}:</span> {payment?.gatewayRef ?? t('orders.notAvailable')}
              </p>
            </div>

            {paymentStatusData?.orderPaymentStatus === 'PENDING' && payment?.method === 'CIB_CARD' ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                <p className="inline-flex items-center gap-1.5 font-semibold">
                  <CircleAlert className="h-3.5 w-3.5" />
                  {t('orders.stripePaymentPending')}
                </p>
                <p className="mt-1">
                  {t('orders.stripePendingHelp')}
                </p>
              </div>
            ) : null}

            {showInitiateAction ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('orders.initiateOrRetryPayment')}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setProvider('STRIPE')}
                    disabled={stripeUnavailable}
                    className={[
                      'rounded-lg border px-3 py-2 text-left text-sm text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-200',
                      provider === 'STRIPE'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 hover:border-primary-300 dark:border-gray-700',
                    ].join(' ')}
                  >
                    <span className="inline-flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Stripe
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('BARIDIMOB')}
                    className={[
                      'rounded-lg border px-3 py-2 text-left text-sm text-gray-700 transition dark:text-gray-200',
                      provider === 'BARIDIMOB'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 hover:border-primary-300 dark:border-gray-700',
                    ].join(' ')}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      {t('orders.baridimobLabel')}
                    </span>
                  </button>
                </div>
                {stripeUnavailable ? (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                    {t('orders.stripeUnavailableAutoBaridiMob')}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={initiatePayment}
                  disabled={createIntentMutation.isPending}
                  className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  {createIntentMutation.isPending ? t('orders.initiatingPayment') : t('orders.initiatePayment')}
                </button>
              </div>
            ) : null}

            {payment?.events?.length ? (
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('orders.recentPaymentEvents')}</p>
                <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  {payment.events.slice(0, 5).map((event) => (
                    <li key={event.id} className="rounded bg-gray-50 px-2 py-1 dark:bg-gray-800">
                      {event.type} - {formatOrderDate(event.createdAt)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {orderData.buyerAddress ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('orders.deliveryAddress')}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {orderData.buyerAddress.recipientName} - {orderData.buyerAddress.phone}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {orderData.buyerAddress.street}, {orderData.buyerAddress.commune}, {orderData.buyerAddress.wilaya}
          </p>
          {orderData.buyerAddress.postalCode ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('orders.postalCode', { code: orderData.buyerAddress.postalCode })}</p>
          ) : null}
        </section>
      ) : null}

      {orderData.deliveryMethod === 'DELIVERY' && qrUrl ? (
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('orders.deliveryHandoffQrTitle')}</h2>
          <p className="mt-1 text-xs text-gray-500">{t('orders.deliveryHandoffQrHelp')}</p>
          <div className="mt-3 flex flex-col items-start gap-2">
            <img src={qrUrl} alt={t('orders.deliveryHandoffQrTitle')} className="h-48 w-48 rounded-lg border border-gray-200 bg-white p-2" />
            <p className="text-xs text-gray-500 break-all">{t('orders.deliveryVerificationToken')}: {orderData.deliveryVerificationToken}</p>
            {orderData.verifiedAt ? (
              <p className="text-xs font-semibold text-emerald-700">
                {t('orders.deliveryVerifiedAt', { date: formatOrderDate(orderData.verifiedAt) })}
              </p>
            ) : (
              <p className="text-xs font-semibold text-amber-700">{t('orders.deliveryNotVerifiedYet')}</p>
            )}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('orders.itemsTitle')}</h2>
        {orderData.items.map((item) => {
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
                {item.product?.slug ? (
                  <Link to={`/products/${item.product.slug}`} className="text-sm font-semibold text-gray-900 hover:text-primary-700 dark:text-white">
                    {title}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {item.quantity} x {asCurrency(item.unitPrice, item.currency)}
                  {snapshot.unit
                    ? ` ${t('orders.perUnit', {
                        unit: t(`products.units.${snapshot.unit}`, { defaultValue: snapshot.unit }),
                      })}`
                    : ''}
                </p>
              </div>

              <p className="text-sm font-semibold text-primary-700">{asCurrency(item.total, item.currency)}</p>
              {item.recipePdfUrl ? (
                <div className="sm:col-span-3">
                  <a
                    href={item.recipePdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-md border border-primary-300 px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/20"
                  >
                    Download recipe
                  </a>
                </div>
              ) : null}

              {canReviewOrder && item.productId ? (
                <div className="sm:col-span-3 mt-2 rounded-lg border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-900/40 dark:bg-amber-900/10">
                  {reviewedItems[item.id] ? (
                    <p className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">{t('orders.reviewSubmittedThanks')}</p>
                  ) : (
                    <>
                      <div className="rounded-md bg-amber-100/80 px-3 py-2 dark:bg-amber-900/20">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{t('orders.rateProductAndProducer')}</p>
                        <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">{t('orders.reviewAffectsProducer')}</p>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setReviewDrafts((prev) => ({
                                ...prev,
                                [item.id]: { rating: value, comment: prev[item.id]?.comment ?? '' },
                              }))
                            }
                            className="text-amber-500"
                          >
                            <Star
                              className="h-5 w-5"
                              fill={(reviewDrafts[item.id]?.rating ?? 0) >= value ? 'currentColor' : 'none'}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewDrafts[item.id]?.comment ?? ''}
                        onChange={(e) =>
                          setReviewDrafts((prev) => ({
                            ...prev,
                            [item.id]: { rating: prev[item.id]?.rating ?? 0, comment: e.target.value },
                          }))
                        }
                        rows={2}
                        placeholder={t('orders.reviewOptionalComment')}
                        className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => submitReview(item.productId, item.id)}
                        disabled={createReviewMutation.isPending}
                        className="mt-2 rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {createReviewMutation.isPending ? t('orders.submittingReview') : t('orders.submitReview')}
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="flex items-center justify-between text-base font-semibold">
          <span>{t('orders.total')}</span>
          <span className="text-primary-700">{asCurrency(orderData.total, orderData.currency)}</span>
        </p>
        {orderData.notes ? (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">{t('orders.notesLabel')}:</span> {orderData.notes}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-gray-500">
          {t('orders.currentOrderStatus', {
            status: t(`orders.status.${orderData.status}`, { defaultValue: statusLabel(orderData.status) }),
          })}
        </p>
      </section>
    </div>
  );
}
