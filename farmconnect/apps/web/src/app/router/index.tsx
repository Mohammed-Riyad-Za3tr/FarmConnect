import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { Spinner } from '@farmconnect/ui';

import { publicRoutes } from './routes/public.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { adminRoutes } from './routes/admin.routes';

const router = createBrowserRouter([
  ...publicRoutes,
  ...dashboardRoutes,
  ...adminRoutes,
]);

export function AppRouter() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  );
}
