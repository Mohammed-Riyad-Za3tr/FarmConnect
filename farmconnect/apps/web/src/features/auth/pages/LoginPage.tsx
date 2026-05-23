import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';

import { useAuth, roleHomePath } from '@/app/providers/AuthProvider';
import { getApiErrorMessage } from '@/shared/utils/api-error';
import { loginApi } from '../api/auth.api';

export function LoginPage() {
  const { t } = useTranslation();
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const from = (location.state as { from?: Location })?.from?.pathname ?? null;

  function validate() {
    const errors: { email?: string; password?: string } = {};
    const emailTrimmed = email.trim();
    if (!emailTrimmed) errors.email = t('auth.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(emailTrimmed)) errors.email = t('auth.emailInvalid');
    if (!password) errors.password = t('auth.passwordRequired');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await loginApi({ email: email.trim(), password });
      setAuth(result.user, result.accessToken);
      toast.success(t('auth.loggedInSuccessfully'));

      // Redirect: back to protected page they came from, or role home
      const destination = from ?? roleHomePath(result.user.role);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const status =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { status?: number } }).response?.status === 'number'
          ? (err as { response: { status: number } }).response.status
          : undefined;

      const message = status === 401
        ? t('auth.loginFailed')
        : getApiErrorMessage(err, t('auth.loginServerUnavailable'));
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.login')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
            {t('auth.registerHere')}
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-400">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            autoFocus
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            disabled={isSubmitting}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            className={inputClass(!!fieldErrors.email)}
          />
          {fieldErrors.email && (
            <p id="login-email-error" className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              {t('auth.password')}
            </label>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            disabled={isSubmitting}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
            className={inputClass(!!fieldErrors.password)}
          />
          {fieldErrors.password && (
            <p id="login-password-error" className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
        >
          <LogIn className="h-4 w-4" />
          {isSubmitting ? t('auth.loggingIn') : t('auth.login')}
        </button>
      </form>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inputClass(hasError: boolean) {
  return [
    'mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors',
    'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 dark:[color-scheme:dark]',
    'placeholder-gray-400 dark:placeholder-gray-500',
    'focus:outline-none focus:ring-2 focus:ring-primary-500',
    hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
      : 'border-gray-300 dark:border-gray-700 focus:border-primary-500',
  ].join(' ');
}

