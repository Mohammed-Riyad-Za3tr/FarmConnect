import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';

import { LanguageToggle } from '@/shared/components/LanguageToggle';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LogoutButton } from '../components/LogoutButton';

export function AdminLayout() {
  const { t } = useTranslation(['common', 'layout']);
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/admin', label: t('admin.nav.overview') },
    { to: '/admin/producer-verifications', label: t('admin.nav.producerVerifications') },
    { to: '/admin/users', label: t('admin.nav.users') },
    { to: '/admin/products', label: t('admin.nav.products') },
    { to: '/admin/orders', label: t('admin.nav.orders') },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/audit-logs', label: t('admin.nav.auditLogs') },
  ];

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
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      <aside className="hidden w-64 flex-col border-e border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:flex">
        <div className="flex h-16 items-center border-b border-gray-200 px-4 dark:border-gray-800">
          <Link to="/" className="font-bold text-primary-700">
            {t('app.name')} <span className="ms-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">{t('admin.badge')}</span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
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

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="admin-mobile-nav"
              aria-label={isMobileMenuOpen ? t('layout:menu.closeNavigation') : t('layout:menu.openNavigation')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('nav.admin')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle compact />
            <ThemeToggle compact />
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
              id="admin-mobile-nav"
              className="fixed inset-y-0 start-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-e border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-4 flex items-center justify-between">
                <Link to="/" className="font-bold text-primary-700">
                  {t('app.name')}{' '}
                  <span className="ms-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">{t('admin.badge')}</span>
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

              <nav aria-label={t('layout:header.title')} className="flex flex-col gap-0.5">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
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

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
