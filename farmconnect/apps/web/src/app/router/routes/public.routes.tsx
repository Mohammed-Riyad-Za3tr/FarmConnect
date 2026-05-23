import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { MainLayout } from '@/app/layouts/MainLayout';
import { AuthLayout } from '@/app/layouts/AuthLayout';
import { AppErrorPage } from '@/shared/pages/AppErrorPage';
import { GuestOnly } from '../route-guards';

const HomePage = lazy(() =>
  import('@/features/products/pages/ProductListPage').then((m) => ({ default: m.HomePage })),
);
const ProductListPage = lazy(() =>
  import('@/features/products/pages/ProductListPage').then((m) => ({ default: m.ProductListPage })),
);
const ProductDetailsPage = lazy(() =>
  import('@/features/products/pages/ProductDetailsPage').then((m) => ({ default: m.ProductDetailsPage })),
);
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const NotFoundPage = lazy(() =>
  import('@/shared/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

export const publicRoutes: RouteObject[] = [
  {
    element: <MainLayout />,
    errorElement: <AppErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/:slug', element: <ProductDetailsPage /> },
    ],
  },
  {
    element: (
      <GuestOnly>
        <AuthLayout />
      </GuestOnly>
    ),
    errorElement: <AppErrorPage />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

