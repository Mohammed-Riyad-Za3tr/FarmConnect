import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle2, Circle, ShieldCheck, XCircle } from 'lucide-react';

import { useAuth, roleHomePath } from '@/app/providers/AuthProvider';
import {
  ALGERIA_WILAYAS,
  formatWilayaLabel,
  normalizeCommuneValue,
  resolveWilaya,
  toWilayaStorageValue,
} from '@/shared/constants/algeria-locations';
import { getApiErrorMessage } from '@/shared/utils/api-error';
import { registerApi } from '../api/auth.api';

type Role = 'BUYER' | 'PRODUCER';

interface FormState {
  email: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: Role;
  businessName: string;
  wilaya: string;
  commune: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;
type FieldStatus = 'neutral' | 'valid' | 'invalid';

const INITIAL: FormState = {
  email: '',
  birthDate: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  role: 'BUYER',
  businessName: '',
  wilaya: '',
  commune: '',
};

const LETTERS_REGEX = /^[\p{L}\s'-]+$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BASE_SIGNUP_FIELDS: Array<keyof FormState> = ['fullName', 'email', 'birthDate', 'password', 'confirmPassword'];
const PRODUCER_SIGNUP_FIELDS: Array<keyof FormState> = ['businessName', 'wilaya', 'commune'];

function getAgeFromBirthDate(rawValue: string): number | null {
  const birth = new Date(rawValue);
  if (Number.isNaN(birth.getTime()) || birth > new Date()) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

function validateField(
  field: keyof FormState,
  state: FormState,
  t: TFunction<'translation'>,
): string | undefined {
  if (field === 'fullName') {
    if (!state.fullName.trim()) return t('auth.fullNameRequired');
    if (!LETTERS_REGEX.test(state.fullName.trim())) return t('auth.fullNameLettersOnly');
    return undefined;
  }

  if (field === 'email') {
    if (!state.email.trim()) return t('auth.emailRequired');
    if (!EMAIL_REGEX.test(state.email.trim())) return t('auth.emailInvalid');
    return undefined;
  }

  if (field === 'birthDate') {
    if (!state.birthDate.trim()) return t('auth.birthDateRequired');

    const birth = new Date(state.birthDate);
    if (Number.isNaN(birth.getTime())) return t('auth.birthDateInvalid');
    if (birth > new Date()) return t('auth.birthDateFuture');

    const age = getAgeFromBirthDate(state.birthDate);
    if (age === null) return t('auth.birthDateInvalid');
    if (age < 18) return t('auth.birthDateMin18');

    return undefined;
  }

  if (field === 'password') {
    if (!state.password) return t('auth.passwordRequired');
    if (state.password.length < 8) return t('auth.passwordMinLength');
    if (!/[A-Z]/.test(state.password)) return t('auth.passwordUppercase');
    if (!/[0-9]/.test(state.password)) return t('auth.passwordNumber');
    if (!/[^A-Za-z0-9]/.test(state.password)) return t('auth.passwordSpecial');
    return undefined;
  }

  if (field === 'confirmPassword') {
    if (state.password && state.confirmPassword !== state.password) return t('auth.passwordMismatch');
    return undefined;
  }

  if (field === 'businessName') {
    if (state.role !== 'PRODUCER') return undefined;
    if (!state.businessName.trim()) return t('auth.businessNameRequired');
    return undefined;
  }

  if (field === 'wilaya') {
    if (state.role !== 'PRODUCER') return undefined;
    if (!state.wilaya.trim()) return t('auth.wilayaRequired');
    return undefined;
  }

  if (field === 'commune') {
    if (state.role !== 'PRODUCER') return undefined;
    if (!state.commune.trim()) return t('auth.communeRequired');
  }

  return undefined;
}

function buildAllFieldErrors(state: FormState, t: TFunction<'translation'>): FieldErrors {
  const relevantFields = state.role === 'PRODUCER' ? [...BASE_SIGNUP_FIELDS, ...PRODUCER_SIGNUP_FIELDS] : BASE_SIGNUP_FIELDS;

  const errors: FieldErrors = {};
  relevantFields.forEach((field) => {
    const message = validateField(field, state, t);
    if (message) {
      errors[field] = message;
    }
  });

  return errors;
}

function buildTouchedFieldErrors(
  state: FormState,
  touched: Partial<Record<keyof FormState, boolean>>,
  t: TFunction<'translation'>,
): FieldErrors {
  const allErrors = buildAllFieldErrors(state, t);
  const visibleErrors: FieldErrors = {};

  Object.entries(allErrors).forEach(([field, message]) => {
    const typedField = field as keyof FormState;
    if (touched[typedField]) {
      visibleErrors[typedField] = message;
    }
  });

  return visibleErrors;
}

function buildTouchedStateForSubmit(role: Role): Partial<Record<keyof FormState, boolean>> {
  const fields = role === 'PRODUCER' ? [...BASE_SIGNUP_FIELDS, ...PRODUCER_SIGNUP_FIELDS] : BASE_SIGNUP_FIELDS;
  const touched: Partial<Record<keyof FormState, boolean>> = {};
  fields.forEach((field) => {
    touched[field] = true;
  });
  return touched;
}

function parseApiFieldErrors(error: unknown): FieldErrors {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('response' in error) ||
    typeof (error as { response?: { data?: { details?: unknown } } }).response?.data?.details === 'undefined'
  ) {
    return {};
  }

  const details = (error as { response?: { data?: { details?: unknown } } }).response?.data?.details;
  if (!Array.isArray(details)) return {};

  const allowedFields: Array<keyof FormState> = [
    'email',
    'birthDate',
    'password',
    'confirmPassword',
    'fullName',
    'businessName',
    'wilaya',
    'commune',
  ];

  const parsed: FieldErrors = {};
  for (const detail of details) {
    if (!detail || typeof detail !== 'object') continue;
    const path = (detail as { path?: unknown }).path;
    const message = (detail as { message?: unknown }).message;
    if (typeof path !== 'string' || typeof message !== 'string') continue;
    const key = allowedFields.find((field) => field === path);
    if (!key || parsed[key]) continue;
    parsed[key] = message;
  }

  return parsed;
}

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

  function syncFormValidation(nextForm: FormState, nextTouched: Partial<Record<keyof FormState, boolean>>) {
    setForm(nextForm);
    setTouched(nextTouched);
    setFieldErrors(buildTouchedFieldErrors(nextForm, nextTouched, t));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const touchedForSubmit = buildTouchedStateForSubmit(form.role);
    const errors = buildAllFieldErrors(form, t);
    setTouched(touchedForSubmit);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload =
        form.role === 'PRODUCER'
          ? {
              email: form.email.trim(),
              birthDate: form.birthDate,
              password: form.password,
              fullName: form.fullName.trim(),
              role: form.role,
              businessName: form.businessName.trim(),
              wilaya: toWilayaStorageValue(form.wilaya),
              commune: normalizeCommuneValue(form.wilaya, form.commune),
            }
          : {
              email: form.email.trim(),
              birthDate: form.birthDate,
              password: form.password,
              fullName: form.fullName.trim(),
              role: form.role,
            };

      const result = await registerApi(payload);
      setAuth(result.user, result.accessToken);
      toast.success(t('auth.accountCreated'));
      navigate(roleHomePath(result.user.role), { replace: true });
    } catch (err: unknown) {
      const apiFieldErrors = parseApiFieldErrors(err);
      if (Object.keys(apiFieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...apiFieldErrors }));
        setTouched((prev) => {
          const next = { ...prev };
          (Object.keys(apiFieldErrors) as Array<keyof FormState>).forEach((field) => {
            next[field] = true;
          });
          return next;
        });
        const firstFieldMessage = Object.values(apiFieldErrors).find((value) => typeof value === 'string');
        if (firstFieldMessage) {
          toast.error(firstFieldMessage);
          return;
        }
      }
      const message = getApiErrorMessage(err, t('auth.registerFailed'));
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isProducer = form.role === 'PRODUCER';
  const selectedWilaya = resolveWilaya(form.wilaya);
  const communeOptions = useMemo(() => selectedWilaya?.communes ?? [], [selectedWilaya]);
  const passwordChecks = [
    { id: 'length', valid: form.password.length >= 8, label: t('auth.passwordMinLength') },
    { id: 'uppercase', valid: /[A-Z]/.test(form.password), label: t('auth.passwordUppercase') },
    { id: 'number', valid: /[0-9]/.test(form.password), label: t('auth.passwordNumber') },
    { id: 'special', valid: /[^A-Za-z0-9]/.test(form.password), label: t('auth.passwordSpecial') },
  ];

