import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Archive, PencilLine, Plus } from 'lucide-react';

import { getApiErrorMessage } from '@/shared/utils/api-error';
import { useDeleteOwnProduct, useOwnProducts } from '../hooks/useProducts';
import { asCurrency, textFromLocalized } from '../utils/product.utils';

export function MyProductsPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const statusParam = params.get('status');
  const status =
    statusParam === 'DRAFT' ||
    statusParam === 'ACTIVE' ||
    statusParam === 'INACTIVE' ||
    statusParam === 'OUT_OF_STOCK' ||
    statusParam === 'ARCHIVED'
      ? statusParam
      : undefined;
  const query = useOwnProducts({ includeArchived: false, status, limit: 50, offset: 0 });
  const deleteMutation = useDeleteOwnProduct();

  async function onArchive(productId: string) {
    try {
      await deleteMutation.mutateAsync(productId);
      toast.success(t('products.productArchived'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('products.archiveFailed')));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('products.myProducts')}{status ? ` (${status})` : ''}
        </h1>
        <Link to="/dashboard/products/new" className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          <Plus className="h-4 w-4" />
          {t('products.addProduct')}
        </Link>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-gray-500">{t('products.loadingProducts')}</p>
      ) : query.isError ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
          {getApiErrorMessage(query.error, t('products.failedToLoadProducts'))}
        </div>
      ) : query.data?.items.length ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/40">
              <tr>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-200">{t('products.productColumn')}</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-200">{t('products.statusColumn')}</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-200">{t('products.priceColumn')}</th>
                <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-200">{t('products.stockColumn')}</th>
                <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">{t('products.actionsColumn')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {query.data.items.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{textFromLocalized(product.title) || product.slug}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{t(`products.status.${product.status}`, { defaultValue: product.status })}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{asCurrency(product.price, product.currency)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{product.stock}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link to={`/dashboard/products/${product.id}/edit`} className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                        <PencilLine className="h-3.5 w-3.5" />
                        {t('common.edit')}
                      </Link>
                      <button
                        onClick={() => onArchive(product.id)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-1 rounded border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        {t('products.archiveAction')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700">
          {t('products.noProductsYet')}
        </div>
      )}
    </div>
  );
}

