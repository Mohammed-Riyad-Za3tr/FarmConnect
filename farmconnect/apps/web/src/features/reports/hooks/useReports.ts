import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createReportApi,
  listAdminReportsApi,
  updateAdminReportApi,
  type ReportStatus,
  type ReportTargetType,
  type ReportReason,
} from '../api/reports.api';

export const reportKeys = {
  adminReports: (query: {
    status?: ReportStatus;
    targetType?: ReportTargetType;
    reporterId?: string;
    limit?: number;
    offset?: number;
  }) => ['reports', 'admin', query] as const,
};

export function useCreateReport() {
  return useMutation({
    mutationFn: (payload: {
      targetType: ReportTargetType;
      targetId: string;
      reason: ReportReason;
      description: string;
    }) => createReportApi(payload),
  });
}

export function useAdminReports(query: {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  reporterId?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: reportKeys.adminReports(query),
    queryFn: () => listAdminReportsApi(query),
  });
}

export function useUpdateAdminReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { reportId: string; status: ReportStatus; internalNote?: string }) =>
      updateAdminReportApi(payload.reportId, { status: payload.status, internalNote: payload.internalNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
}
