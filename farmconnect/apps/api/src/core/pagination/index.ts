import type { PaginationMeta, PaginatedResult } from '@farmconnect/shared';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from '@farmconnect/shared';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export function parsePagination(query: Record<string, unknown>): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(query['page'] ?? '1'), 10) || 1);
  const limit = Math.min(
    PAGE_SIZE_MAX,
    Math.max(1, parseInt(String(query['limit'] ?? String(PAGE_SIZE_DEFAULT)), 10) || PAGE_SIZE_DEFAULT),
  );
  return { page, limit };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function paginateArray<T>(items: T[], page: number, limit: number): PaginatedResult<T> {
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  const meta = buildPaginationMeta(items.length, page, limit);
  return { data, meta };
}

export function buildSkipTake(page: number, limit: number): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}
