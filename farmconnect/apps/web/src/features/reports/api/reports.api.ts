import { apiClient } from '@/shared/api/client';

export type ReportTargetType = 'USER' | 'PRODUCT' | 'ORDER';
export type ReportReason = 'SPAM' | 'FRAUD' | 'ABUSE' | 'INAPPROPRIATE_CONTENT' | 'OTHER';
export type ReportStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';

export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  internalNote?: string | null;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export interface ListReportsResponse {
  items: ReportItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

function toParams(input: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  return params;
}

export async function createReportApi(payload: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
}): Promise<ReportItem> {
  const { data } = await apiClient.post<{ data: { report: ReportItem } }>('/api/reports', payload);
  return data.data.report;
}

export async function listAdminReportsApi(query: {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  reporterId?: string;
  limit?: number;
  offset?: number;
}): Promise<ListReportsResponse> {
  const { data } = await apiClient.get<{ data: ListReportsResponse }>('/api/reports/admin', {
    params: toParams(query as Record<string, unknown>),
  });
  return data.data;
}

export async function updateAdminReportApi(
  reportId: string,
  payload: { status: ReportStatus; internalNote?: string },
): Promise<ReportItem> {
  const { data } = await apiClient.patch<{ data: { report: ReportItem } }>(`/api/reports/admin/${reportId}`, payload);
  return data.data.report;
}
