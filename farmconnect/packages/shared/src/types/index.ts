// ─── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── API Response Envelope ─────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Common Entity Fields ─────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Locale ────────────────────────────────────────────────────────────────────

export type SupportedLocale = 'en' | 'ar';

export interface LocalizedText {
  en: string;
  ar: string;
}

export interface CategoryDto extends BaseEntity {
  slug: string;
  nameEn: string;
  nameAr: string;
  parentId: string | null;
}
