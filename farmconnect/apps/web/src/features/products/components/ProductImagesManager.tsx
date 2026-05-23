import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ImagePlus, Trash2 } from 'lucide-react';

import { getApiErrorMessage } from '@/shared/utils/api-error';
import { DEFAULT_MAX_UPLOAD_BYTES, isImageFile, isWithinSizeLimit, readFileAsDataUrl } from '@/shared/utils/file-upload';

import type { ProductImage } from '../api/products.api';
import { useAddOwnProductImage, useDeleteOwnProductImage } from '../hooks/useProductImages';

interface ProductImagesManagerProps {
  productId?: string;
  existingImages?: ProductImage[];
  draftImages?: string[];
  onDraftImagesChange?: (next: string[]) => void;
  disabled?: boolean;
}

export function ProductImagesManager({
  productId,
  existingImages = [],
  draftImages = [],
  onDraftImagesChange,
  disabled = false,
}: ProductImagesManagerProps) {
  const { t } = useTranslation();
  const [urlInput, setUrlInput] = useState('');
  const [altInput, setAltInput] = useState('');

  const addImageMutation = useAddOwnProductImage(productId ?? '');
  const deleteImageMutation = useDeleteOwnProductImage(productId ?? '');

  const canUseServer = !!productId;
  const shownImages = useMemo(
    () =>
      canUseServer
        ? existingImages.map((image) => ({ id: image.id, url: image.url, altText: image.altText ?? null }))
        : draftImages.map((url, index) => ({ id: `draft-${index}`, url, altText: null })),
    [canUseServer, draftImages, existingImages],
  );

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const pickedFiles = Array.from(files);
    const validFiles: File[] = [];

    for (const file of pickedFiles) {
      if (!isImageFile(file)) {
        toast.error(t('products.imageFileTypeInvalid'));
        continue;
      }
      if (!isWithinSizeLimit(file, DEFAULT_MAX_UPLOAD_BYTES)) {
        toast.error(t('products.imageFileTooLarge'));
        continue;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) return;

    try {
      const dataUrls = await Promise.all(validFiles.map((file) => readFileAsDataUrl(file)));

      if (canUseServer) {
        for (let index = 0; index < dataUrls.length; index += 1) {
          const sourceUrl = dataUrls[index];
          if (!sourceUrl) continue;
          await addImageMutation.mutateAsync({
            sourceUrl,
            position: existingImages.length + index,
          });
        }
      } else {
        onDraftImagesChange?.([...draftImages, ...dataUrls]);
      }

      toast.success(t('products.imagesUploaded', { count: dataUrls.length }));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('products.imageAddFailed')));
    }
  }

  async function addImage() {
    const sourceUrl = urlInput.trim();
    if (!sourceUrl) {
      toast.error(t('products.imageUrlRequired'));
      return;
    }

    if (canUseServer) {
      try {
        await addImageMutation.mutateAsync({
          sourceUrl,
          altText: altInput.trim() || undefined,
          position: existingImages.length,
        });
        toast.success(t('products.imageAdded'));
      } catch (error) {
        toast.error(getApiErrorMessage(error, t('products.imageAddFailed')));
        return;
      }
    } else {
      const next = [...draftImages, sourceUrl];
      onDraftImagesChange?.(next);
    }

    setUrlInput('');
    setAltInput('');
  }

  async function removeImage(imageId: string, index: number) {
    if (canUseServer) {
      try {
        await deleteImageMutation.mutateAsync({ imageId });
        toast.success(t('products.imageRemoved'));
      } catch (error) {
        toast.error(getApiErrorMessage(error, t('products.imageRemoveFailed')));
      }
      return;
    }

    const next = draftImages.filter((_, currentIndex) => currentIndex !== index);
    onDraftImagesChange?.(next);
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t('products.imagesSectionTitle')}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('products.imagesSectionSubtitle')}</p>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
        <input
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder={t('products.imageUrlPlaceholder')}
          className={inputClass()}
          disabled={disabled || addImageMutation.isPending}
        />
        <input
          value={altInput}
          onChange={(event) => setAltInput(event.target.value)}
          placeholder={t('products.imageAltPlaceholder')}
          className={inputClass()}
          disabled={disabled || addImageMutation.isPending}
        />
        <button
          type="button"
          onClick={() => {
            void addImage();
          }}
          disabled={disabled || addImageMutation.isPending}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <ImagePlus className="h-4 w-4" />
          {t('products.addImage')}
        </button>
      </div>

      <div className="mt-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
          <ImagePlus className="h-3.5 w-3.5" />
          {t('products.uploadFromDevice')}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={disabled || addImageMutation.isPending}
            onChange={(event) => {
              void uploadFiles(event.target.files);
              event.target.value = '';
            }}
          />
        </label>
      </div>

      {!canUseServer ? (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('products.imagesSavedAfterCreate')}</p>
      ) : null}

      {shownImages.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shownImages.map((image, index) => (
            <article key={image.id} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <img src={image.url} alt={image.altText ?? `${t('products.imageLabel')} ${index + 1}`} className="h-28 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="truncate text-xs text-gray-600 dark:text-gray-300">{image.altText ?? t('products.noImageAlt')}</p>
                <button
                  type="button"
                  onClick={() => {
                    void removeImage(image.id, index);
                  }}
                  disabled={disabled || deleteImageMutation.isPending}
                  className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('products.removeImage')}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t('products.noImagesYet')}
        </p>
      )}
    </section>
  );
}

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
}
