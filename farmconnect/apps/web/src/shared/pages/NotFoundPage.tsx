import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <main className="flex flex-col items-center justify-center py-20 text-center sm:py-28">
      <p className="text-7xl font-bold text-gray-200 sm:text-8xl dark:text-gray-800">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
        {t('errors.notFound')}
      </h1>
      <p className="mt-2 text-gray-500">{t('errors.notFoundMessage')}</p>
      <Link
        to="/"
        className="mt-6 inline-flex w-full max-w-xs items-center justify-center rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
      >
        {t('nav.home')}
      </Link>
    </main>
  );
}
