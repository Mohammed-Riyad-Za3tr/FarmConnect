import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/app/providers/I18nProvider';

function nextLanguage(current: string): 'en' | 'ar' {
  return current === 'ar' ? 'en' : 'ar';
}

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation('layout');
  const { locale, setLocale } = useLocale();

  const next = nextLanguage(locale);

  const currentLabel = locale === 'ar' ? t('language.currentArabic') : t('language.currentEnglish');
  const nextLabel = next === 'ar' ? t('language.currentArabic') : t('language.currentEnglish');

  return (
    <button
      type="button"
      onClick={() => {
        void setLocale(next);
      }}
      className={[
        'inline-flex items-center rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800',
        compact ? 'h-9 w-9 justify-center p-0' : 'gap-2 px-3 py-1.5',
      ].join(' ')}
      title={t('language.switchTo', { locale: nextLabel })}
      aria-label={t('language.switchTo', { locale: nextLabel })}
    >
      <Languages className="h-4 w-4" />
      {!compact ? <span>{currentLabel}</span> : null}
    </button>
  );
}
