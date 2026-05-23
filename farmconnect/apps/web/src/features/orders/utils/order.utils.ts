import i18n from '@/i18n';

export function asCurrency(value: string | number, currency = 'DZD'): string {
  const number = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(number)) return `${value} ${currency}`;
  const locale = (i18n.resolvedLanguage ?? i18n.language ?? 'en').startsWith('ar') ? 'ar-DZ' : 'en-US';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(number) + ` ${currency}`;
}

export function formatOrderDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const locale = (i18n.resolvedLanguage ?? i18n.language ?? 'en').startsWith('ar') ? 'ar-DZ' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function titleFromUnknown(value: unknown, fallback = 'Unnamed product'): string {
  if (typeof value === 'string' && value.trim() && value.trim() !== '[object Object]') return value;
  if (value && typeof value === 'object') {
    const maybe = value as Record<string, unknown>;
    if (typeof maybe.en === 'string' && maybe.en.trim()) return maybe.en;
    if (typeof maybe.ar === 'string' && maybe.ar.trim()) return maybe.ar;
  }
  return fallback;
}

export function statusLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

export function readProductSnapshot(snapshot: unknown): { title: string; imageUrl: string | null; unit: string | null } {
  if (!snapshot || typeof snapshot !== 'object') {
    return { title: '', imageUrl: null, unit: null };
  }

  const value = snapshot as Record<string, unknown>;

  return {
    title: titleFromUnknown(value.title ?? '', ''),
    imageUrl: typeof value.imageUrl === 'string' ? value.imageUrl : null,
    unit: typeof value.unit === 'string' ? value.unit : null,
  };
}
