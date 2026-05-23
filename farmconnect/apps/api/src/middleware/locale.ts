import type { NextFunction, Request, Response } from 'express';

import {
  DEFAULT_LOCALE,
  LOCALE_HEADER,
  resolveSupportedLocale,
  type SupportedLocale,
} from '@farmconnect/shared';

const ACCEPT_LANGUAGE_HEADER = 'accept-language';

function readSingleHeaderValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function parseAcceptLanguage(headerValue: string): SupportedLocale | null {
  const firstTag = headerValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.split(';')[0]?.trim() ?? '')[0];

  if (!firstTag) return null;
  return resolveSupportedLocale(firstTag);
}

export function localeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestedLocaleRaw = readSingleHeaderValue(req.headers[LOCALE_HEADER]);
  const acceptLanguageRaw = readSingleHeaderValue(req.headers[ACCEPT_LANGUAGE_HEADER]);

  const locale = requestedLocaleRaw
    ? resolveSupportedLocale(requestedLocaleRaw)
    : parseAcceptLanguage(acceptLanguageRaw) ?? DEFAULT_LOCALE;

  req.locale = locale;
  res.locals.locale = locale;

  res.setHeader('Content-Language', locale);

  const currentVary = String(res.getHeader('Vary') ?? '');
  if (!currentVary.toLowerCase().includes(ACCEPT_LANGUAGE_HEADER)) {
    res.setHeader('Vary', currentVary ? `${currentVary}, Accept-Language` : 'Accept-Language');
  }

  next();
}