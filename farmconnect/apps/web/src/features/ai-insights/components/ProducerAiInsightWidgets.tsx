import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Sparkles, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getApiErrorMessage } from '@/shared/utils/api-error';

import { useAiForecastDemand, useAiRecommendPrice } from '../hooks/useAiInsights';

export interface ProducerAiProductOption {
  id: string;
  label: string;
  price?: number;
  currency?: string;
}

interface ProducerAiInsightWidgetsProps {
  products: ProducerAiProductOption[];
  initialProductId?: string;
  compact?: boolean;
}

function clampHorizon(value: number): number {
  if (!Number.isFinite(value)) return 7;
  return Math.min(90, Math.max(1, Math.round(value)));
}

function pct(value: number): string {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function money(value: number, currency = 'DZD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function ProducerAiInsightWidgets({ products, initialProductId, compact = false }: ProducerAiInsightWidgetsProps) {
  const { t } = useTranslation();
  const recommendMutation = useAiRecommendPrice();
  const forecastMutation = useAiForecastDemand();

  const [selectedProductId, setSelectedProductId] = useState('');
  const [manualCurrentPrice, setManualCurrentPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [horizonDays, setHorizonDays] = useState('14');

  useEffect(() => {
    if (!products.length) {
      setSelectedProductId('');
      return;
    }

    const preferred = initialProductId && products.some((item) => item.id === initialProductId)
      ? initialProductId
      : products[0]?.id;

    if (preferred && preferred !== selectedProductId) {
      setSelectedProductId(preferred);
    }
  }, [initialProductId, products, selectedProductId]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId],
  );

  const canRecommend = Boolean(selectedProductId || Number(manualCurrentPrice) > 0);

  async function runRecommendation() {
    await recommendMutation.mutateAsync({
      productId: selectedProductId || undefined,
      currentPrice: selectedProductId ? undefined : Number(manualCurrentPrice) || undefined,
      costPrice: Number(costPrice) > 0 ? Number(costPrice) : undefined,
      currency: selectedProduct?.currency,
    });
  }

  async function runForecast() {
    await forecastMutation.mutateAsync({
      productId: selectedProductId || undefined,
      horizonDays: clampHorizon(Number(horizonDays) || 14),
    });
  }

  const recommendError = recommendMutation.isError
    ? getApiErrorMessage(recommendMutation.error, t('ai.recommendationFailed'))
    : '';
  const forecastError = forecastMutation.isError
    ? getApiErrorMessage(forecastMutation.error, t('ai.forecastFailed'))
    : '';

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
          <span>{t('ai.chooseProduct')}</span>
          <select
            value={selectedProductId}
            onChange={(event) => setSelectedProductId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">{t('ai.noProductSelected')}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
          <span>{t('ai.costPriceOptional')}</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={costPrice}
            onChange={(event) => setCostPrice(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </label>

        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
          <span>{t('ai.horizonDays')}</span>
          <input
            type="number"
            min={1}
            max={90}
            value={horizonDays}
            onChange={(event) => setHorizonDays(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </label>
      </div>

      {!selectedProductId ? (
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
          <span>{t('ai.manualPrice')}</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={manualCurrentPrice}
            onChange={(event) => setManualCurrentPrice(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </label>
      ) : null}

      {!products.length ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          {t('ai.noProductsHint')}
        </p>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-teal-600" />
              {t('ai.recommendationTitle')}
            </h3>
            <button
              type="button"
              disabled={!canRecommend || recommendMutation.isPending}
              onClick={() => {
                void runRecommendation();
              }}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {recommendMutation.isPending ? t('ai.generating') : t('ai.runRecommendation')}
            </button>
          </div>

          {recommendError ? <p className="mt-2 text-xs text-red-600 dark:text-red-300">{recommendError}</p> : null}

          {recommendMutation.data ? (
            <div className="mt-3 space-y-2 text-xs text-gray-700 dark:text-gray-200">
              <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                {money(recommendMutation.data.recommendedPrice, recommendMutation.data.currency)}
              </p>
              <p>
                <span className="font-semibold">{t('ai.confidence')}:</span> {pct(recommendMutation.data.confidence)}
              </p>
              <p>
                <span className="font-semibold">{t('ai.explanation')}:</span>{' '}
                {recommendMutation.data.source === 'api-fallback'
                  ? t('ai.fallbackRecommendationExplanation')
                  : recommendMutation.data.explanation}
              </p>
              <p>
                <span className="font-semibold">{t('ai.source')}:</span>{' '}
                {recommendMutation.data.source === 'ai-service' ? t('ai.sourceAiService') : t('ai.sourceApiFallback')}
              </p>
              {recommendMutation.data.fallbackUsed ? (
                <p className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {t('ai.fallbackUsed')}
                </p>
              ) : null}
            </div>
          ) : (
            <p className={`mt-3 text-xs text-gray-500 dark:text-gray-400 ${compact ? 'min-h-0' : 'min-h-12'}`}>
              {t('ai.noRecommendationYet')}
            </p>
          )}
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-2">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <TrendingUp className="h-4 w-4 text-sky-600" />
              {t('ai.forecastTitle')}
            </h3>
            <button
              type="button"
              disabled={forecastMutation.isPending}
              onClick={() => {
                void runForecast();
              }}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {forecastMutation.isPending ? t('ai.generating') : t('ai.runForecast')}
            </button>
          </div>

          {forecastError ? <p className="mt-2 text-xs text-red-600 dark:text-red-300">{forecastError}</p> : null}

          {forecastMutation.data ? (
            <div className="mt-3 space-y-2 text-xs text-gray-700 dark:text-gray-200">
              <p className="text-2xl font-bold text-sky-700 dark:text-sky-300">
                {forecastMutation.data.forecastDemand.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p>
                <span className="font-semibold">{t('ai.period')}</span>: {forecastMutation.data.horizonDays} {t('ai.days')}
              </p>
              <p>
                <span className="font-semibold">{t('ai.confidence')}:</span> {pct(forecastMutation.data.confidence)}
              </p>
              <p>
                <span className="font-semibold">{t('ai.explanation')}:</span>{' '}
                {forecastMutation.data.source === 'api-fallback'
                  ? t('ai.fallbackForecastExplanation')
                  : forecastMutation.data.explanation}
              </p>
              <p>
                <span className="font-semibold">{t('ai.source')}:</span>{' '}
                {forecastMutation.data.source === 'ai-service' ? t('ai.sourceAiService') : t('ai.sourceApiFallback')}
              </p>
              {forecastMutation.data.fallbackUsed ? (
                <p className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {t('ai.fallbackUsed')}
                </p>
              ) : null}
            </div>
          ) : (
            <p className={`mt-3 text-xs text-gray-500 dark:text-gray-400 ${compact ? 'min-h-0' : 'min-h-12'}`}>
              {t('ai.noForecastYet')}
            </p>
          )}
        </article>
      </section>

      {!canRecommend ? (
        <p className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
          <BrainCircuit className="h-3.5 w-3.5" />
          {t('ai.recommendationNeedsPrice')}
        </p>
      ) : null}
    </div>
  );
}