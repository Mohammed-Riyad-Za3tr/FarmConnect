import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { UserRole } from '@farmconnect/shared';

import { getApiErrorMessage } from '@/shared/utils/api-error';
import { useAuth } from '@/app/providers/AuthProvider';
import { useProducerVerificationStatus } from '@/features/profile/hooks/useProfile';
import { addOwnProductImageApi } from '../api/product-images.api';
import { ProductForm } from '../components/ProductForm';
import { ProductImagesManager } from '../components/ProductImagesManager';
import { useCreateOwnProduct, useProductCategories } from '../hooks/useProducts';

export function AddProductPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const mutation = useCreateOwnProduct();
  const categoriesQuery = useProductCategories();
  const verificationQuery = useProducerVerificationStatus();
  const [draftImageUrls, setDraftImageUrls] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const verificationStatus = verificationQuery.data?.producerProfile.verificationStatus ?? 'UNVERIFIED';
  const canPublishPublicly = verificationStatus === 'APPROVED';
  const createStatusHint =
    verificationStatus === 'APPROVED'
      ? t('products.publishHintApproved')
      : verificationStatus === 'PENDING'
        ? t('products.publishHintPendingVerification')
        : verificationStatus === 'REJECTED'
          ? t('products.publishHintRejectedVerification')
          : t('products.publishHintNeedsVerification');

  if (user?.role !== UserRole.PRODUCER) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
        {t('products.onlyProducersCanCreate')}
      </div>
    );
  }

  async function uploadDraftImages(productId: string) {
    if (!draftImageUrls.length) return;

    await Promise.all(
      draftImageUrls.map((sourceUrl, index) =>
        addOwnProductImageApi(productId, {
          sourceUrl,
          position: index,
        }),
      ),
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('products.addProduct')}</h1>
      <ProductImagesManager
        draftImages={draftImageUrls}
        onDraftImagesChange={setDraftImageUrls}
        disabled={mutation.isPending}
      />
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <ProductForm
          mode="create"
          categories={categoriesQuery.data ?? []}
          serverError={submitError}
          initial={{ status: canPublishPublicly ? 'ACTIVE' : 'DRAFT' }}
          allowedStatuses={canPublishPublicly ? ['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'] : ['DRAFT', 'INACTIVE', 'OUT_OF_STOCK']}
          statusHint={createStatusHint}
          submitLabel={mutation.isPending ? t('products.creating') : t('products.createProduct')}
          isSubmitting={mutation.isPending}
          onSubmit={async (payload) => {
            setSubmitError(null);
            try {
              const product = await mutation.mutateAsync(payload);
              try {
                await uploadDraftImages(product.id);
              } catch (uploadError) {
                toast.error(getApiErrorMessage(uploadError, t('products.imageAddFailed')));
              }
              toast.success(t('products.productCreated'));
              navigate(`/dashboard/products/${product.id}/edit`);
            } catch (err) {
              const message = getApiErrorMessage(err, t('products.formErrorGenericMissing'));
              setSubmitError(message);
              toast.error(message);
            }
          }}
        />
      </div>
    </div>
  );
}
