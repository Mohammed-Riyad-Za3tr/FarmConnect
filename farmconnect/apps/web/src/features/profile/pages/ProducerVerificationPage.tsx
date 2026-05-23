import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import { getApiErrorMessage } from '@/shared/utils/api-error';
import {
  useProducerVerificationStatus,
  useSubmitProducerVerificationRequest,
} from '../hooks/useProfile';

export function ProducerVerificationPage() {
  const { t, i18n } = useTranslation();
  const statusQuery = useProducerVerificationStatus();
  const submitMutation = useSubmitProducerVerificationRequest();

  const [notes, setNotes] = useState('');
  const [documentsRaw, setDocumentsRaw] = useState('');

  const currentStatus = statusQuery.data?.producerProfile.verificationStatus ?? 'UNVERIFIED';
  const latestRequest = statusQuery.data?.latestRequest;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const documents = documentsRaw
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    if (!documents.length) {
      toast.error(t('profile.verificationDocumentRequired'));
      return;
    }

    try {
      await submitMutation.mutateAsync({ documents, notes: notes.trim() || undefined });
      toast.success(t('profile.verificationSubmitted'));
      setNotes('');
      setDocumentsRaw('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.verificationSubmitFailed')));
    }
  }

  const locale = (i18n.resolvedLanguage ?? i18n.language ?? 'en').startsWith('ar') ? 'ar-DZ' : 'en-US';
  const currentStatusLabel = t(`products.verification.${currentStatus}`, { defaultValue: currentStatus });
  const latestStatusLabel = latestRequest
    ? t(`products.verification.${latestRequest.status}`, { defaultValue: latestRequest.status })
    : t('profile.noRequestYet');

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('profile.verificationTitle')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('profile.verificationSubtitle')}</p>

        <div className="mt-4 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
          <p>
            {t('profile.currentStatus')}: <strong>{currentStatusLabel}</strong>
          </p>
          <p className="mt-1">{t('profile.latestRequest')}: {latestStatusLabel}</p>
          {latestRequest?.reviewedAt && (
            <p className="mt-1">{t('profile.reviewedAt')}: {new Date(latestRequest.reviewedAt).toLocaleString(locale)}</p>
          )}
          {latestRequest?.notes && <p className="mt-1">{t('profile.notes')}: {latestRequest.notes}</p>}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('profile.submitRequest')}</h2>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            <span>{t('profile.documentUrls')}</span>
            <textarea
              rows={6}
              className={inputClass()}
              value={documentsRaw}
              onChange={(e) => setDocumentsRaw(e.target.value)}
              placeholder={t('profile.documentPlaceholder')}
            />
          </label>

          <label className="block text-sm text-gray-700 dark:text-gray-300">
            <span>{t('profile.notesOptional')}</span>
            <textarea
              rows={3}
              className={inputClass()}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('profile.notesPlaceholder')}
            />
          </label>

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {submitMutation.isPending ? t('profile.submitting') : t('profile.submitVerificationRequest')}
          </button>
        </form>
      </section>
    </div>
  );
}

function inputClass() {
  return 'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
}

