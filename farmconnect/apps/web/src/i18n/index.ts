import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
} from '@farmconnect/shared';

export const I18N_NAMESPACES = [
  'common',
  'layout',
  'auth',
  'profile',
  'products',
  'orders',
  'notifications',
  'analytics',
  'admin',
  'cart',
  'ai',
] as const;

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    cleanCode: true,
    lowerCaseLng: true,
    defaultNS: 'common',
    fallbackNS: 'common',
    ns: [...I18N_NAMESPACES],

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      order: ['localStorage', 'querystring', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      lookupQuerystring: 'lng',
    },

    react: {
      useSuspense: true,
    },

    interpolation: {
      escapeValue: false, // React handles XSS escaping
    },

    returnNull: false,
    returnEmptyString: false,
  });

export default i18n;
