import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

import { UserRole } from '@farmconnect/shared';

import { DashboardLayout } from '@/app/layouts/DashboardLayout';
import { useAuth } from '@/app/providers/AuthProvider';
import { AppErrorPage } from '@/shared/pages/AppErrorPage';

import { RequireRole } from '../route-guards';

const BuyerDashboardPage = lazy(() =>
  import('@/features/analytics/pages/BuyerDashboardPage').then((m) => ({
    default: m.BuyerDashboardPage,
  })),
);
const ProducerDashboardPage = lazy(() =>
  import('@/features/analytics/pages/ProducerDashboardPage').then((m) => ({
    default: m.ProducerDashboardPage,
  })),
);

const BuyerProfilePage = lazy(() =>
  import('@/features/profile/pages/BuyerProfilePage').then((m) => ({
    default: m.BuyerProfilePage,
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
const ProducerAiInsightsPage = lazy(() =>
  import('@/features/ai-insights/pages/ProducerAiInsightsPage').then((m) => ({
    default: m.ProducerAiInsightsPage,
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
const ProducerCouponsPage = lazy(() =>
  import('@/features/coupons/pages/ProducerCouponsPage').then((m) => ({
    default: m.ProducerCouponsPage,
  })),
);
const BuyerFavoritesPage = lazy(() =>
  import('@/features/favorites/pages/BuyerFavoritesPage').then((m) => ({
    default: m.BuyerFavoritesPage,
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
const OrderTrackingPage = lazy(() =>
  import('@/features/orders/pages/OrderTrackingPage').then((m) => ({
    default: m.OrderTrackingPage,
  })),
);
const NotificationsPage = lazy(() =>
  import('@/features/notifications/pages/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
);

function RoleSwitch({
  buyer,
  producer,
}: {
  buyer: React.ReactElement;
  producer: React.ReactElement;
}) {
  const { user } = useAuth();

  if (user?.role === UserRole.BUYER) {
    return buyer;
  }

  if (user?.role === UserRole.PRODUCER) {
    return producer;
  }

  return <Navigate to="/" replace />;
}

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: (
      <RequireRole roles={[UserRole.BUYER, UserRole.PRODUCER]}>
        <DashboardLayout />
      </RequireRole>
    ),
    errorElement: <AppErrorPage />,
    children: [
      {
        index: true,
        element: (
          <RoleSwitch
            buyer={<BuyerDashboardPage />}
            producer={<ProducerDashboardPage />}
          />
        ),
      },
      {
        path: 'profile',
        element: (
          <RoleSwitch
            buyer={<BuyerProfilePage />}
            producer={<ProducerProfilePage />}
          />
        ),
      },
      {
        path: 'orders',
        element: (
          <RoleSwitch
            buyer={<BuyerOrdersPage />}
            producer={<ProducerOrdersPage />}
          />
        ),
      },
      {
        path: 'orders/:orderId',
        element: (
          <RoleSwitch
            buyer={<BuyerOrderDetailPage />}
            producer={<ProducerOrderDetailPage />}
          />
        ),
      },
      {
        path: 'orders/:orderId/tracking',
        element: <OrderTrackingPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },

      {
        path: 'cart',
        element: (
          <RequireRole roles={[UserRole.BUYER]}>
            <CartPage />
          </RequireRole>
        ),
      },
      {
        path: 'checkout',
        element: (
          <RequireRole roles={[UserRole.BUYER]}>
            <CheckoutPage />
          </RequireRole>
        ),
      },
      {
        path: 'favorites',
        element: (
          <RequireRole roles={[UserRole.BUYER]}>
            <BuyerFavoritesPage />
          </RequireRole>
        ),
      },

      {
        path: 'onboarding',
        element: (
          <RequireRole roles={[UserRole.PRODUCER]}>
            <ProducerOnboardingPage />
          </RequireRole>
        ),
      },
      {
        path: 'verification',
        element: (
          <RequireRole roles={[UserRole.PRODUCER]}>
            <ProducerVerificationPage />
          </RequireRole>
        ),
      },
      {
        path: 'ai-insights',
        element: (
          <RequireRole roles={[UserRole.PRODUCER]}>
            <ProducerAiInsightsPage />
          </RequireRole>
        ),
      },
      {
        path: 'products',
        element: (
          <RequireRole roles={[UserRole.PRODUCER]}>
            <MyProductsPage />
          </RequireRole>
        ),
      },
      {
        path: 'products/new',
        element: (
          <RequireRole roles={[UserRole.PRODUCER]}>
            <AddProductPage />
          </RequireRole>
        ),
      },
      {
        path: 'products/:productId/edit',
        element: (
          <RequireRole roles={[UserRole.PRODUCER]}>
            <EditProductPage />
          </RequireRole>
        ),
      },
      {
        path: 'coupons',
        element: (
          <RequireRole roles={[UserRole.PRODUCER]}>
            <ProducerCouponsPage />
          </RequireRole>
        ),
      },
    ],
  },
];
