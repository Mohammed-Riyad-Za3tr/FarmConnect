import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Check, Clock3, FileText, ShieldCheck, X } from 'lucide-react';

import { getApiErrorMessage } from '@/shared/utils/api-error';
import {
  useAdminProducerVerificationRequests,
  useReviewAdminProducerVerificationRequest,
} from '../hooks/useProfile';
import type { VerificationReviewStatus } from '../api/profile.api';

export function AdminVerificationReviewPage() {
  const { t, i18n } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<VerificationReviewStatus | 'ALL'>('ALL');
  const allQuery = useAdminProducerVerificationRequests();
  const query = useAdminProducerVerificationRequests(statusFilter === 'ALL' ? undefined : statusFilter);
  const reviewMutation = useReviewAdminProducerVerificationRequest();
  const [reviewDialog, setReviewDialog] = useState<{
    requestId: string;
    action: 'APPROVE' | 'REJECT';
    notes: string;
  } | null>(null);

  function openReviewDialog(requestId: string, action: 'APPROVE' | 'REJECT') {
    setReviewDialog({ requestId, action, notes: '' });
  }

  async function submitReview() {
    if (!reviewDialog) return;

    const notes = reviewDialog.notes.trim();

    if (reviewDialog.action === 'REJECT' && !notes) {
      toast.error(t('admin.producerReview.rejectionReasonRequired'));
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        requestId: reviewDialog.requestId,
        payload: { action: reviewDialog.action, notes: notes || undefined },
      });
      setReviewDialog(null);
      toast.success(
        reviewDialog.action === 'APPROVE'
          ? t('admin.producerReview.requestApproved')
          : t('admin.producerReview.requestRejected'),
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('admin.producerReview.reviewFailed')));
    }
  }

  const locale = (i18n.resolvedLanguage ?? i18n.language ?? 'en').startsWith('ar') ? 'ar-DZ' : 'en-US';
  const pendingCount =
    allQuery.data?.filter((item) => item.verificationStatus === 'PENDING').length ?? 0;
  const approvedCount =
    allQuery.data?.filter((item) => item.verificationStatus === 'APPROVED').length ?? 0;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('admin.producerReview.title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t('admin.producerReview.subtitle')}</p>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <label className="block text-sm text-gray-700 dark:text-gray-300">
          {t('admin.producerReview.statusFilter')}
          <select
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm sm:mt-0 sm:ms-2 sm:inline-block sm:w-auto dark:border-gray-700 dark:bg-gray-800"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as VerificationReviewStatus | 'ALL')}
          >
            <option value="ALL">{t('admin.producerReview.statusAll')}</option>
            <option value="PENDING">{t('products.verification.PENDING')}</option>
            <option value="APPROVED">{t('products.verification.APPROVED')}</option>
            <option value="REJECTED">{t('products.verification.REJECTED')}</option>
          </select>
        </label>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {t('products.verification.PENDING')}: <strong>{pendingCount}</strong> ·{' '}
          {t('products.verification.APPROVED')}: <strong>{approvedCount}</strong>
        </p>

        {query.isLoading ? (
          <p className="mt-3 text-sm text-gray-500">{t('admin.producerReview.loading')}</p>
        ) : query.data?.length ? (
          <div className="mt-4 space-y-3">
            {query.data.map((item) => {
              const latestRequest = item.latestRequest;
              const canReview = item.verificationStatus === 'PENDING' && !!latestRequest;
              const latestSubmissionLabel = latestRequest?.submittedAt
                ? new Date(latestRequest.submittedAt).toLocaleString(locale)
                : t('admin.producerReview.noRequestYet');
              const reviewedAtLabel = item.verifiedAt
                ? new Date(item.verifiedAt).toLocaleString(locale)
                : latestRequest?.reviewedAt
                  ? new Date(latestRequest.reviewedAt).toLocaleString(locale)
                  : null;

              return (
                <article
                  key={item.id}
                  className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.businessName} · {item.user.fullName}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {item.wilaya}, {item.commune} · {item.user.email}
                  </p>

                  <div className="mt-3 grid gap-2 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-2">
                    <p className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {t('admin.producerReview.currentStatusLine', {
                        status: t(`products.verification.${item.verificationStatus}`, {
                          defaultValue: item.verificationStatus,
                        }),
                      })}
                    </p>
                    <p className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      {t('admin.producerReview.submittedAtLine', { date: latestSubmissionLabel })}
                    </p>
                    <p className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      {t('admin.producerReview.documentsCount', {
                        count: latestRequest?.documents.length ?? 0,
                      })}
                    </p>
                    {reviewedAtLabel ? (
                      <p>{t('admin.producerReview.reviewedAtLine', { date: reviewedAtLabel })}</p>
                    ) : null}
                  </div>

                  {latestRequest?.notes ? (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                      {t('admin.producerReview.notesLine', { notes: latestRequest.notes })}
                    </p>
                  ) : null}

                  {!latestRequest ? (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                      {t('admin.producerReview.noRequestMessage')}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => latestRequest && openReviewDialog(latestRequest.id, 'APPROVE')}
                      disabled={reviewMutation.isPending || !canReview}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {reviewMutation.isPending ? t('profile.saving') : t('admin.producerReview.approve')}
                    </button>
                    <button
                      type="button"
                      onClick={() => latestRequest && openReviewDialog(latestRequest.id, 'REJECT')}
                      disabled={reviewMutation.isPending || !canReview}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      {reviewMutation.isPending ? t('profile.saving') : t('admin.producerReview.reject')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">{t('admin.producerReview.none')}</p>
        )}
      </div>

      {reviewDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {reviewDialog.action === 'APPROVE'
                ? t('admin.producerReview.approve')
                : t('admin.producerReview.reject')}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {reviewDialog.action === 'APPROVE'
                ? t('admin.producerReview.optionalNotesPrompt')
                : t('admin.producerReview.rejectionReasonPrompt')}
            </p>

            <textarea
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              rows={4}
              value={reviewDialog.notes}
              onChange={(event) =>
                setReviewDialog((prev) =>
                  prev ? { ...prev, notes: event.target.value } : prev,
                )
              }
              placeholder={
                reviewDialog.action === 'APPROVE'
                  ? t('admin.producerReview.optionalNotesPrompt')
                  : t('admin.producerReview.rejectionReasonPrompt')
              }
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewDialog(null)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                type="button"
                onClick={submitReview}
                disabled={reviewMutation.isPending}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {reviewMutation.isPending
                  ? t('profile.saving')
                  : t('common.confirm', { defaultValue: 'Confirm' })}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
