import type { SupportedLocale } from '../types';

// ─── Pagination ────────────────────────────────────────────────────────────────

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 100;
export const PAGE_SIZE_MIN = 1;

// ─── Locales ──────────────────────────────────────────────────────────────────

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'ar'];
export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const RTL_LOCALES: SupportedLocale[] = ['ar'];
export const LOCALE_STORAGE_KEY = 'fc_language';
export const LOCALE_HEADER = 'x-locale';

export function resolveSupportedLocale(input: string | null | undefined): SupportedLocale {
  const normalized = String(input ?? '').trim().toLowerCase();

  if (!normalized) return DEFAULT_LOCALE;
  if (normalized.startsWith('ar')) return 'ar';
  if (normalized.startsWith('en')) return 'en';

  return DEFAULT_LOCALE;
}

// ─── Currencies ───────────────────────────────────────────────────────────────

export const CURRENCIES = {
  DZD: 'DZD',
  USD: 'USD',
  EUR: 'EUR',
} as const;

export type Currency = keyof typeof CURRENCIES;

export const DEFAULT_CURRENCY: Currency = 'DZD';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_DAYS = 30;

// ─── File Uploads ─────────────────────────────────────────────────────────────

export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_PRODUCT_IMAGES = 8;

// ─── Product ──────────────────────────────────────────────────────────────────

export const PRODUCT_TITLE_MAX_LENGTH = 120;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 2000;
export const PRODUCT_PRICE_MAX = 9_999_999;
export const PREDEFINED_PRODUCT_TAGS = [
  'organic',
  'fresh',
  'seasonal',
  'local',
  'premium',
  'wholesale',
  'imported',
  'discount',
] as const;
export const PREDEFINED_BUSINESS_TYPES = [
  'Farm',
  'Cooperative',
  'Distributor',
  'Wholesaler',
  'Retailer',
  'Processor',
  'Other',
] as const;

// ─── Order ────────────────────────────────────────────────────────────────────

export const MIN_ORDER_QUANTITY = 1;
export const MAX_ORDER_QUANTITY = 10_000;
