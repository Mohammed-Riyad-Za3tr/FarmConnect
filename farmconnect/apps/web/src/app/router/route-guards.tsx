import { Navigate, useLocation } from 'react-router-dom';

import { Spinner } from '@farmconnect/ui';
import type { UserRole } from '@farmconnect/shared';

import { useAuth, roleHomePath } from '../providers/AuthProvider';

// ── RequireAuth ───────────────────────────────────────────────────────────────

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function RequireAuth({ children, redirectTo = '/login' }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// ── RequireRole ───────────────────────────────────────────────────────────────

interface RequireRoleProps {
  roles: UserRole[];
  children: React.ReactNode;
  redirectTo?: string;
}

export function RequireRole({ roles, children, redirectTo = '/' }: RequireRoleProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user || !roles.includes(user.role as UserRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

// ── GuestOnly ─────────────────────────────────────────────────────────────────
// Redirects authenticated users away from login/register to their home page.

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={roleHomePath(user.role as UserRole)} replace />;
  }

  return <>{children}</>;
}

