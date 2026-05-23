import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { AdminLayout } from '@/app/layouts/AdminLayout';
import { RequireRole } from '../route-guards';
import { UserRole } from '@farmconnect/shared';
import { AppErrorPage } from '@/shared/pages/AppErrorPage';

const AdminDashboardPage = lazy(() =>
  import('@/features/admin/pages/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const AdminVerificationReviewPage = lazy(() =>
  import('@/features/profile/pages/AdminVerificationReviewPage').then((m) => ({
    default: m.AdminVerificationReviewPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import('@/features/admin/pages/AdminUsersPage').then((m) => ({
    default: m.AdminUsersPage,
  })),
);
const AdminProductsPage = lazy(() =>
  import('@/features/admin/pages/AdminProductsPage').then((m) => ({
    default: m.AdminProductsPage,
  })),
);
const AdminOrdersPage = lazy(() =>
  import('@/features/admin/pages/AdminOrdersPage').then((m) => ({
    default: m.AdminOrdersPage,
  })),
);
const AdminAuditLogsPage = lazy(() =>
  import('@/features/admin/pages/AdminAuditLogsPage').then((m) => ({
    default: m.AdminAuditLogsPage,
  })),
);
const AdminReportsPage = lazy(() =>
  import('@/features/reports/pages/AdminReportsPage').then((m) => ({
    default: m.AdminReportsPage,
  })),
);

export const adminRoutes: RouteObject[] = [
  {
    path: 'admin',
    element: (
      <RequireRole roles={[UserRole.ADMIN]}>
        <AdminLayout />
      </RequireRole>
    ),
    errorElement: <AppErrorPage />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'producer-verifications', element: <AdminVerificationReviewPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'products', element: <AdminProductsPage /> },
      { path: 'orders', element: <AdminOrdersPage /> },
      { path: 'reports', element: <AdminReportsPage /> },
      { path: 'audit-logs', element: <AdminAuditLogsPage /> },
    ],
  },
];
