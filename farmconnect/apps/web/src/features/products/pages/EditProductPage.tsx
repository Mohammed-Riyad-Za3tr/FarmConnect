import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import { getApiErrorMessage } from '@/shared/utils/api-error';
import { useProducerVerificationStatus } from '@/features/profile/hooks/useProfile';
import { ProductForm } from '../components/ProductForm';
import { ProductImagesManager } from '../components/ProductImagesManager';
import {
  useCreateOwnProductLog,
  useOwnProduct,
  useOwnProductLogs,
  useProductCategories,
  useUpdateOwnProduct,
} from '../hooks/useProducts';

export function EditProductPage() {
  const { t } = useTranslation();
  const params = useParams<{ productId: string }>();
  const productId = params.productId ?? '';
  const query = useOwnProduct(productId);
  const mutation = useUpdateOwnProduct(productId);
  const logsQuery = useOwnProductLogs(productId);
  const createLogMutation = useCreateOwnProductLog(productId);
  const categoriesQuery = useProductCategories();
  const verificationQuery = useProducerVerificationStatus();
  const [logType, setLogType] = useState<'WATERING' | 'HARVEST' | 'FERTILIZE' | 'OTHER'>('OTHER');
  const [logNote, setLogNote] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));

  if (query.isLoading) {
    return <p className="text-sm text-gray-500">{t('products.loadingProduct')}</p>;
  }

  if (query.isError || !query.data) {
    return <p className="text-sm text-red-600">{t('products.productNotFound')}</p>;
  }

  const product = query.data;
  const verificationStatus = verificationQuery.data?.producerProfile.verificationStatus ?? 'UNVERIFIED';
  const canPublishPublicly = verificationStatus === 'APPROVED';
  const statusHint =
    verificationStatus === 'APPROVED'
      ? t('products.publishHintApproved')
      : verificationStatus === 'PENDING'
        ? t('products.publishHintPendingVerification')
        : verificationStatus === 'REJECTED'
          ? t('products.publishHintRejectedVerification')
          : t('products.publishHintNeedsVerification');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('products.editProduct')}</h1>
      <ProductImagesManager
        productId={productId}
        existingImages={product.images}
        disabled={mutation.isPending}
      />
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <ProductForm
          mode="edit"
          categories={categoriesQuery.data ?? []}
          initial={{
            categoryId: product.categoryId ?? undefined,
            title: product.title,
            description: product.description,
            slug: product.slug,
            price: Number(product.price),
            currency: product.currency,
            unit: product.unit,
            recipePdfUrl: product.recipePdfUrl ?? undefined,
            harvestDate: product.harvestDate ? product.harvestDate.slice(0, 10) : undefined,
            harvestWindowStart: product.harvestWindowStart ? product.harvestWindowStart.slice(0, 10) : undefined,
            harvestWindowEnd: product.harvestWindowEnd ? product.harvestWindowEnd.slice(0, 10) : undefined,
            isSeasonal: product.isSeasonal ?? false,
            seasonStartMonth: product.seasonStartMonth ?? undefined,
            seasonEndMonth: product.seasonEndMonth ?? undefined,
            stock: product.stock,
            minOrderQty: product.minOrderQty,
            maxOrderQty: product.maxOrderQty,
            status: product.status,
            tags: product.tags,
          }}
          allowedStatuses={canPublishPublicly ? undefined : ['DRAFT', 'INACTIVE', 'OUT_OF_STOCK', 'ARCHIVED']}
          statusHint={statusHint}
          submitLabel={mutation.isPending ? t('profile.saving') : t('products.saveChanges')}
          isSubmitting={mutation.isPending}
          onSubmit={async (payload) => {
            try {
              await mutation.mutateAsync(payload);
              toast.success(t('products.productUpdated'));
            } catch (err) {
              toast.error(getApiErrorMessage(err, t('products.updateFailed')));
            }
          }}
        />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Product history logs</h2>
        <form
          className="mb-4 grid gap-2 md:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!logNote.trim()) return;
            try {
              await createLogMutation.mutateAsync({
                type: logType,
                note: logNote.trim(),
                happenedAt: logDate,
              });
              setLogNote('');
              toast.success('Log added');
            } catch (err) {
              toast.error(getApiErrorMessage(err, 'Failed to add log'));
            }
          }}
        >
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" value={logType} onChange={(e) => setLogType(e.target.value as 'WATERING' | 'HARVEST' | 'FERTILIZE' | 'OTHER')}>
            <option value="WATERING">WATERING</option>
            <option value="HARVEST">HARVEST</option>
            <option value="FERTILIZE">FERTILIZE</option>
            <option value="OTHER">OTHER</option>
          </select>
          <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 md:col-span-2" placeholder="Log note" value={logNote} onChange={(e) => setLogNote(e.target.value)} />
          <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800" type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
          <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60 md:col-span-4" disabled={createLogMutation.isPending} type="submit">
            {createLogMutation.isPending ? 'Adding...' : 'Add log'}
          </button>
        </form>
        {logsQuery.isLoading ? <p className="text-sm text-gray-500">Loading logs...</p> : null}
        {logsQuery.data?.length ? (
          <div className="space-y-2">
            {logsQuery.data.map((log) => (
              <div key={log.id} className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">{log.type}</p>
                <p className="text-gray-600 dark:text-gray-300">{log.note}</p>
                <p className="text-xs text-gray-500">{new Date(log.happenedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No logs yet.</p>
        )}
      </div>
    </div>
  );
}
