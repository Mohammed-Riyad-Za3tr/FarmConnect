import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { RequireRole } from '../route-guards';
import { UserRole } from '@farmconnect/shared';

const BuyerDashboardPage = lazy(() =>
  import('@/features/analytics/pages/BuyerDashboardPage').then((m) => ({
    default: m.BuyerDashboardPage,
  })),
);
const BuyerProfilePage = lazy(() =>
  import('@/features/profile/pages/BuyerProfilePage').then((m) => ({
    default: m.BuyerProfilePage,
  })),
);
const CartPage = lazy(() =>
  import('@/features/cart/pages/CartPage').then((m) => ({
    default: m.CartPage,
  })),
);
const CheckoutPage = lazy(() =>
  import('@/features/orders/pages/CheckoutPage').then((m) => ({
    default: m.CheckoutPage,
  })),
);
const BuyerOrdersPage = lazy(() =>
  import('@/features/orders/pages/BuyerOrdersPage').then((m) => ({
    default: m.BuyerOrdersPage,
  })),
);
const BuyerOrderDetailPage = lazy(() =>
  import('@/features/orders/pages/BuyerOrderDetailPage').then((m) => ({
    default: m.BuyerOrderDetailPage,
  })),
);
const BuyerFavoritesPage = lazy(() =>
  import('@/features/favorites/pages/BuyerFavoritesPage').then((m) => ({
    default: m.BuyerFavoritesPage,
  })),
);

export const buyerRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: (
      <RequireRole roles={[UserRole.BUYER]}>
        <DashboardLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <BuyerDashboardPage /> },
      { path: 'profile', element: <BuyerProfilePage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'favorites', element: <BuyerFavoritesPage /> },
      { path: 'orders', element: <BuyerOrdersPage /> },
      { path: 'orders/:orderId', element: <BuyerOrderDetailPage /> },
    ],
  },
];
