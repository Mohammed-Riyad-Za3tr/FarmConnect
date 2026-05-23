import { useTranslation } from 'react-i18next';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';

export function BuyerDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div>
      <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
        <LayoutDashboard className="h-6 w-6 text-primary-600" />
        {t('nav.dashboard')}
      </h1>
      <p className="mt-1 text-gray-500">{t('dashboard.welcomeBack', { name: user?.fullName ?? '' })}</p>
    </div>
  );
}
