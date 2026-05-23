import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, BadgeCheck, ChevronLeft, ChevronRight, Heart, PencilLine, ShoppingCart, Star, UserRound, X } from 'lucide-react';
import type { AxiosError } from 'axios';

import { useAuth } from '@/app/providers/AuthProvider';
import { useAddCartItem } from '@/features/cart/hooks/useCart';
import { useToggleFavoriteProducer, useToggleFavoriteProduct } from '@/features/favorites/hooks/useFavorites';
import { ReportDialog } from '@/features/reports/components/ReportDialog';
import { useCreateReport } from '@/features/reports/hooks/useReports';
import { getApiErrorMessage } from '@/shared/utils/api-error';

import { usePublicProduct } from '../hooks/useProducts';
import {
  asCurrency,
  buildGoogleMapsDirectionsUrl,
  formatWilayaForDisplay,
  textFromLocalized,
} from '../utils/product.utils';
import { ProductCard } from '../components/ProductCard';

export function ProductDetailsPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? '';
  const query = usePublicProduct(slug);
  const addToCartMutation = useAddCartItem();
  const toggleFavoriteProductMutation = useToggleFavoriteProduct();
  const toggleFavoriteProducerMutation = useToggleFavoriteProducer();
  const createReportMutation = useCreateReport();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
  const [showProducerProfile, setShowProducerProfile] = useState(false);
  const [reportTarget, setReportTarget] = useState<null | { type: 'USER' | 'PRODUCT'; id: string; title: string }>(null);

  const minOrderQty = query.data?.minOrderQty;
  const imageCount = query.data?.images.length ?? 0;

  const hasImageGallery = imageCount > 1;

  useEffect(() => {
    if (typeof minOrderQty === 'number') {
      setQuantity(minOrderQty);
    }
  }, [minOrderQty]);

  useEffect(() => {
    setSelectedImageIndex(0);
    setShowProducerProfile(false);
  }, [slug]);

  useEffect(() => {
    if (imageCount > 0 && selectedImageIndex >= imageCount) {
      setSelectedImageIndex(0);
    }
  }, [imageCount, selectedImageIndex]);

  if (query.isLoading) {
    return <p className="text-sm text-gray-500">{t('products.loadingProduct')}</p>;
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">{t('products.productNotFound')}</p>
        <Link to="/products" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-500">
          <ArrowLeft className="h-4 w-4" />
          {t('products.backToProducts')}
        </Link>
      </div>
    );
  }

  const product = query.data;
  const title = textFromLocalized(product.title) || product.slug;
  const description = textFromLocalized(product.description);
  const selectedImage = product.images[selectedImageIndex] ?? product.images[0];
  const localizedUnit = t(`products.units.${product.unit}`, { defaultValue: product.unit });
  const productRating = product.ratingAverage ? product.ratingAverage.toFixed(1) : t('products.newRating');
  const producerRating = product.producer.ratingAverage ? product.producer.ratingAverage.toFixed(1) : t('products.newRating');
  const producerAvatarUrl =
    product.producer.user.avatarUrl ??
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(product.producer.businessName)}`;
  const mapsUrl = buildGoogleMapsDirectionsUrl({
    latitude: product.producer.latitude,
    longitude: product.producer.longitude,
    commune: product.producer.commune,
    wilaya: product.producer.wilaya,
  });
  const productReviewSummary = t('products.reviewsCount', { count: product.ratingCount });
  const producerReviewSummary = t('products.reviewsCount', { count: product.producer.ratingCount });

  async function addToCart() {
    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        quantity,
      });
      toast.success(t('products.addedToCart'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('products.addToCartFailed')));
    }
  }

  async function submitReport(payload: {
    reason: 'SPAM' | 'FRAUD' | 'ABUSE' | 'INAPPROPRIATE_CONTENT' | 'OTHER';
    description: string;
  }) {
    if (!reportTarget) return;
    try {
      await createReportMutation.mutateAsync({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: payload.reason,
        description: payload.description,
      });
      toast.success(t('products.reportSubmitted'));
      setReportTarget(null);
    } catch (err) {
      const errorStatus = (err as AxiosError | undefined)?.response?.status;
      if (errorStatus === 409) {
        toast.error(t('products.reportAlreadySubmitted'));
        return;
      }
      toast.error(getApiErrorMessage(err, t('products.reportFailed')));
    }
  }

  const canBuy = isAuthenticated && user?.role === 'BUYER';
  const canFavoriteProduct = isAuthenticated && user?.role === 'BUYER';
  const canFavoriteProducer = isAuthenticated && user?.role === 'BUYER';
  const canReport = isAuthenticated && (user?.role === 'BUYER' || user?.role === 'PRODUCER');
  const canEditOwnProduct = isAuthenticated && user?.role === 'PRODUCER' && user.id === product.producer.user.id;
  const maxSelectableQty = Math.min(product.stock, product.maxOrderQty);

  function goToNextImage() {
    if (!hasImageGallery) return;
    setSelectedImageIndex((prev) => (prev + 1) % imageCount);
  }

  function goToPreviousImage() {
    if (!hasImageGallery) return;
    setSelectedImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
  }

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    const firstTouch = e.targetTouches[0];
    if (!firstTouch) return;
    setTouchStartX(firstTouch.clientX);
    setTouchCurrentX(firstTouch.clientX);
  }

  function onTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    const firstTouch = e.targetTouches[0];
    if (!firstTouch) return;
    setTouchCurrentX(firstTouch.clientX);
  }

  function onTouchEnd() {
    if (touchStartX === null || touchCurrentX === null) {
      setTouchStartX(null);
      setTouchCurrentX(null);
      return;
    }

    const swipeDistance = touchStartX - touchCurrentX;
    if (Math.abs(swipeDistance) > 40) {
      if (swipeDistance > 0) {
        goToNextImage();
      } else {
        goToPreviousImage();
      }
    }

    setTouchStartX(null);
    setTouchCurrentX(null);
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div
          className="relative aspect-square bg-gray-100 dark:bg-gray-800"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {selectedImage?.url ? (
            <img src={selectedImage.url} alt={selectedImage.altText ?? title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">{t('products.noImage')}</div>
          )}

          {imageCount > 0 ? (
            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white">
              {selectedImageIndex + 1}/{imageCount}
            </span>
          ) : null}

          {hasImageGallery ? (
            <>
              <button
                type="button"
                onClick={goToPreviousImage}
                className="absolute left-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/75"
                aria-label={t('products.previousImage')}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goToNextImage}
                className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/75"
                aria-label={t('products.nextImage')}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2 p-2">
            {product.images.slice(0, 8).map((img, index) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={[
                  'overflow-hidden rounded border-2 transition focus:outline-none focus:ring-2 focus:ring-primary-500',
                  selectedImageIndex === index
                    ? 'border-primary-600'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600',
                ].join(' ')}
                aria-label={t('products.viewImageN', { index: index + 1 })}
              >
                <img src={img.url} alt={img.altText ?? title} className="h-16 w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className="h-4 w-4"
                fill={index < Math.round(product.ratingAverage ?? 0) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">
              {productRating} ({productReviewSummary})
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300">{description}</p>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          {canEditOwnProduct ? (
            <div className="mb-3">
              <Link
                to={`/dashboard/products/${product.id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg border border-primary-300 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/20"
              >
                <PencilLine className="h-3.5 w-3.5" />
                {t('products.editProduct')}
              </Link>
            </div>
          ) : null}

          <p className="text-xl font-bold text-primary-700">{asCurrency(product.price, product.currency)}</p>
          <p className="text-sm text-gray-500">{t('products.perUnit', { unit: localizedUnit })}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('products.stock', { value: product.stock })}</p>
          {product.harvestDate ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('products.harvestDateLabel')}: {new Date(product.harvestDate).toLocaleDateString()}
            </p>
          ) : null}
          {product.harvestWindowStart && product.harvestWindowEnd ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('products.harvestWindowLabel')}: {new Date(product.harvestWindowStart).toLocaleDateString()} - {new Date(product.harvestWindowEnd).toLocaleDateString()}
            </p>
          ) : null}
          {product.isSeasonal ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('products.seasonalLabel')}: {product.seasonStartMonth ?? '-'} {t('products.toLabel')} {product.seasonEndMonth ?? '-'}
            </p>
          ) : null}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('products.minMax', { min: product.minOrderQty, max: product.maxOrderQty })}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t('products.producerSummary', {
              businessName: product.producer.businessName,
              wilaya: formatWilayaForDisplay(product.producer.wilaya),
              commune: product.producer.commune,
            })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {canFavoriteProduct ? (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const result = await toggleFavoriteProductMutation.mutateAsync(product.id);
                    toast.success(result.isFavorite ? t('products.favoriteProductAdded') : t('products.favoriteProductRemoved'));
                  } catch (error) {
                    toast.error(getApiErrorMessage(error, t('products.favoriteProductFailed')));
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/20"
              >
                <Heart className="h-3.5 w-3.5" fill={product.isFavorite ? 'currentColor' : 'none'} />
                {product.isFavorite ? t('products.favoritedProduct') : t('products.favoriteProduct')}
              </button>
            ) : null}
            {canReport ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                onClick={() => setReportTarget({ type: 'PRODUCT', id: product.id, title })}
              >
                {t('products.reportProduct')}
              </button>
            ) : null}
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
              >
                {t('products.openInGoogleMaps')}
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setShowProducerProfile((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-primary-300 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-300 dark:hover:bg-primary-900/20"
            >
              <UserRound className="h-3.5 w-3.5" />
              {showProducerProfile ? t('products.hideProducerProfile') : t('products.viewProducerProfile')}
            </button>
          </div>

          {showProducerProfile ? (
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <img
                    src={producerAvatarUrl}
                    alt={product.producer.user.fullName || product.producer.businessName}
                    className="h-12 w-12 rounded-full border border-gray-200 object-cover dark:border-gray-700"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {product.producer.user.fullName || product.producer.businessName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.producer.businessName}</p>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                      {t('products.producerLocation', {
                        wilaya: formatWilayaForDisplay(product.producer.wilaya),
                        commune: product.producer.commune,
                      })}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <BadgeCheck className="h-3 w-3" />
                      {t(`products.verification.${product.producer.verificationStatus}`, {
                        defaultValue: product.producer.verificationStatus,
                      })}
                    </p>
                    <p className="mt-2 text-xs text-amber-600">
                      {t('products.producerRatingLabel')}: {producerRating} ({producerReviewSummary})
                    </p>
                    {canFavoriteProducer ? (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const result = await toggleFavoriteProducerMutation.mutateAsync(product.producer.id);
                            toast.success(result.isFavorite ? t('products.favoriteProducerAdded') : t('products.favoriteProducerRemoved'));
                          } catch (error) {
                            toast.error(getApiErrorMessage(error, t('products.favoriteProducerFailed')));
                          }
                        }}
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        <Heart className="h-3.5 w-3.5" fill={product.producer.isFavorite ? 'currentColor' : 'none'} />
                        {product.producer.isFavorite ? t('products.favoritedProducer') : t('products.favoriteProducer')}
                      </button>
                    ) : null}
                    {canReport ? (
                      <button
                        type="button"
                        onClick={() =>
                          setReportTarget({
                            type: 'USER',
                            id: product.producer.user.id,
                            title: product.producer.user.fullName || product.producer.businessName,
                          })
                        }
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        {t('products.reportProducer')}
                      </button>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProducerProfile(false)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  aria-label={t('common.close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {canBuy ? (
            <div className="mt-4 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('products.quantity')}
              </label>
              <input
                id="quantity"
                type="number"
                min={product.minOrderQty}
                max={maxSelectableQty}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={addToCart}
                disabled={
                  addToCartMutation.isPending ||
                  quantity < product.minOrderQty ||
                  quantity > maxSelectableQty
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                <ShoppingCart className="h-4 w-4" />
                {addToCartMutation.isPending ? t('products.adding') : t('products.addToCart')}
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {isAuthenticated
                ? t('products.onlyBuyersCanAdd')
                : t('products.loginAsBuyer')}
            </div>
          )}
        </div>

        {!!product.tags.length && (
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-gray-300 px-2 py-1 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">
                {tag}
              </span>
            ))}
          </div>
        )}
        </div>
      </div>

      {!!product.similarProducts?.length ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('products.similarProducts')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {product.similarProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      {canReport ? (
        <ReportDialog
          open={!!reportTarget}
          title={reportTarget ? `${t('products.reportTitlePrefix')} ${reportTarget.title}` : t('products.reportTitlePrefix')}
          busy={createReportMutation.isPending}
          onCancel={() => setReportTarget(null)}
          onSubmit={submitReport}
        />
      ) : null}
    </div>
  );
}
