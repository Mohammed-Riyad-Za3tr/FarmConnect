import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

import {
  LOCALE_STORAGE_KEY,
  resolveSupportedLocale,
  RTL_LOCALES,
  type SupportedLocale,
} from '@farmconnect/shared';

import i18n from '@/i18n';
import { setClientLocale } from '@/shared/api/client';

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (nextLocale: SupportedLocale) => Promise<void>;
  toggleLocale: () => Promise<void>;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getCurrentLocale(): SupportedLocale {
  return resolveSupportedLocale(i18n.resolvedLanguage ?? i18n.language);
}

function syncDomForLocale(locale: SupportedLocale): void {
  const isRTL = RTL_LOCALES.includes(locale);
  document.documentElement.setAttribute('lang', locale);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
}

function persistLocale(locale: SupportedLocale): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(getCurrentLocale);

  useEffect(() => {
    const initialLocale = getCurrentLocale();
    setLocaleState(initialLocale);
    syncDomForLocale(initialLocale);
    persistLocale(initialLocale);
    setClientLocale(initialLocale);

    const onLanguageChanged = (language: string) => {
      const nextLocale = resolveSupportedLocale(language);
      setLocaleState(nextLocale);
      syncDomForLocale(nextLocale);
      persistLocale(nextLocale);
      setClientLocale(nextLocale);
    };

    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  const setLocale = useCallback(async (nextLocale: SupportedLocale) => {
    const normalized = resolveSupportedLocale(nextLocale);
    await i18n.changeLanguage(normalized);
  }, []);

  const toggleLocale = useCallback(async () => {
    const nextLocale: SupportedLocale = locale === 'ar' ? 'en' : 'ar';
    await setLocale(nextLocale);
  }, [locale, setLocale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      isRTL: RTL_LOCALES.includes(locale),
    }),
    [locale, setLocale, toggleLocale],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>
        <Suspense fallback={null}>{children}</Suspense>
      </I18nContext.Provider>
    </I18nextProvider>
  );
}

export function useLocale(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useLocale must be used inside I18nProvider');
  }
  return context;
}