  const failedPasswordChecks = passwordChecks.filter((rule) => !rule.valid);

  function resolveFieldStatus(field: keyof FormState): FieldStatus {
    const isTouched = !!touched[field];
    if (!isTouched) return 'neutral';

    if (field === 'confirmPassword' && form.confirmPassword.length === 0) {
      return 'invalid';
    }

    return validateField(field, form, t) ? 'invalid' : 'valid';
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.register')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            {t('auth.loginHere')}
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          {(['BUYER', 'PRODUCER'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                const nextForm: FormState = { ...form, role: r };
                const nextTouched = { ...touched };

                if (r === 'BUYER') {
                  delete nextTouched.businessName;
                  delete nextTouched.wilaya;
                  delete nextTouched.commune;
                }

                syncFormValidation(nextForm, nextTouched);
              }}
              className={[
                'rounded-md py-1.5 text-sm font-medium transition-colors',
                form.role === r
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400',
              ].join(' ')}
            >
              {r === 'BUYER' ? t('auth.roleBuyer') : t('auth.roleProducer')}
            </button>
          ))}
        </div>

        <FormField
          label={t('auth.fullName')}
          id="fullName"
          error={fieldErrors.fullName}
          status={resolveFieldStatus('fullName')}
          validLabel={t('auth.fieldValid')}
          invalidLabel={t('auth.fieldInvalid')}
        >
          <input
            id="fullName" type="text" autoComplete="name"
            value={form.fullName}
            onChange={(e) => {
              const nextForm: FormState = { ...form, fullName: e.target.value };
              const nextTouched = { ...touched, fullName: true };
              syncFormValidation(nextForm, nextTouched);
            }}
            disabled={isSubmitting}
            className={inputClass(!!fieldErrors.fullName)}
          />
        </FormField>

        <FormField
          label={t('auth.email')}
          id="email"
          error={fieldErrors.email}
          status={resolveFieldStatus('email')}
          validLabel={t('auth.fieldValid')}
          invalidLabel={t('auth.fieldInvalid')}
        >
          <input
            id="email" type="email" autoComplete="email"
            value={form.email}
            onChange={(e) => {
              const nextForm: FormState = { ...form, email: e.target.value };
              const nextTouched = { ...touched, email: true };
              syncFormValidation(nextForm, nextTouched);
            }}
            disabled={isSubmitting}
            className={inputClass(!!fieldErrors.email)}
          />
        </FormField>

        <FormField
          label={t('auth.birthDate')}
          id="birthDate"
          error={fieldErrors.birthDate}
          status={resolveFieldStatus('birthDate')}
          validLabel={t('auth.fieldValid')}
          invalidLabel={t('auth.fieldInvalid')}
        >
          <input
            id="birthDate"
            type="date"
            value={form.birthDate}
            onChange={(e) => {
              const nextForm: FormState = { ...form, birthDate: e.target.value };
              const nextTouched = { ...touched, birthDate: true };
              syncFormValidation(nextForm, nextTouched);
            }}
            disabled={isSubmitting}
            className={inputClass(!!fieldErrors.birthDate)}
          />
        </FormField>

        <FormField
          label={t('auth.password')}
          id="password"
          error={fieldErrors.password}
          status={resolveFieldStatus('password')}
          validLabel={t('auth.fieldValid')}
          invalidLabel={t('auth.fieldInvalid')}
        >
          <input
            id="password" type="password" autoComplete="new-password"
            value={form.password}
            onChange={(e) => {
              const nextForm: FormState = { ...form, password: e.target.value };
              const nextTouched = { ...touched, password: true };
              syncFormValidation(nextForm, nextTouched);
            }}
            disabled={isSubmitting}
            className={inputClass(!!fieldErrors.password)}
          />
          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/80">
            <div className="flex gap-1.5">
              {passwordChecks.map((rule) => (
                <span
                  key={rule.id}
                  className={[
                    'h-1.5 flex-1 rounded-full transition-colors',
                    rule.valid ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-red-400 dark:bg-red-500',
                  ].join(' ')}
                />
              ))}
            </div>

            {form.password.length > 0 && failedPasswordChecks.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs">
                {failedPasswordChecks.map((rule) => (
                  <li key={rule.id} className="flex items-center gap-1.5 text-red-600 dark:text-red-300">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {form.password.length > 0 && failedPasswordChecks.length === 0 ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('auth.passwordStrong')}
              </p>
            ) : null}
          </div>
        </FormField>

        <FormField
          label={t('auth.confirmPassword')}
          id="confirmPassword"
          error={fieldErrors.confirmPassword}
          status={resolveFieldStatus('confirmPassword')}
          validLabel={t('auth.fieldValid')}
          invalidLabel={t('auth.fieldInvalid')}
        >
          <input
            id="confirmPassword" type="password" autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => {
              const nextForm: FormState = { ...form, confirmPassword: e.target.value };
              const nextTouched = { ...touched, confirmPassword: true };
              syncFormValidation(nextForm, nextTouched);
            }}
            disabled={isSubmitting}
            className={inputClass(!!fieldErrors.confirmPassword)}
          />
        </FormField>

        {isProducer ? (
          <>
            <FormField
              label={t('auth.businessName')}
              id="businessName"
              error={fieldErrors.businessName}
              status={resolveFieldStatus('businessName')}
              validLabel={t('auth.fieldValid')}
              invalidLabel={t('auth.fieldInvalid')}
            >
              <input
                id="businessName" type="text"
                value={form.businessName}
                onChange={(e) => {
                  const nextForm: FormState = { ...form, businessName: e.target.value };
                  const nextTouched = { ...touched, businessName: true };
                  syncFormValidation(nextForm, nextTouched);
                }}
                disabled={isSubmitting}
                className={inputClass(!!fieldErrors.businessName)}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                label={t('auth.wilaya')}
                id="wilaya"
                error={fieldErrors.wilaya}
                status={resolveFieldStatus('wilaya')}
                validLabel={t('auth.fieldValid')}
                invalidLabel={t('auth.fieldInvalid')}
              >
                <select
                  id="wilaya"
                  value={form.wilaya}
                  onChange={(e) => {
                    const nextForm: FormState = { ...form, wilaya: e.target.value, commune: '' };
                    const nextTouched = { ...touched, wilaya: true };
                    syncFormValidation(nextForm, nextTouched);
                  }}
                  disabled={isSubmitting}
                  className={inputClass(!!fieldErrors.wilaya)}
                >
                  <option value="">{t('locations.selectWilaya')}</option>
                  {ALGERIA_WILAYAS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {formatWilayaLabel(option, i18n.resolvedLanguage ?? i18n.language)}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label={t('auth.commune')}
                id="commune"
                error={fieldErrors.commune}
                status={resolveFieldStatus('commune')}
                validLabel={t('auth.fieldValid')}
                invalidLabel={t('auth.fieldInvalid')}
              >
                <input
                  id="commune"
                  value={form.commune}
                  onChange={(e) => {
                    const nextForm: FormState = { ...form, commune: e.target.value };
                    const nextTouched = { ...touched, commune: true };
                    syncFormValidation(nextForm, nextTouched);
                  }}
                  list={selectedWilaya ? 'register-commune-options' : undefined}
                  placeholder={t('locations.communePlaceholder')}
                  disabled={isSubmitting || !selectedWilaya}
                  className={inputClass(!!fieldErrors.commune)}
                />
                {selectedWilaya ? (
                  <datalist id="register-commune-options">
                    {communeOptions.map((option) => (
                      <option key={option.nameEn} value={option.nameEn} label={option.nameAr} />
                    ))}
                  </datalist>
                ) : null}
              </FormField>
            </div>
          </>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
        >
          {isSubmitting ? t('auth.registering') : t('auth.register')}
        </button>
      </form>
    </>
  );
}

function FormField({
  label, id, error, status, validLabel, invalidLabel, children,
}: {
  label: string;
  id: string;
  error?: string;
  status: FieldStatus;
  validLabel: string;
  invalidLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center justify-between gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <span>{label}</span>
        <FieldStatusIcon status={status} validLabel={validLabel} invalidLabel={invalidLabel} />
      </label>
      {children}
      {error ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FieldStatusIcon({
  status,
  validLabel,
  invalidLabel,
}: {
  status: FieldStatus;
  validLabel: string;
  invalidLabel: string;
}) {
  if (status === 'valid') {
    return <CheckCircle2 aria-label={validLabel} className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
  }

  if (status === 'invalid') {
    return <XCircle aria-label={invalidLabel} className="h-4 w-4 text-red-500 dark:text-red-400" />;
  }

  return <Circle className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />;
}

function inputClass(hasError: boolean) {
  return [
    'mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors',
    'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
    'placeholder-gray-400 dark:placeholder-gray-500',
    'focus:outline-none focus:ring-2 focus:ring-primary-500',
    hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
      : 'border-gray-300 dark:border-gray-700 focus:border-primary-500',
  ].join(' ');
}
