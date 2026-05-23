import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { LanguageToggle } from '@/shared/components/LanguageToggle';
import { ThemeToggle } from '@/shared/components/ThemeToggle';

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10 sm:py-12 dark:bg-gray-950">
      <div className="absolute end-4 top-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="mb-8 flex flex-col items-center">
        <Link to="/">
          <img src="/logo.svg" alt={t('app.name')} className="h-12 w-12" />
        </Link>
        <Link to="/" className="mt-2 text-xl font-bold text-primary-700">
          {t('app.name')}
        </Link>
      </div>

      <main className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8 dark:bg-gray-900 dark:ring-gray-800">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
