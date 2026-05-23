import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { CreditCard, Landmark, ReceiptText } from 'lucide-react';

import { useCart } from '@/features/cart/hooks/useCart';
import { ProductCard } from '@/features/products/components/ProductCard';
import { usePublicProduct } from '@/features/products/hooks/useProducts';
import { getApiErrorMessage } from '@/shared/utils/api-error';

import { type DeliveryMethod, type PaymentProvider } from '../api/orders.api';
import { useCheckoutFromCart, useCreatePaymentIntent } from '../hooks/useOrders';
import { asCurrency } from '../utils/order.utils';

export function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cartQuery = useCart();
  const checkoutMutation = useCheckoutFromCart();
  const createIntentMutation = useCreatePaymentIntent();

  const [addressId, setAddressId] = useState('');
  const [notes, setNotes] = useState('');
  const [payerName, setPayerName] = useState('');
  const [provider, setProvider] = useState<PaymentProvider>('BARIDIMOB');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('PICKUP');
  const [couponCode, setCouponCode] = useState('');
  const [stripeUnavailable, setStripeUnavailable] = useState(false);
  const deliveryFee = deliveryMethod === 'DELIVERY' ? 0 : 0;

  const cart = cartQuery.data;
  const firstCartItem = cart?.items[0];
  const suggestionsSeedQuery = usePublicProduct(firstCartItem?.product.slug ?? '');
  const cartProductIds = new Set((cart?.items ?? []).map((item) => item.product.id));
  const suggestions = (suggestionsSeedQuery.data?.similarProducts ?? [])
    .filter((item) => !cartProductIds.has(item.id))
    .slice(0, 6);

  const summary = useMemo(() => {
    if (!cart) {
      return { subtotal: 0, currency: 'DZD', itemsCount: 0 };
    }

    return {
      subtotal: cart.summary.subtotal,
      currency: cart.summary.currency,
      itemsCount: cart.summary.itemsCount,
    };
  }, [cart]);

  async function submitCheckout(e: React.FormEvent) {
    e.preventDefault();

    let createdOrderId: string | null = null;

    try {
      const preparedNotes = [
        notes.trim(),
        payerName.trim() ? `Payer name: ${payerName.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const order = await checkoutMutation.mutateAsync({
        deliveryMethod,
        couponCode: couponCode.trim() || undefined,
        addressId: deliveryMethod === 'DELIVERY' ? addressId.trim() || undefined : undefined,
        notes: preparedNotes || undefined,
      });
      createdOrderId = order.id;

      let intentResult;
      let usedProvider = provider;

      try {
        intentResult = await createIntentMutation.mutateAsync({
          orderId: order.id,
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

        intentResult = await createIntentMutation.mutateAsync({
          orderId: order.id,
          payload: {
            provider: 'BARIDIMOB',
            returnUrl: window.location.href,
          },
        });
      }

      if (intentResult.alreadyPaid) {
        toast.success(t('orders.orderAlreadyPaid'));
      } else {
        toast.success(t('orders.orderCreatedPaymentInitiated', { provider: usedProvider }));
      }

      navigate(`/dashboard/orders/${order.id}`);
    } catch (err) {
      const message = getApiErrorMessage(err, t('orders.couldNotPlaceOrPay'));

      if (createdOrderId) {
        toast.error(t('orders.orderCreatedContinuePayment', { message }));
        navigate(`/dashboard/orders/${createdOrderId}`);
        return;
      }

      toast.error(message);
    }
  }

  if (cartQuery.isLoading) {
    return <p className="text-sm text-gray-500">{t('orders.loadingCheckout')}</p>;
  }

  if (cartQuery.isError || !cart) {
    return <p className="text-sm text-red-600">{t('orders.couldNotLoadCheckoutCart')}</p>;
  }

  if (!cart.items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('orders.noItemsToCheckout')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('orders.emptyCartCheckoutHint')}</p>
        <Link
          to="/dashboard/cart"
          className="mt-6 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          {t('orders.goToCart')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('orders.checkout')}</h1>

        <form onSubmit={submitCheckout} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Delivery option</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod('PICKUP')}
                className={[
                  'rounded-xl border p-3 text-left transition',
                  deliveryMethod === 'PICKUP'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 hover:border-primary-300 dark:border-gray-700',
                ].join(' ')}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Pickup</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Collect from producer location.</p>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod('DELIVERY')}
                className={[
                  'rounded-xl border p-3 text-left transition',
                  deliveryMethod === 'DELIVERY'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 hover:border-primary-300 dark:border-gray-700',
                ].join(' ')}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Delivery</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  MVP: single producer cart required, producer must offer delivery.
                </p>
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Delivery fee: {asCurrency(deliveryFee, summary.currency)}
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="couponCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Coupon code (optional)
            </label>
            <input
              id="couponCode"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="e.g. SAVE10"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('orders.paymentMethod')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('orders.checkoutPaymentHint')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setProvider('STRIPE')}
                disabled={stripeUnavailable}
                className={[
                  'rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                  provider === 'STRIPE'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 hover:border-primary-300 dark:border-gray-700',
                ].join(' ')}
              >
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <CreditCard className="h-4 w-4" />
                  Stripe
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('orders.stripeDescription')}</p>
                <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">{t('orders.stripeMayBeUnavailable')}</p>
              </button>

              <button
                type="button"
                onClick={() => setProvider('BARIDIMOB')}
                className={[
                  'rounded-xl border p-3 text-left transition',
                  provider === 'BARIDIMOB'
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 hover:border-primary-300 dark:border-gray-700',
                ].join(' ')}
              >
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <Landmark className="h-4 w-4" />
                  BaridiMob
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('orders.baridimobDescription')}</p>
                <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">{t('orders.baridimobBestDemo')}</p>
              </button>
            </div>

            {stripeUnavailable ? (
              <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                {t('orders.stripeUnavailableAutoCheckout')}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="payerName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('orders.payerNameOptional')}
            </label>
            <input
              id="payerName"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              placeholder={t('orders.payerNamePlaceholder')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {deliveryMethod === 'DELIVERY' ? (
            <div className="space-y-1">
              <label htmlFor="addressId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Saved address ID
              </label>
              <input
                id="addressId"
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
                placeholder="Paste a saved address ID"
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Delivery currently needs a saved address record. Use pickup if you do not have one yet.
              </p>
            </div>
          ) : null}

          <div className="space-y-1">
            <label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('orders.orderNotesOptional')}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={t('orders.orderNotesPlaceholder')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={checkoutMutation.isPending || createIntentMutation.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            <ReceiptText className="h-4 w-4" />
            {checkoutMutation.isPending || createIntentMutation.isPending
              ? t('orders.placingAndInitiating')
              : t('orders.placeAndContinue')}
          </button>
        </form>
        </section>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('orders.orderSummary')}</h2>
        <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span className="line-clamp-1">
                {item.quantity} x {item.product.slug}
              </span>
              <span className="font-medium">{asCurrency(item.lineTotal, item.product.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-800">
          <p className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t('orders.itemsTitle')}</span>
            <span className="font-medium text-gray-900 dark:text-white">{summary.itemsCount}</span>
          </p>
          <p className="mt-2 flex items-center justify-between text-base font-semibold text-gray-900 dark:text-white">
            <span>{t('orders.total')}</span>
            <span className="text-primary-700">{asCurrency(summary.subtotal, summary.currency)}</span>
          </p>
          {couponCode.trim() ? (
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              Coupon will be validated on checkout.
            </p>
          ) : null}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t('orders.selectedProvider', { provider })}
          </p>
        </div>
        </aside>
      </div>

      {!!suggestions.length ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">You may also like</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {suggestions.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
