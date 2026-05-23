import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { UserRole } from '@farmconnect/shared';

import { useAuth } from '@/app/providers/AuthProvider';
import { useProducerVerificationStatus } from '@/features/profile/hooks/useProfile';
import { ALGERIA_WILAYAS, formatWilayaLabel } from '@/shared/constants/algeria-locations';
import { ProductCard } from '../components/ProductCard';
import { useProductCategories, usePublicProducts } from '../hooks/useProducts';

export function ProductListPage() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get('q') ?? '');
  const [locationLoading, setLocationLoading] = useState(false);
  const isProducer = isAuthenticated && user?.role === UserRole.PRODUCER;

  const query = useMemo(() => {
    const rawBuyerLat = params.get('buyerLat');
    const rawBuyerLng = params.get('buyerLng');
    const buyerLat = rawBuyerLat ? Number(rawBuyerLat) : undefined;
    const buyerLng = rawBuyerLng ? Number(rawBuyerLng) : undefined;
    const hasValidCoords =
      buyerLat !== undefined &&
      buyerLng !== undefined &&
      Number.isFinite(buyerLat) &&
      Number.isFinite(buyerLng);
    const requestedSort =
      (params.get('sort') as 'newest' | 'price_asc' | 'price_desc' | 'rating_desc' | 'distance_asc' | null) ?? 'newest';

    return {
      q: params.get('q') ?? undefined,
      wilaya: params.get('wilaya') ?? undefined,
      categorySlug: params.get('categorySlug') ?? undefined,
      minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : undefined,
      maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
      buyerLat: hasValidCoords ? buyerLat : undefined,
      buyerLng: hasValidCoords ? buyerLng : undefined,
      inStockOnly: params.get('inStockOnly') === 'true',
      onlyOffers: params.get('onlyOffers') === 'true',
      onlyFavoriteProducers: params.get('onlyFavoriteProducers') === 'true',
      tags: params.get('tags') ? params.get('tags')!.split(',').map((x) => x.trim()).filter(Boolean) : undefined,
      sort: requestedSort === 'distance_asc' && !hasValidCoords ? 'newest' : requestedSort,
      requestedSort,
      limit: 12,
      offset: params.get('offset') ? Number(params.get('offset')) : 0,
    };
  }, [params]);

  const productsQuery = usePublicProducts(query);
  const categoriesQuery = useProductCategories();
  const verificationQuery = useProducerVerificationStatus(isProducer);

  function updateParam(key: string, value?: string) {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== 'offset') next.set('offset', '0');
    setParams(next);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam('q', searchInput.trim() || undefined);
  }

  function clearFilters() {
    const next = new URLSearchParams();
    if (query.q) next.set('q', query.q);
    next.set('offset', '0');
    setParams(next);
  }

  function setCoordinates(lat: number, lng: number) {
    const next = new URLSearchParams(params);
    next.set('buyerLat', String(lat));
    next.set('buyerLng', String(lng));
    if ((next.get('sort') ?? 'newest') !== 'distance_asc') {
      next.set('sort', 'distance_asc');
    }
    next.set('offset', '0');
    setParams(next);
  }

  function onUseMyLocation() {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates(position.coords.latitude, position.coords.longitude);
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  }

  const offset = query.offset ?? 0;
  const isRtl = i18n.dir(i18n.resolvedLanguage ?? i18n.language) === 'rtl';
  const producerVerificationStatus = verificationQuery.data?.producerProfile.verificationStatus;
  const producerEmptyHint =
    !isProducer
      ? null
      : producerVerificationStatus === 'APPROVED'
        ? t('products.producerMarketplaceHintApproved')
        : producerVerificationStatus === 'PENDING'
          ? t('products.producerMarketplaceHintPendingVerification')
        : producerVerificationStatus === 'REJECTED'
            ? t('products.producerMarketplaceHintRejectedVerification')
            : t('products.producerMarketplaceHintNeedsVerification');
  const activeFilterCount = [
    query.wilaya,
    query.categorySlug,
    query.minPrice !== undefined ? 'minPrice' : undefined,
    query.maxPrice !== undefined ? 'maxPrice' : undefined,
    query.tags?.length ? 'tags' : undefined,
    query.inStockOnly ? 'inStockOnly' : undefined,
    query.onlyOffers ? 'onlyOffers' : undefined,
    query.onlyFavoriteProducers ? 'onlyFavoriteProducers' : undefined,
    query.requestedSort === 'distance_asc' ? 'distance' : undefined,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('products.marketplaceTitle')}</h1>
        <p className="text-sm text-gray-500">{t('products.marketplaceSubtitle')}</p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={submitSearch} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto_auto]">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('products.searchPlaceholder')}
              className={inputClass()}
            />
            <select
              value={query.sort}
              onChange={(e) => {
                const nextSort = e.target.value;
                if (nextSort === 'distance_asc' && (query.buyerLat === undefined || query.buyerLng === undefined)) {
                  onUseMyLocation();
                  return;
                }
                updateParam('sort', nextSort);
              }}
              className={inputClass()}
            >
              <option value="newest">{t('products.sortNewest')}</option>
              <option value="price_asc">{t('products.sortPriceAsc')}</option>
              <option value="price_desc">{t('products.sortPriceDesc')}</option>
              <option value="rating_desc">{t('products.sortRatingDesc')}</option>
              <option value="distance_asc">{t('products.sortDistanceAsc')}</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Search className="h-4 w-4" />
              {t('common.search')}
            </button>
            <details className="group rounded-lg border border-gray-300 dark:border-gray-700">
              <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800">
                <SlidersHorizontal className="h-4 w-4" />
                {t('products.filtersButton')}
                {activeFilterCount > 0 ? (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-200">
                    {activeFilterCount}
                  </span>
                ) : null}
                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
              </summary>
              <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <select
                    value={query.wilaya ?? ''}
                    onChange={(e) => updateParam('wilaya', e.target.value || undefined)}
                    className={inputClass()}
                  >
                    <option value="">{t('products.wilayaPlaceholder')}</option>
                    {ALGERIA_WILAYAS.map((wilaya) => (
                      <option key={wilaya.code} value={wilaya.nameEn}>
                        {formatWilayaLabel(wilaya, i18n.resolvedLanguage ?? i18n.language)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={query.categorySlug ?? ''}
                    onChange={(e) => updateParam('categorySlug', e.target.value || undefined)}
                    className={inputClass()}
                  >
                    <option value="">{t('products.allCategories')}</option>
                    {(categoriesQuery.data ?? []).map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.parentId ? '  - ' : ''}
                        {category.nameEn} / {category.nameAr}
                      </option>
                    ))}
                  </select>
                  <input
                    defaultValue={query.minPrice ?? ''}
                    onBlur={(e) => updateParam('minPrice', e.target.value || undefined)}
                    placeholder={t('products.minPricePlaceholder')}
                    type="number"
                    min="0"
                    className={inputClass()}
                  />
                  <input
                    defaultValue={query.maxPrice ?? ''}
                    onBlur={(e) => updateParam('maxPrice', e.target.value || undefined)}
                    placeholder={t('products.maxPricePlaceholder')}
                    type="number"
                    min="0"
                    className={inputClass()}
                  />
                  <input
                    defaultValue={query.tags?.join(', ') ?? ''}
                    onBlur={(e) => updateParam('tags', e.target.value.trim() || undefined)}
                    placeholder={t('products.tagsPlaceholder')}
                    className={inputClass() + ' md:col-span-2 xl:col-span-2'}
                  />
                  <button
                    type="button"
                    onClick={onUseMyLocation}
                    disabled={locationLoading}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {locationLoading ? t('products.locating') : t('products.useMyLocationLabel')}
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {t('products.clearFilters')}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={query.inStockOnly}
                      onChange={(e) => updateParam('inStockOnly', e.target.checked ? 'true' : undefined)}
                      className="h-4 w-4 accent-primary-600"
                    />
                    <span>{t('products.inStockOnly')}</span>
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={query.onlyOffers}
                      onChange={(e) => updateParam('onlyOffers', e.target.checked ? 'true' : undefined)}
                      className="h-4 w-4 accent-primary-600"
                    />
                    <span>{t('products.onlyOffers')}</span>
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={query.onlyFavoriteProducers}
                      onChange={(e) => updateParam('onlyFavoriteProducers', e.target.checked ? 'true' : undefined)}
                      disabled={!isAuthenticated || user?.role !== UserRole.BUYER}
                      className="h-4 w-4 accent-primary-600"
                    />
                    <span className={query.onlyFavoriteProducers ? 'font-semibold text-primary-700 dark:text-primary-200' : ''}>
                      {t('products.onlyFavoriteProducers')}
                    </span>
                  </label>
                </div>
              </div>
            </details>
          </div>
        </form>
      </section>

      {productsQuery.isLoading ? (
        <p className="text-sm text-gray-500">{t('products.loadingProducts')}</p>
      ) : productsQuery.isError ? (
        <p className="text-sm text-red-600">
          {query.requestedSort === 'distance_asc' && query.buyerLat === undefined
            ? t('products.locationRequiredForNearest')
            : t('products.failedToLoadProducts')}
        </p>
      ) : productsQuery.data?.items.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productsQuery.data.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                buyerCoords={
                  query.buyerLat !== undefined && query.buyerLng !== undefined
                    ? { lat: query.buyerLat, lng: query.buyerLng }
                    : undefined
                }
              />
            ))}
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:bg-gray-900">
            <span className="text-gray-700 dark:text-gray-200">
              {t('products.showingRange', {
                start: offset + 1,
                end: Math.min(offset + (productsQuery.data.items.length ?? 0), productsQuery.data.total),
                total: productsQuery.data.total,
              })}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={offset <= 0}
                onClick={() => updateParam('offset', String(Math.max(0, offset - 12)))}
                className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {t('common.previous')}
              </button>
              <button
                disabled={!productsQuery.data.hasMore}
                onClick={() => updateParam('offset', String(offset + 12))}
                className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {t('common.next')}
                {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700">
          <p>{t('products.noProductsForCriteria')}</p>
          {producerEmptyHint ? <p className="mt-2">{producerEmptyHint}</p> : null}
          {isProducer ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                to="/dashboard/products"
                className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {t('products.marketplaceOwnProductsCta')}
              </Link>
              <Link
                to="/dashboard/verification"
                className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
              >
                {t('products.marketplaceVerificationCta')}
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export const HomePage = ProductListPage;

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
}
