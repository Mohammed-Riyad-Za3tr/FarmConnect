import { useEffect, useState } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, ShoppingCart, X } from 'lucide-react';

import { NotificationPanel } from '@/features/notifications/components/NotificationPanel';
import { LanguageToggle } from '@/shared/components/LanguageToggle';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LogoutButton } from '../components/LogoutButton';

import { roleHomePath, useAuth } from '../providers/AuthProvider';

export function MainLayout() {
  const { t } = useTranslation(['common', 'layout']);
  const { isAuthenticated, user } = useAuth();
  const dashboardPath = user ? roleHomePath(user.role) : '/dashboard';
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-700"
      >
        {t('layout:menu.skipToContent')}
      </a>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold text-primary-700">
            <img src="/logo.svg" alt="" className="h-8 w-8" aria-hidden="true" />
            <span>{t('app.name')}</span>
          </Link>

          <nav aria-label={t('layout:header.title')} className="hidden items-center gap-6 md:flex">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive
                  ? 'text-sm font-medium text-primary-600'
                  : 'text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }
            >
              {t('nav.products')}
            </NavLink>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? <NotificationPanel compact /> : null}
            {isAuthenticated && user?.role === 'BUYER' ? (
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

            <div className="hidden items-center gap-3 md:flex">
              {isAuthenticated ? (
                <>
                <NavLink to={dashboardPath} className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300">
                  {t('nav.dashboard')}
                </NavLink>
                <LogoutButton className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300" />
                </>
              ) : (
                <>
                <NavLink
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300"
                >
                  {t('nav.login')}
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  {t('nav.register')}
                </NavLink>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="main-layout-mobile-menu"
              aria-label={isMobileMenuOpen ? t('layout:menu.closeNavigation') : t('layout:menu.openNavigation')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div id="main-layout-mobile-menu" className="border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 md:hidden">
            <nav aria-label={t('layout:header.title')} className="flex flex-col gap-2">
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                  ].join(' ')
                }
              >
                {t('nav.products')}
              </NavLink>

              {isAuthenticated ? (
                <>
                  <NavLink
                    to={dashboardPath}
                    className={({ isActive }) =>
                      [
                        'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                      ].join(' ')
                    }
                  >
                    {t('nav.dashboard')}
                  </NavLink>
                  <LogoutButton className="w-full rounded-lg border border-gray-200 px-3 py-2 text-start text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" />
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      [
                        'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                      ].join(' ')
                    }
                  >
                    {t('nav.login')}
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="rounded-lg bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    {t('nav.register')}
                  </NavLink>
                </>
              )}
            </nav>
          </div>
        ) : null}
      </header>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {t('app.name')}. All rights reserved.
        </p>
      </footer>

      {/* Suppress unused var warning for user — will be used in Phase 3 */}
      {user && null}
    </div>
  );
}
