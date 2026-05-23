import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Minus, PackageCheck, Plus, ShoppingCart, Trash2 } from 'lucide-react';

import { asCurrency } from '@/features/products/utils/product.utils';
import { ProductCard } from '@/features/products/components/ProductCard';
import { usePublicProduct } from '@/features/products/hooks/useProducts';
import { getApiErrorMessage } from '@/shared/utils/api-error';

import { useCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from '../hooks/useCart';

function titleFromUnknown(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object') {
    const maybe = value as Record<string, unknown>;
    if (typeof maybe.en === 'string' && maybe.en.trim()) return maybe.en;
    if (typeof maybe.ar === 'string' && maybe.ar.trim()) return maybe.ar;
  }
  return fallback;
}

export function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cartQuery = useCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const clearMutation = useClearCart();
  const cart = cartQuery.data;
  const firstCartItem = cart?.items[0];
  const suggestionsSeedQuery = usePublicProduct(firstCartItem?.product.slug ?? '');
  const cartProductIds = new Set((cart?.items ?? []).map((item) => item.product.id));
  const suggestions = (suggestionsSeedQuery.data?.similarProducts ?? [])
    .filter((item) => !cartProductIds.has(item.id))
    .slice(0, 6);

  async function changeQuantity(productId: string, quantity: number) {
    try {
      await updateMutation.mutateAsync({ productId, payload: { quantity } });
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('cart.couldNotUpdateQuantity')));
    }
  }

  async function removeItem(productId: string) {
    try {
      await removeMutation.mutateAsync(productId);
      toast.success(t('cart.itemRemoved'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('cart.couldNotRemoveItem')));
    }
  }

  async function clearCart() {
    try {
      await clearMutation.mutateAsync();
      toast.success(t('cart.cartCleared'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('cart.couldNotClearCart')));
    }
  }

  if (cartQuery.isLoading) {
    return <p className="text-sm text-gray-500">{t('cart.loading')}</p>;
  }

  if (cartQuery.isError || !cartQuery.data) {
    return <p className="text-sm text-red-600">{t('cart.couldNotLoad')}</p>;
  }

  if (!cart.items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('cart.emptyTitle')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('cart.emptySubtitle')}</p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <ShoppingCart className="h-4 w-4" />
          {t('cart.browseProducts')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('cart.myCart')}</h1>
          <button
            onClick={clearCart}
            disabled={clearMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {t('cart.clearCart')}
          </button>
        </div>

        {cart.items.map((item) => {
          const product = item.product;
          const title = titleFromUnknown(product.title, product.slug);
          const imageUrl = product.images[0]?.url;
          const minQty = product.minOrderQty;
          const maxQty = Math.min(product.maxOrderQty, product.stock);

          return (
            <article
              key={item.id}
              className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-[96px_1fr_auto]"
            >
              <div className="h-24 w-24 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {imageUrl ? (
                  <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-gray-500">{t('products.noImage')}</div>
                )}
              </div>

              <div className="space-y-1">
                <Link to={`/products/${product.slug}`} className="text-base font-semibold text-gray-900 hover:text-primary-700 dark:text-white">
                  {title}
                </Link>
                <p className="text-sm text-gray-500">
                  {t('products.producerSummary', {
                    businessName: product.producer.businessName,
                    wilaya: product.producer.wilaya,
                    commune: product.producer.commune,
                  })}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {asCurrency(item.unitPrice, product.currency)} {t('orders.perUnit', { unit: t(`products.units.${product.unit}`, { defaultValue: product.unit }) })}
                </p>
                <p className="text-sm font-semibold text-primary-700">{t('cart.lineTotal', { total: asCurrency(item.lineTotal, product.currency) })}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => changeQuantity(product.id, item.quantity - 1)}
                    disabled={item.quantity <= minQty || updateMutation.isPending}
                    className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-12 px-3 py-1 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(product.id, item.quantity + 1)}
                    disabled={item.quantity >= maxQty || updateMutation.isPending}
                    className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">{t('products.minMax', { min: minQty, max: maxQty })}</p>
                <button
                  type="button"
                  onClick={() => removeItem(product.id)}
                  disabled={removeMutation.isPending}
                  className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Trash2 className="h-3 w-3" />
                  {t('cart.remove')}
                </button>
              </div>
            </article>
          );
        })}
        </section>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white"><PackageCheck className="h-5 w-5 text-primary-600" />{t('cart.orderSummary')}</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">{t('cart.items')}</span>
            <span className="font-medium text-gray-800 dark:text-gray-100">{cart.summary.itemsCount}</span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-semibold dark:border-gray-800">
            <span>{t('orders.total')}</span>
            <span className="text-primary-700">{asCurrency(cart.summary.subtotal, cart.summary.currency)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/dashboard/checkout')}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <ShoppingCart className="h-4 w-4" />
          {t('cart.proceedToCheckout')}
        </button>
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
