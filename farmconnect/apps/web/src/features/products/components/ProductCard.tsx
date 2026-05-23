import { Heart, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuth } from '@/app/providers/AuthProvider';
import { useToggleFavoriteProduct } from '@/features/favorites/hooks/useFavorites';
import { getApiErrorMessage } from '@/shared/utils/api-error';

import type { PublicProduct } from '../api/products.api';
import {
  asCurrency,
  buildGoogleMapsDirectionsUrl,
  computeDistanceKm,
  formatDistanceKm,
  formatWilayaForDisplay,
  textFromLocalized,
} from '../utils/product.utils';

export function ProductCard({
  product,
  buyerCoords,
}: {
  product: PublicProduct;
  buyerCoords?: { lat: number; lng: number };
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toggleFavoriteMutation = useToggleFavoriteProduct();
  const image = product.images[0]?.url;
  const title = textFromLocalized(product.title) || product.slug;
  const description = textFromLocalized(product.description);
  const ratingValue = product.ratingAverage ?? 0;
  const ratingLabel = product.ratingAverage ? product.ratingAverage.toFixed(1) : t('products.newRating');
  const reviewSummary = t('products.reviewsCount', { count: product.ratingCount });
  const distanceKm = buyerCoords
    ? computeDistanceKm(
        buyerCoords.lat,
        buyerCoords.lng,
        product.producer.latitude,
        product.producer.longitude,
      )
    : null;
  const mapsUrl = buildGoogleMapsDirectionsUrl({
    latitude: product.producer.latitude,
    longitude: product.producer.longitude,
    commune: product.producer.commune,
    wilaya: product.producer.wilaya,
  });

  const canFavorite = user?.role === 'BUYER';

  async function onFavoriteClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!canFavorite || toggleFavoriteMutation.isPending) return;
    try {
      const result = await toggleFavoriteMutation.mutateAsync(product.id);
      toast.success(result.isFavorite ? t('products.favoriteProductAdded') : t('products.favoriteProductRemoved'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('products.favoriteProductFailed')));
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative h-44 w-full bg-gray-100 dark:bg-gray-800">
          {image ? (
            <img src={image} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-500">{t('products.noImage')}</div>
          )}
          {canFavorite ? (
            <button
              type="button"
              onClick={(event) => {
                void onFavoriteClick(event);
              }}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-rose-600 shadow hover:bg-white"
              aria-label={t('products.toggleFavorite')}
            >
              <Heart className="h-4 w-4" fill={product.isFavorite ? 'currentColor' : 'none'} />
            </button>
          ) : null}
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-1 text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          {product.hasActiveOffer ? (
            <p className="text-xs font-semibold text-emerald-700">{t('products.offerAvailable')}</p>
          ) : null}
          <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className="h-3.5 w-3.5"
                fill={index < Math.round(ratingValue) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="ml-1 text-xs text-gray-600 dark:text-gray-300">
              {ratingLabel} ({reviewSummary})
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {product.producer.businessName} - {formatWilayaForDisplay(product.producer.wilaya)}
          </p>
          {distanceKm != null ? (
            <p className="text-xs font-medium text-emerald-700">{formatDistanceKm(distanceKm)}</p>
          ) : null}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary-700">{asCurrency(product.price, product.currency)}</p>
            <p className="text-xs text-gray-500">/{product.unit}</p>
          </div>
          {mapsUrl ? (
            <div className="pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(mapsUrl, '_blank', 'noopener,noreferrer');
                }}
                className="text-xs font-semibold text-primary-700 hover:text-primary-600"
              >
                {t('products.openInGoogleMaps')}
              </button>
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
