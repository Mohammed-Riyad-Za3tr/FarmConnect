import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { asCurrency, textFromLocalized } from '@/features/products/utils/product.utils';

import { useFavoriteProducts, useFavoriteProducers, useToggleFavoriteProducer } from '../hooks/useFavorites';

export function BuyerFavoritesPage() {
  const { t } = useTranslation();
  const productsQuery = useFavoriteProducts();
  const producersQuery = useFavoriteProducers();
  const toggleProducerMutation = useToggleFavoriteProducer();

  const favoriteProducts = productsQuery.data?.map((entry) => entry.product) ?? [];
  const favoriteProducers = producersQuery.data ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('favorites.title')}</h1>
        <p className="text-sm text-gray-500">{t('favorites.subtitle')}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('favorites.productsTitle')}</h2>
        {!favoriteProducts.length ? (
          <p className="text-sm text-gray-500">{t('favorites.productsEmpty')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {favoriteProducts.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <Link to={`/products/${product.slug}`}>
                  <div className="h-40 w-full bg-gray-100 dark:bg-gray-800">
                    {product.images[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={textFromLocalized(product.title) || product.slug}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1 p-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {textFromLocalized(product.title) || product.slug}
                    </p>
                    <p className="text-xs text-gray-500">{product.producer.businessName} - {product.producer.wilaya}</p>
                    <p className="text-sm font-semibold text-primary-700">{asCurrency(product.price, product.currency)}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('favorites.producersTitle')}</h2>
        {!favoriteProducers.length ? (
          <p className="text-sm text-gray-500">{t('favorites.producersEmpty')}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {favoriteProducers.map((entry) => (
              <article
                key={entry.id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{entry.producer.businessName}</p>
                <p className="text-xs text-gray-500">{entry.producer.wilaya} - {entry.producer.commune}</p>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  {entry.producer.bio ?? t('favorites.noBio')}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleProducerMutation.mutate(entry.producer.id)}
                    className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    {t('cart.remove')}
                  </button>
                  <Link
                    to="/products"
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('cart.browseProducts')}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
