import type { UserRole } from '@farmconnect/shared';

import { apiClient } from '@/shared/api/client';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  email: string;
  birthDate: string;
  password: string;
  fullName: string;
  role: 'BUYER' | 'PRODUCER';
  businessName?: string;
  wilaya?: string;
  commune?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: string;
  avatarUrl?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<{ success: true; data: AuthResponse }>(
    '/api/auth/register',
    payload,
  );
  return data.data;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<{ success: true; data: AuthResponse }>(
    '/api/auth/login',
    payload,
  );
  return data.data;
}

export async function refreshApi(): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<{ success: true; data: AuthResponse }>(
      '/api/auth/refresh',
    );
    return data.data;
  } catch {
    const { data } = await apiClient.post<{ success: true; data: AuthResponse }>(
      '/api/v1/auth/refresh',
    );
    return data.data;
  }
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/api/auth/logout');
}

export async function getMeApi(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ success: true; data: { user: AuthUser } }>(
    '/api/auth/me',
  );
  return data.data.user;
}
