import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ImagePlus, PlusCircle, Save, Trash2 } from 'lucide-react';
import { BuyerBusinessType } from '@farmconnect/shared';
import { getApiErrorMessage } from '@/shared/utils/api-error';
import { DEFAULT_MAX_UPLOAD_BYTES, isImageFile, isWithinSizeLimit, readFileAsDataUrl } from '@/shared/utils/file-upload';

import {
  useCurrentBuyerProfile,
  useCurrentUserProfile,
  useDeleteCurrentBuyerProfile,
  useUpdateCurrentUserProfile,
  useUpsertCurrentBuyerProfile,
} from '../hooks/useProfile';
import { useCreateReport } from '@/features/reports/hooks/useReports';

export function BuyerProfilePage() {
  const { t, i18n } = useTranslation();
  const userQuery = useCurrentUserProfile();
  const buyerQuery = useCurrentBuyerProfile();
  const updateUserMutation = useUpdateCurrentUserProfile();
  const createBuyerMutation = useUpsertCurrentBuyerProfile();
  const deleteBuyerMutation = useDeleteCurrentBuyerProfile();
  const createReportMutation = useCreateReport();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [businessType, setBusinessType] = useState<BuyerBusinessType | ''>('');

  const user = userQuery.data;

  function setRandomAvatar() {
    const seed = `${fullName.trim() || 'buyer'}-${Date.now()}`;
    setAvatarUrl(`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`);
  }

  async function onAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!isImageFile(file)) {
      toast.error(t('profile.avatarFileTypeInvalid'));
      return;
    }

    if (!isWithinSizeLimit(file, DEFAULT_MAX_UPLOAD_BYTES)) {
      toast.error(t('profile.avatarFileTooLarge'));
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarUrl(dataUrl);
      toast.success(t('profile.avatarUploaded'));
    } catch {
      toast.error(t('profile.avatarUploadFailed'));
    }
  }

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? '');
    setPhone(user.phone ?? '');
    setAvatarUrl(user.avatarUrl ?? '');
  }, [user]);

  useEffect(() => {
    setBusinessType(buyerQuery.data?.businessType ?? '');
  }, [buyerQuery.data?.businessType]);

  async function onUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateUserMutation.mutateAsync({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      await createBuyerMutation.mutateAsync({
        businessType: businessType || null,
      });
      toast.success(t('profile.accountUpdated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.accountUpdateFailed')));
    }
  }

  async function onCreateBuyerProfile() {
    try {
      await createBuyerMutation.mutateAsync({
        businessType: businessType || null,
      });
      toast.success(t('profile.buyerProfileCreated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.buyerProfileCreateFailed')));
    }
  }

  async function onDeleteBuyerProfile() {
    try {
      await deleteBuyerMutation.mutateAsync();
      toast.success(t('profile.buyerProfileDeleted'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.buyerProfileDeleteFailed')));
    }
  }

  if (userQuery.isLoading) {
    return <p className="text-sm text-gray-500">{t('profile.loading')}</p>;
  }

  const locale = (i18n.resolvedLanguage ?? i18n.language ?? 'en').startsWith('ar') ? 'ar-DZ' : 'en-US';

  async function reportThisProfile() {
    const description = window.prompt('Describe the issue (min 10 chars)');
    if (!description || !user?.id) return;
    try {
      await createReportMutation.mutateAsync({
        targetType: 'USER',
        targetId: user.id,
        reason: 'OTHER',
        description,
      });
      toast.success('Report submitted');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to submit report'));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('profile.buyerTitle')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('profile.buyerSubtitle')}</p>
        <button
          type="button"
          onClick={() => {
            void reportThisProfile();
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        >
          Report profile
        </button>

        <form onSubmit={onUpdateUser} className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label={t('auth.fullName')}>
            <input className={inputClass()} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label={t('profile.phone')}>
            <input className={inputClass()} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label={t('profile.avatarUrl')}>
            <input className={inputClass()} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          </Field>
          <Field label={t('profile.buyerBusinessType')}>
            <select className={inputClass()} value={businessType} onChange={(e) => setBusinessType(e.target.value as BuyerBusinessType | '')}>
              <option value="">{t('profile.buyerBusinessTypeUnspecified')}</option>
              {Object.values(BuyerBusinessType).map((value) => (
                <option key={value} value={value}>
                  {t(`profile.buyerBusinessTypes.${value}`)}
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName || t('profile.avatarAlt')} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">{t('profile.noPhoto')}</div>
                )}
              </div>
              <button
                type="button"
                onClick={setRandomAvatar}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/20"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                {t('profile.useRandomAvatar')}
              </button>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
                <ImagePlus className="h-3.5 w-3.5" />
                {t('profile.uploadFromDevice')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    void onAvatarFileChange(event);
                  }}
                />
              </label>
            </div>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={updateUserMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {updateUserMutation.isPending ? t('profile.saving') : t('profile.saveAccountChanges')}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('profile.buyerRecordTitle')}</h2>
        {buyerQuery.isError ? (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            {t('profile.noBuyerRecord')}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
            <p>{t('profile.idLine', { id: buyerQuery.data?.id ?? '-' })}</p>
            <p>
              {t('profile.buyerBusinessTypeLine', {
                value: buyerQuery.data?.businessType
                  ? t(`profile.buyerBusinessTypes.${buyerQuery.data.businessType}`)
                  : t('profile.buyerBusinessTypeUnspecified'),
              })}
            </p>
            <p>{t('profile.createdLine', { value: formatDate(buyerQuery.data?.createdAt, locale) })}</p>
            <p>{t('profile.updatedLine', { value: formatDate(buyerQuery.data?.updatedAt, locale) })}</p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCreateBuyerProfile}
            disabled={createBuyerMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-primary-300 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/20"
          >
            <PlusCircle className="h-4 w-4" />
            {t('profile.createBuyerProfile')}
          </button>
          <button
            type="button"
            onClick={onDeleteBuyerProfile}
            disabled={deleteBuyerMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            {t('profile.deleteBuyerProfile')}
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-gray-700 dark:text-gray-300">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
}

function formatDate(value: string | undefined, locale: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString(locale);
}
