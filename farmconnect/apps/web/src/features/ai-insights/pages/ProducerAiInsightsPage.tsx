import { useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useOwnProducts } from '@/features/products/hooks/useProducts';

import { ProducerAiChatbotPanel } from '../components/ProducerAiChatbotPanel';
import {
  ProducerAiInsightWidgets,
  type ProducerAiProductOption,
} from '../components/ProducerAiInsightWidgets';

function localizedText(input: unknown): string {
  if (!input || typeof input !== 'object') return '';
  const candidate = input as { en?: unknown; ar?: unknown };
  if (typeof candidate.en === 'string' && candidate.en.trim()) return candidate.en.trim();
  if (typeof candidate.ar === 'string' && candidate.ar.trim()) return candidate.ar.trim();
  return '';
}

function toPrice(value: string | number | undefined): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function ProducerAiInsightsPage() {
  const { t } = useTranslation();
  const productsQuery = useOwnProducts({ includeArchived: false, limit: 100, offset: 0 });

  const products = useMemo<ProducerAiProductOption[]>(() => {
    const items = productsQuery.data?.items ?? [];
    return items.map((item) => ({
      id: item.id,
      label: localizedText(item.title) || item.slug,
      price: toPrice(item.price),
      currency: item.currency,
    }));
  }, [productsQuery.data?.items]);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-cyan-50 to-emerald-50 p-5 dark:border-indigo-900/50 dark:from-indigo-900/20 dark:via-gray-900 dark:to-emerald-900/20">
        <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <Lightbulb className="h-6 w-6 text-indigo-600" />
          {t('ai.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('ai.subtitle')}</p>
      </header>

      {productsQuery.isLoading ? (
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      ) : null}

      {productsQuery.isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {t('ai.productsLoadFailed')}
        </p>
      ) : null}

      <ProducerAiInsightWidgets products={products} />

      <ProducerAiChatbotPanel />
    </div>
  );
}