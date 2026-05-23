import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, ShoppingCart, X } from 'lucide-react';

import { useAuth } from '../providers/AuthProvider';
import { UserRole } from '@farmconnect/shared';
import { NotificationPanel } from '@/features/notifications/components/NotificationPanel';
import { LanguageToggle } from '@/shared/components/LanguageToggle';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LogoutButton } from '../components/LogoutButton';

function buildNavItems(role: UserRole, t: (key: string) => string) {
  const base = [
    { to: '/dashboard', label: t('nav.dashboard') },
    { to: '/dashboard/profile', label: t('nav.profile') },
    { to: '/dashboard/notifications', label: t('nav.notifications') },
  ];

  if (role === UserRole.PRODUCER) {
    return [
      ...base,
      { to: '/dashboard/onboarding', label: t('nav.onboarding') },
      { to: '/dashboard/verification', label: t('nav.verification') },
      { to: '/dashboard/ai-insights', label: t('nav.aiInsights') },
      { to: '/dashboard/products', label: t('nav.products') },
      { to: '/dashboard/coupons', label: 'Coupons' },
      { to: '/dashboard/orders', label: t('nav.orders') },
    ];
  }
  if (role === UserRole.BUYER) {
    return [
      ...base,
      { to: '/dashboard/cart', label: t('nav.cart') },
      { to: '/dashboard/favorites', label: t('nav.favorites') },
      { to: '/dashboard/orders', label: t('nav.orders') },
    ];
  }
  return base;
}

export function DashboardLayout() {
  const { t } = useTranslation(['common', 'layout']);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navItems = user ? buildNavItems(user.role, t) : [];

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('keydown', onEscape);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-e border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex">
        <div className="flex h-16 items-center border-b border-gray-200 px-4 dark:border-gray-800">
          <Link to="/" className="flex items-center gap-2 font-semibold text-primary-700">
            <img src="/logo.svg" alt="" className="h-7 w-7" />
            <span>{t('app.name')}</span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                [
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          <LogoutButton className="w-full rounded-lg px-3 py-2 text-start text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" />
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <header className="flex h-16 items-center border-b border-gray-200 bg-white px-4 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="dashboard-mobile-nav"
                aria-label={isMobileMenuOpen ? t('layout:menu.closeNavigation') : t('layout:menu.openNavigation')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>

              <p className="text-sm text-gray-500">
                {user?.fullName ?? ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === UserRole.BUYER ? (
                <NavLink
                  to="/dashboard/cart"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  aria-label={t('nav.cart')}
                >
                  <ShoppingCart className="h-4 w-4" />
                </NavLink>
              ) : null}
              <LanguageToggle compact />
              <ThemeToggle compact />
              <NotificationPanel compact />
            </div>
          </div>
        </header>

        {isMobileMenuOpen ? (
          <div className="md:hidden">
            <button
              type="button"
              aria-label={t('layout:menu.closeNavigation')}
              className="fixed inset-0 z-40 bg-gray-950/40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside
              id="dashboard-mobile-nav"
              className="fixed inset-y-0 start-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-e border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 font-semibold text-primary-700">
                  <img src="/logo.svg" alt="" className="h-7 w-7" aria-hidden="true" />
                  <span>{t('app.name')}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label={t('layout:menu.closeNavigation')}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav aria-label={t('layout:header.title')} className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    className={({ isActive }) =>
                      [
                        'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-800">
                <LogoutButton className="w-full rounded-lg px-3 py-2 text-start text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" />
              </div>
            </aside>
          </div>
        ) : null}

        <main id="dashboard-main-content" className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
