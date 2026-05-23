import axios, { type InternalAxiosRequestConfig } from 'axios';

const envBaseUrl = import.meta.env.VITE_API_URL;
const fallbackBaseUrl = import.meta.env.DEV
  ? ''
  : typeof window !== 'undefined'
    ? window.location.origin
    : '';
const baseUrl = (envBaseUrl ?? fallbackBaseUrl).replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: baseUrl,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // needed for refresh token httpOnly cookie
  timeout: 15_000,
});

// ── Access token injection ────────────────────────────────────────────────────
// The token is stored in a module-level variable that AuthProvider writes to.
// This avoids prop-drilling and React context inside Axios interceptors.

let _accessToken: string | null = null;
let _locale: string | null = null;

export function setClientToken(token: string | null) {
  _accessToken = token;
}

export function setClientLocale(locale: string | null) {
  _locale = locale;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers = config.headers ?? {};

  if (_accessToken) {
    config.headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  if (_locale) {
    config.headers['Accept-Language'] = _locale;
    config.headers['X-Locale'] = _locale;
  }

  return config;
});

// ── Silent token refresh on 401 ───────────────────────────────────────────────
// On a 401, attempt one silent refresh via the httpOnly cookie, then retry.
// If the refresh also fails (e.g. cookie expired), reject and let the caller handle it.

let _refreshPromise: Promise<string> | null = null;

export function setRefreshCallback(fn: () => Promise<string>) {
  _refreshCallback = fn;
}
let _refreshCallback: (() => Promise<string>) | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !original._retry &&
      _refreshCallback &&
      // Don't retry the refresh or login endpoints themselves
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      original._retry = true;

      try {
        // Deduplicate concurrent 401s — only one refresh in flight at a time
        if (!_refreshPromise) {
          _refreshPromise = _refreshCallback().finally(() => {
            _refreshPromise = null;
          });
        }
        const newToken = await _refreshPromise;
        original.headers = original.headers ?? {};
        original.headers['Authorization'] = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        // Refresh failed — caller will receive the original 401
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
