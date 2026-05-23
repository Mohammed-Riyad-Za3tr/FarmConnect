import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import {
  ALGERIA_WILAYAS,
  formatWilayaLabel,
  normalizeCommuneValue,
  resolveWilaya,
  toWilayaStorageValue,
} from '@/shared/constants/algeria-locations';
import { getApiErrorMessage } from '@/shared/utils/api-error';
import {
  useCurrentProducerProfile,
  useUpsertCurrentProducerProfile,
} from '../hooks/useProfile';

export function ProducerOnboardingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const producerQuery = useCurrentProducerProfile();
  const upsertMutation = useUpsertCurrentProducerProfile();

  const [businessName, setBusinessName] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [bio, setBio] = useState('');
  const [nif, setNif] = useState('');
  const [nifDocumentUrl, setNifDocumentUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  useEffect(() => {
    if (!producerQuery.data) return;
    const mappedWilaya = resolveWilaya(producerQuery.data.wilaya);
    setBusinessName(producerQuery.data.businessName ?? '');
    setBusinessType(producerQuery.data.businessType ?? '');
    setBio(producerQuery.data.bio ?? '');
    setWilaya(mappedWilaya?.code ?? '');
    setCommune(normalizeCommuneValue(mappedWilaya?.code ?? producerQuery.data.wilaya, producerQuery.data.commune));
    setNif(producerQuery.data.nif ?? '');
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!businessName.trim() || !wilaya.trim() || !commune.trim()) {
      toast.error(t('profile.onboardingRequiredError'));
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        businessName: businessName.trim(),
        businessType: businessType.trim() || null,
        bio: bio.trim() || null,
        latitude: latitude.trim() ? Number(latitude) : null,
        longitude: longitude.trim() ? Number(longitude) : null,
        wilaya: toWilayaStorageValue(wilaya),
        commune: normalizeCommuneValue(wilaya, commune),
        nif: nif.trim() || null,
        nifDocumentUrl: nifDocumentUrl.trim() || null,
      });
      toast.success(t('profile.onboardingSaved'));
      navigate('/dashboard/verification');
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.onboardingSaveFailed')));
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('profile.producerOnboardingTitle')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('profile.producerOnboardingSubtitle')}</p>

      <form onSubmit={onSubmit} className="mt-5 grid gap-3 md:grid-cols-2">
        <Field label={t('profile.businessNameRequired')}>
          <input className={inputClass()} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </Field>
        <Field label={t('profile.businessType')}>
          <input className={inputClass()} value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
        </Field>
        <Field label={t('profile.wilayaRequired')}>
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
        <Field label={t('profile.communeRequired')}>
          <input
            className={inputClass()}
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            list={selectedWilaya ? 'producer-onboarding-commune-options' : undefined}
            placeholder={t('locations.communePlaceholder')}
            disabled={upsertMutation.isPending || !selectedWilaya}
          />
          {selectedWilaya ? (
            <datalist id="producer-onboarding-commune-options">
              {communeOptions.map((option) => (
                <option key={option.nameEn} value={option.nameEn} label={option.nameAr} />
              ))}
            </datalist>
          ) : null}
        </Field>
        <Field label={t('profile.nif')}>
          <input className={inputClass()} value={nif} onChange={(e) => setNif(e.target.value)} />
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
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={upsertMutation.isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {upsertMutation.isPending ? t('profile.saving') : t('profile.saveAndContinue')}
          </button>
        </div>
      </form>
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

