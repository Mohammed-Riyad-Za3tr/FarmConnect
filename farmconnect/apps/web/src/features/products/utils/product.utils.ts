import type { LocalizedText } from '../api/products.api';
import i18n from '@/i18n';
import { resolveWilaya } from '@/shared/constants/algeria-locations';

export function textFromLocalized(value: LocalizedText | null | undefined, lang: 'en' | 'ar' = 'en') {
  const activeLang = (i18n.resolvedLanguage ?? i18n.language ?? lang).startsWith('ar') ? 'ar' : lang;
  if (!value) return '';
  return (activeLang === 'ar' ? value.ar : value.en) ?? value.en ?? value.ar ?? '';
}

export function asCurrency(value: string | number, currency = 'DZD') {
  const number = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(number)) return `${value} ${currency}`;
  const locale = (i18n.resolvedLanguage ?? i18n.language ?? 'en').startsWith('ar') ? 'ar-DZ' : 'en-US';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(number) + ` ${currency}`;
}

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function computeDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat?: number | string | null,
  toLng?: number | string | null,
) {
  const targetLat = typeof toLat === 'string' ? Number(toLat) : toLat;
  const targetLng = typeof toLng === 'string' ? Number(toLng) : toLng;
  if (targetLat == null || targetLng == null || Number.isNaN(targetLat) || Number.isNaN(targetLng)) {
    return null;
  }

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(targetLat - fromLat);
  const dLng = toRadians(targetLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(targetLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function formatDistanceKm(distanceKm: number | null) {
  if (distanceKm == null) return '';
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km away`;
}

export function formatWilayaForDisplay(value: string) {
  const resolved = resolveWilaya(value);
  if (!resolved) return value;
  const isArabic = (i18n.resolvedLanguage ?? i18n.language ?? 'en').startsWith('ar');
  return isArabic ? resolved.nameAr : resolved.nameEn;
}

export function buildGoogleMapsDirectionsUrl(input: {
  latitude?: number | string | null;
  longitude?: number | string | null;
  commune?: string | null;
  wilaya?: string | null;
}) {
  const latitude = typeof input.latitude === 'string' ? Number(input.latitude) : input.latitude;
  const longitude = typeof input.longitude === 'string' ? Number(input.longitude) : input.longitude;
  if (latitude != null && longitude != null && !Number.isNaN(latitude) && !Number.isNaN(longitude)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }

  const label = [input.commune, input.wilaya].filter(Boolean).join(', ');
  if (!label) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
}
