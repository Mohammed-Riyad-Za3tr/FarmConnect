import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ImagePlus, Save, Trash2 } from 'lucide-react';
import { PREDEFINED_BUSINESS_TYPES } from '@farmconnect/shared';

import {
  ALGERIA_WILAYAS,
  formatWilayaLabel,
  normalizeCommuneValue,
  resolveWilaya,
  toWilayaStorageValue,
} from '@/shared/constants/algeria-locations';
import { getApiErrorMessage } from '@/shared/utils/api-error';
import { DEFAULT_MAX_UPLOAD_BYTES, isImageFile, isWithinSizeLimit, readFileAsDataUrl } from '@/shared/utils/file-upload';
import {
  useCurrentProducerProfile,
  useCurrentUserProfile,
  useDeleteCurrentProducerProfile,
  useProducerVerificationStatus,
  useUpdateCurrentUserProfile,
  useUpsertCurrentProducerProfile,
} from '../hooks/useProfile';
import { useCreateReport } from '@/features/reports/hooks/useReports';

export function ProducerProfilePage() {
  const { t, i18n } = useTranslation();
  const userQuery = useCurrentUserProfile();
  const producerQuery = useCurrentProducerProfile();
  const verificationQuery = useProducerVerificationStatus();
  const updateUserMutation = useUpdateCurrentUserProfile();
  const upsertProducerMutation = useUpsertCurrentProducerProfile();
  const deleteProducerMutation = useDeleteCurrentProducerProfile();
  const createReportMutation = useCreateReport();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [bio, setBio] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [nif, setNif] = useState('');
  const [nis, setNis] = useState('');
  const [nifDocumentUrl, setNifDocumentUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  useEffect(() => {
    if (!userQuery.data) return;
    setFullName(userQuery.data.fullName ?? '');
    setPhone(userQuery.data.phone ?? '');
    setAvatarUrl(userQuery.data.avatarUrl ?? '');
  }, [userQuery.data]);

  function setRandomAvatar() {
    const seed = `${fullName.trim() || 'producer'}-${Date.now()}`;
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
    if (!producerQuery.data) return;
    const mappedWilaya = resolveWilaya(producerQuery.data.wilaya);
    setBusinessName(producerQuery.data.businessName ?? '');
    setBusinessType(producerQuery.data.businessType ?? '');
    setBio(producerQuery.data.bio ?? '');
    setWilaya(mappedWilaya?.code ?? '');
    setCommune(normalizeCommuneValue(mappedWilaya?.code ?? producerQuery.data.wilaya, producerQuery.data.commune));
    setNif(producerQuery.data.nif ?? '');
    setNis(producerQuery.data.nis ?? '');
    setNifDocumentUrl(producerQuery.data.nifDocumentUrl ?? '');
    setLatitude(
      producerQuery.data.latitude === null || producerQuery.data.latitude === undefined
        ? ''
        : String(producerQuery.data.latitude),
    );
    setLongitude(
      producerQuery.data.longitude === null || producerQuery.data.longitude === undefined
        ? ''
        : String(producerQuery.data.longitude),
    );
  }, [producerQuery.data]);

  const selectedWilaya = resolveWilaya(wilaya);
  const communeOptions = selectedWilaya?.communes ?? [];

  async function onSaveUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateUserMutation.mutateAsync({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      toast.success(t('profile.accountUpdated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.accountUpdateFailed')));
    }
  }

  async function onSaveProducer(e: React.FormEvent) {
    e.preventDefault();
    try {
      await upsertProducerMutation.mutateAsync({
        businessName: businessName.trim(),
        businessType: businessType.trim() || null,
        bio: bio.trim() || null,
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
        wilaya: toWilayaStorageValue(wilaya),
        commune: normalizeCommuneValue(wilaya, commune),
        nif: nif.trim() || null,
        nis: nis.trim() || null,
        nifDocumentUrl: nifDocumentUrl.trim() || null,
      });
      toast.success(t('profile.producerProfileSaved'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.producerProfileSaveFailed')));
    }
  }

  async function onDeleteProducer() {
    try {
      await deleteProducerMutation.mutateAsync();
      toast.success(t('profile.producerProfileDeleted'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.producerProfileDeleteFailed')));
    }
  }

  const status = verificationQuery.data?.producerProfile.verificationStatus ?? producerQuery.data?.verificationStatus;
  const statusLabel = t(`products.verification.${status ?? 'UNVERIFIED'}`, {
    defaultValue: status ?? 'UNVERIFIED',
  });

  async function reportThisProfile() {
    const description = window.prompt('Describe the issue (min 10 chars)');
    if (!description || !userQuery.data?.id) return;
    try {
      await createReportMutation.mutateAsync({
        targetType: 'USER',
        targetId: userQuery.data.id,
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
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('profile.producerTitle')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('profile.producerSubtitle')}</p>

        <div className="mt-3 rounded-lg border border-gray-200 p-3 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
          {t('profile.verificationStatusLine', { status: statusLabel })}
          <div className="mt-2 flex gap-2">
            <Link className="text-primary-600 hover:text-primary-500" to="/dashboard/onboarding">
              {t('profile.completeOnboarding')}
            </Link>
            <Link className="text-primary-600 hover:text-primary-500" to="/dashboard/verification">
              {t('profile.openVerificationPage')}
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            void reportThisProfile();
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
        >
          Report profile
        </button>

        <form onSubmit={onSaveUser} className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label={t('auth.fullName')}>
            <input className={inputClass()} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label={t('profile.phone')}>
            <input className={inputClass()} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label={t('profile.avatarUrl')}>
            <input className={inputClass()} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
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
              {t('profile.saveAccountProfile')}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('profile.businessDetails')}</h2>

        <form onSubmit={onSaveProducer} className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label={t('auth.businessName')}>
            <input className={inputClass()} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </Field>
          <Field label={t('profile.businessType')}>
            <select className={inputClass()} value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
              <option value="">Select business type</option>
              {PREDEFINED_BUSINESS_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('auth.wilaya')}>
            <select
              className={inputClass()}
              value={wilaya}
              onChange={(e) => {
                setWilaya(e.target.value);
                setCommune('');
              }}
            >
              <option value="">{t('locations.selectWilaya')}</option>
              {ALGERIA_WILAYAS.map((option) => (
                <option key={option.code} value={option.code}>
                  {formatWilayaLabel(option, i18n.resolvedLanguage ?? i18n.language)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('auth.commune')}>
            <input
              className={inputClass()}
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              list={selectedWilaya ? 'producer-profile-commune-options' : undefined}
              placeholder={t('locations.communePlaceholder')}
              disabled={upsertProducerMutation.isPending || !selectedWilaya}
            />
            {selectedWilaya ? (
              <datalist id="producer-profile-commune-options">
                {communeOptions.map((option) => (
                  <option key={option.nameEn} value={option.nameEn} label={option.nameAr} />
                ))}
              </datalist>
            ) : null}
          </Field>
          <Field label={t('profile.nif')}>
            <input className={inputClass()} value={nif} onChange={(e) => setNif(e.target.value)} />
          </Field>
          <Field label="NIS">
            <input className={inputClass()} value={nis} onChange={(e) => setNis(e.target.value)} placeholder="15 digits" />
          </Field>
          <Field label={t('profile.nifDocumentUrl')}>
            <input className={inputClass()} value={nifDocumentUrl} onChange={(e) => setNifDocumentUrl(e.target.value)} />
          </Field>
          <Field label={t('profile.latitude')}>
            <input
              type="number"
              step="any"
              className={inputClass()}
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 36.7538"
            />
          </Field>
          <Field label={t('profile.longitude')}>
            <input
              type="number"
              step="any"
              className={inputClass()}
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. 3.0588"
            />
          </Field>
          <label className="md:col-span-2 block text-sm text-gray-700 dark:text-gray-300">
            <span>{t('profile.bio')}</span>
            <textarea className={inputClass()} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={upsertProducerMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {t('profile.saveProducerProfile')}
            </button>
            <button
              type="button"
              onClick={onDeleteProducer}
              disabled={deleteProducerMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
              {t('profile.deleteProducerProfile')}
            </button>
          </div>
        </form>
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

