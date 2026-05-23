import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import type { UserRole } from '@farmconnect/shared';

import { refreshApi, logoutApi, type AuthUser as ApiAuthUser } from '@/features/auth/api/auth.api';
import { setClientToken, setRefreshCallback } from '@/shared/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuthUser = ApiAuthUser;

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => Promise<void>;
  /** @deprecated Use logout() — kept for backward compat with MainLayout clearAuth calls */
  clearAuth: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_STORAGE_KEY = 'farmconnect_auth_state_v1';

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // true while we're attempting the initial silent refresh on mount
  const [isLoading, setIsLoading] = useState(true);
  const didInit = useRef(false);

  const persistAuth = useCallback((authUser: AuthUser, token: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: authUser,
        accessToken: token,
        savedAt: Date.now(),
      }),
    );
  }, []);

  const setAuth = useCallback((authUser: AuthUser, token: string) => {
    setUser(authUser);
    setAccessToken(token);
    setClientToken(token);
    persistAuth(authUser, token);
  }, [persistAuth]);

  const clearState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setClientToken(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Best-effort — clear local state regardless
    }
    clearState();
  }, [clearState]);

  // Register the refresh callback so the Axios interceptor can call it
  useEffect(() => {
    setRefreshCallback(async () => {
      const result = await refreshApi();
      setAuth(result.user, result.accessToken);
      return result.accessToken;
    });
  }, [setAuth]);

  // On mount: attempt silent refresh to restore session from httpOnly cookie
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    if (typeof window !== 'undefined') {
      const cached = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { user?: AuthUser; accessToken?: string };
          if (parsed.user && parsed.accessToken) {
            setUser(parsed.user);
            setAccessToken(parsed.accessToken);
            setClientToken(parsed.accessToken);
          }
        } catch {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    }

    refreshApi()
      .then((result) => {
        setAuth(result.user, result.accessToken);
      })
      .catch(() => {
        // If we had cached auth, keep it for this session and let interceptor handle 401+refresh later.
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [setAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        setAuth,
        logout,
        clearAuth: logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// ── Role helper ───────────────────────────────────────────────────────────────

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'PRODUCER':
    case 'BUYER':
    default:
      return '/dashboard';
  }
}

