import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { getApiErrorMessage } from '@/shared/utils/api-error';
import { useAdminReports, useUpdateAdminReport } from '../hooks/useReports';
import type { ReportStatus, ReportTargetType } from '../api/reports.api';

const STATUS_OPTIONS: ReportStatus[] = ['OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED'];
const TARGET_OPTIONS: ReportTargetType[] = ['USER', 'PRODUCT', 'ORDER'];

export function AdminReportsPage() {
  const [status, setStatus] = useState<'' | ReportStatus>('');
  const [targetType, setTargetType] = useState<'' | ReportTargetType>('');
  const [internalNote, setInternalNote] = useState<Record<string, string>>({});

  const query = useMemo(
    () => ({
      status: status || undefined,
      targetType: targetType || undefined,
      limit: 50,
      offset: 0,
    }),
    [status, targetType],
  );

  const reportsQuery = useAdminReports(query);
  const updateMutation = useUpdateAdminReport();

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Moderate user-submitted reports.</p>
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as '' | ReportStatus)} className={inputClass()}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">Target type</span>
            <select value={targetType} onChange={(event) => setTargetType(event.target.value as '' | ReportTargetType)} className={inputClass()}>
              <option value="">All targets</option>
              {TARGET_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {reportsQuery.isLoading ? <p className="text-sm text-gray-500">Loading...</p> : null}

      {reportsQuery.data?.items.length ? (
        <div className="space-y-3">
          {reportsQuery.data.items.map((item) => (
            <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{item.targetType} · {item.reason}</p>
                  <p className="text-xs text-gray-500">Target: {item.targetId}</p>
                  <p className="text-xs text-gray-500">Reporter: {item.reporter?.email ?? item.reporterId}</p>
                </div>
                <p className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">{item.status}</p>
              </div>
              <p className="mt-2 text-gray-700 dark:text-gray-200">{item.description}</p>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <select
                  className={inputClass()}
                  defaultValue={item.status}
                  onChange={async (event) => {
                    try {
                      await updateMutation.mutateAsync({
                        reportId: item.id,
                        status: event.target.value as ReportStatus,
                        internalNote: internalNote[item.id] || undefined,
                      });
                      toast.success('Report updated');
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, 'Failed to update report'));
                    }
                  }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <input
                  className={`${inputClass()} md:col-span-2`}
                  placeholder="Internal note"
                  value={internalNote[item.id] ?? item.internalNote ?? ''}
                  onChange={(event) =>
                    setInternalNote((prev) => ({
                      ...prev,
                      [item.id]: event.target.value,
                    }))
                  }
                />
              </div>
            </article>
          ))}
        </div>
      ) : reportsQuery.isLoading ? null : (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No reports found.
        </div>
      )}
    </div>
  );
}

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
}
