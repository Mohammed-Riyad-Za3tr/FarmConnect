import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import { getApiErrorMessage } from '@/shared/utils/api-error';

import { useAdminProducts, useModerateAdminProduct } from '../hooks/useAdmin';
import type { AdminProductStatus } from '../api/admin.api';

const PRODUCT_STATUSES: AdminProductStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'];

export function AdminProductsPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | AdminProductStatus>('');

  const query = useMemo(
    () => ({
      q: q.trim() || undefined,
      status: status || undefined,
      limit: 50,
      offset: 0,
    }),
    [q, status],
  );

  const productsQuery = useAdminProducts(query);
  const moderateMutation = useModerateAdminProduct();

  async function moderateProduct(productId: string, nextStatus: AdminProductStatus) {
    try {
      await moderateMutation.mutateAsync({ productId, status: nextStatus });
      toast.success(t('admin.products.moderationSaved'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('admin.products.moderationFailed')));
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('admin.products.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('admin.products.subtitle')}</p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="sm:col-span-2 lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('common.search')}</span>
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={t('admin.products.searchPlaceholder')}
              className={inputClass()}
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('admin.products.statusFilter')}</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={inputClass()}>
              <option value="">{t('admin.products.allStatuses')}</option>
              {PRODUCT_STATUSES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {productsQuery.isLoading ? <p className="text-sm text-gray-500">{t('common.loading')}</p> : null}

      {productsQuery.data?.items.length ? (
        <>
          <div className="space-y-3 md:hidden">
            {productsQuery.data.items.map((item) => (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="font-semibold text-gray-900 dark:text-white">{item.title.en || item.title.ar || item.slug}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">/{item.slug}</p>
                <p className="mt-2 text-xs font-semibold text-gray-700 dark:text-gray-200">{item.producer.businessName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.producer.user.email}</p>

                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500 dark:text-gray-400">{t('admin.products.price')}</dt>
                    <dd className="font-semibold text-gray-700 dark:text-gray-200">{Number(item.price).toLocaleString()} {item.currency}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500 dark:text-gray-400">{t('admin.products.stock')}</dt>
                    <dd className="font-semibold text-gray-700 dark:text-gray-200">{item.stock}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500 dark:text-gray-400">{t('admin.products.status')}</dt>
                    <dd className="font-semibold text-gray-700 dark:text-gray-200">{item.status}</dd>
                  </div>
                </dl>

                <label className="mt-3 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {t('admin.products.moderation')}
                  <select
                    value={item.status}
                    disabled={moderateMutation.isPending}
                    onChange={(event) => {
                      void moderateProduct(item.id, event.target.value as AdminProductStatus);
                    }}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    {PRODUCT_STATUSES.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </article>
            ))}
          </div>

          <div className="hidden overflow-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2">{t('admin.products.product')}</th>
                  <th className="px-4 py-2">{t('admin.products.producer')}</th>
                  <th className="px-4 py-2">{t('admin.products.price')}</th>
                  <th className="px-4 py-2">{t('admin.products.stock')}</th>
                  <th className="px-4 py-2">{t('admin.products.status')}</th>
                  <th className="px-4 py-2">{t('admin.products.moderation')}</th>
                </tr>
              </thead>
              <tbody>
                {productsQuery.data.items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 text-xs text-gray-700 dark:border-gray-800 dark:text-gray-200">
                    <td className="px-4 py-2">
                      <p className="font-semibold">{item.title.en || item.title.ar || item.slug}</p>
                      <p className="text-gray-500 dark:text-gray-400">/{item.slug}</p>
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-semibold">{item.producer.businessName}</p>
                      <p className="text-gray-500 dark:text-gray-400">{item.producer.user.email}</p>
                    </td>
                    <td className="px-4 py-2">{Number(item.price).toLocaleString()} {item.currency}</td>
                    <td className="px-4 py-2">{item.stock}</td>
                    <td className="px-4 py-2">{item.status}</td>
                    <td className="px-4 py-2">
                      <select
                        value={item.status}
                        disabled={moderateMutation.isPending}
                        onChange={(event) => {
                          void moderateProduct(item.id, event.target.value as AdminProductStatus);
                        }}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                      >
                        {PRODUCT_STATUSES.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : productsQuery.isLoading ? null : (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t('admin.products.noResults')}
        </div>
      )}
    </div>
  );
}

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
}
