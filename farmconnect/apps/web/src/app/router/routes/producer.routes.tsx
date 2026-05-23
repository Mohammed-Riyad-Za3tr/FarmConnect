import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { RequireRole } from '../route-guards';
import { UserRole } from '@farmconnect/shared';

const ProducerDashboardPage = lazy(() =>
  import('@/features/analytics/pages/ProducerDashboardPage').then((m) => ({
    default: m.ProducerDashboardPage,
  })),
);
const ProducerProfilePage = lazy(() =>
  import('@/features/profile/pages/ProducerProfilePage').then((m) => ({
    default: m.ProducerProfilePage,
  })),
);
const ProducerOnboardingPage = lazy(() =>
  import('@/features/profile/pages/ProducerOnboardingPage').then((m) => ({
    default: m.ProducerOnboardingPage,
  })),
);
const ProducerVerificationPage = lazy(() =>
  import('@/features/profile/pages/ProducerVerificationPage').then((m) => ({
    default: m.ProducerVerificationPage,
  })),
);
const MyProductsPage = lazy(() =>
  import('@/features/products/pages/MyProductsPage').then((m) => ({
    default: m.MyProductsPage,
  })),
);
const AddProductPage = lazy(() =>
  import('@/features/products/pages/AddProductPage').then((m) => ({
    default: m.AddProductPage,
  })),
);
const EditProductPage = lazy(() =>
  import('@/features/products/pages/EditProductPage').then((m) => ({
    default: m.EditProductPage,
  })),
);
const ProducerOrdersPage = lazy(() =>
  import('@/features/orders/pages/ProducerOrdersPage').then((m) => ({
    default: m.ProducerOrdersPage,
  })),
);
const ProducerOrderDetailPage = lazy(() =>
  import('@/features/orders/pages/ProducerOrderDetailPage').then((m) => ({
    default: m.ProducerOrderDetailPage,
  })),
);
const ProducerCouponsPage = lazy(() =>
  import('@/features/coupons/pages/ProducerCouponsPage').then((m) => ({
    default: m.ProducerCouponsPage,
  })),
);

export const producerRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: (
      <RequireRole roles={[UserRole.PRODUCER]}>
        <DashboardLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <ProducerDashboardPage /> },
      { path: 'profile', element: <ProducerProfilePage /> },
      { path: 'onboarding', element: <ProducerOnboardingPage /> },
      { path: 'verification', element: <ProducerVerificationPage /> },
      { path: 'products', element: <MyProductsPage /> },
      { path: 'products/new', element: <AddProductPage /> },
      { path: 'products/:productId/edit', element: <EditProductPage /> },
      { path: 'coupons', element: <ProducerCouponsPage /> },
      { path: 'orders', element: <ProducerOrdersPage /> },
      { path: 'orders/:orderId', element: <ProducerOrderDetailPage /> },
    ],
  },
];
