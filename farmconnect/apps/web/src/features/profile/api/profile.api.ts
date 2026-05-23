import type { BuyerBusinessType, VerificationStatus } from '@farmconnect/shared';

import { apiClient } from '@/shared/api/client';

export interface CurrentUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'BUYER' | 'PRODUCER' | 'ADMIN';
  status: string;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerProfile {
  id: string;
  userId: string;
  businessType: BuyerBusinessType | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProducerProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: string | null;
  bio: string | null;
  latitude: number | null;
  longitude: number | null;
  wilaya: string;
  commune: string;
  nif: string | null;
  nis: string | null;
  nifDocumentUrl: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  verifiedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProducerVerificationRequest {
  id: string;
  producerProfileId: string;
  status: VerificationStatus;
  notes: string | null;
  documents: string[];
  submittedAt: string;
  reviewedAt: string | null;
  reviewedById: string | null;
}

export interface ProducerVerificationStatusResponse {
  producerProfile: ProducerProfile;
  latestRequest: ProducerVerificationRequest | null;
}

export interface AdminVerificationRequest extends ProducerVerificationRequest {
  producerProfile: {
    id: string;
    businessName: string;
    wilaya: string;
    commune: string;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };
}

export interface AdminProducerVerificationProfile {
  id: string;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  verifiedById: string | null;
  businessName: string;
  wilaya: string;
  commune: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  latestRequest: ProducerVerificationRequest | null;
}

export interface UpdateCurrentUserPayload {
  fullName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
}

export interface UpsertProducerProfilePayload {
  businessName: string;
  businessType?: string | null;
  bio?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  wilaya: string;
  commune: string;
  nif?: string | null;
  nis?: string | null;
  nifDocumentUrl?: string | null;
}

export interface UpsertBuyerProfilePayload {
  businessType?: BuyerBusinessType | null;
}

export interface SubmitVerificationPayload {
  documents: string[];
  notes?: string;
}

export interface ReviewVerificationPayload {
  action: 'APPROVE' | 'REJECT';
  notes?: string;
}

export type VerificationReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export async function getCurrentUserProfileApi(): Promise<CurrentUserProfile> {
  const { data } = await apiClient.get<{ data: CurrentUserProfile }>('/api/profile/me');
  return data.data;
}

export async function updateCurrentUserProfileApi(
  payload: UpdateCurrentUserPayload,
): Promise<CurrentUserProfile> {
  const { data } = await apiClient.patch<{ data: CurrentUserProfile }>('/api/profile/me', payload);
  return data.data;
}

export async function getCurrentBuyerProfileApi(): Promise<BuyerProfile> {
  const { data } = await apiClient.get<{ data: BuyerProfile }>('/api/profile/me/buyer');
  return data.data;
}

export async function upsertCurrentBuyerProfileApi(payload: UpsertBuyerProfilePayload): Promise<BuyerProfile> {
  const { data } = await apiClient.put<{ data: BuyerProfile }>('/api/profile/me/buyer', payload);
  return data.data;
}

export async function deleteCurrentBuyerProfileApi(): Promise<void> {
  await apiClient.delete('/api/profile/me/buyer');
}

export async function getCurrentProducerProfileApi(): Promise<ProducerProfile> {
  const { data } = await apiClient.get<{ data: ProducerProfile }>('/api/profile/me/producer');
  return data.data;
}

export async function upsertCurrentProducerProfileApi(
  payload: UpsertProducerProfilePayload,
): Promise<ProducerProfile> {
  const { data } = await apiClient.put<{ data: ProducerProfile }>('/api/profile/me/producer', payload);
  return data.data;
}

export async function deleteCurrentProducerProfileApi(): Promise<void> {
  await apiClient.delete('/api/profile/me/producer');
}

export async function submitProducerVerificationRequestApi(
  payload: SubmitVerificationPayload,
): Promise<ProducerVerificationRequest> {
  const { data } = await apiClient.post<{ data: ProducerVerificationRequest }>(
    '/api/profile/me/producer/verification-requests',
    payload,
  );
  return data.data;
}

export async function getProducerVerificationStatusApi(): Promise<ProducerVerificationStatusResponse> {
  const { data } = await apiClient.get<{ data: ProducerVerificationStatusResponse }>(
    '/api/profile/me/producer/verification-status',
  );
  return data.data;
}

export async function listAdminProducerVerificationRequestsApi(status?: VerificationReviewStatus) {
  const { data } = await apiClient.get<{ data: AdminProducerVerificationProfile[] }>(
    '/api/profile/admin/producer-verification-requests',
    {
      params: status ? { status } : undefined,
    },
  );
  return data.data;
}

export async function reviewAdminProducerVerificationRequestApi(
  requestId: string,
  payload: ReviewVerificationPayload,
) {
  const { data } = await apiClient.patch('/api/profile/admin/producer-verification-requests/' + requestId + '/review', payload);
  return data.data;
}
