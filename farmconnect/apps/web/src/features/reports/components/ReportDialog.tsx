import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import type { ReportReason } from '../api/reports.api';

const REPORT_REASONS: ReportReason[] = ['SPAM', 'FRAUD', 'ABUSE', 'INAPPROPRIATE_CONTENT', 'OTHER'];
const MIN_REPORT_DESCRIPTION_LENGTH = 3;

interface ReportDialogProps {
  open: boolean;
  title: string;
  busy?: boolean;
  onCancel: () => void;
  onSubmit: (payload: { reason: ReportReason; description: string }) => Promise<void> | void;
}

export function ReportDialog({ open, title, busy = false, onCancel, onSubmit }: ReportDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReason>('OTHER');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason('OTHER');
    setDescription('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onCancel();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel, open]);

  if (!open || typeof document === 'undefined') return null;

  const trimmedDescription = description.trim();
  const canSubmit = !busy && trimmedDescription.length >= MIN_REPORT_DESCRIPTION_LENGTH;

  return createPortal(
    <div className="fixed inset-0 z-[110] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title">
      <button
        type="button"
        aria-label={t('common.close')}
        onClick={() => {
          if (!busy) onCancel();
        }}
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
      />
      <div className="relative flex min-h-dvh items-center justify-center px-4 py-6">
        <section className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <h2 id="report-dialog-title" className="text-base font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t('products.reportDialogDescription')}
          </p>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('products.reportReason')}</span>
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value as ReportReason)}
                className={inputClass()}
              >
                {REPORT_REASONS.map((item) => (
                  <option key={item} value={item}>
                    {t(`products.reportReasons.${item}`, { defaultValue: item })}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('products.reportDescription')}</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder={t('products.reportDescriptionPlaceholder')}
                className={inputClass()}
              />
              <span className="mt-1 block text-[11px] text-gray-500 dark:text-gray-400">
                {t('products.reportDescriptionHelp', { count: MIN_REPORT_DESCRIPTION_LENGTH })}
              </span>
            </label>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                void onSubmit({ reason, description: trimmedDescription });
              }}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {t('products.submitReport')}
            </button>
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
}

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
}
