import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteCurrentBuyerProfileApi,
  deleteCurrentProducerProfileApi,
  getCurrentBuyerProfileApi,
  getCurrentProducerProfileApi,
  getCurrentUserProfileApi,
  getProducerVerificationStatusApi,
  listAdminProducerVerificationRequestsApi,
  reviewAdminProducerVerificationRequestApi,
  submitProducerVerificationRequestApi,
  updateCurrentUserProfileApi,
  upsertCurrentBuyerProfileApi,
  upsertCurrentProducerProfileApi,
  type ReviewVerificationPayload,
  type SubmitVerificationPayload,
  type UpdateCurrentUserPayload,
  type UpsertBuyerProfilePayload,
  type UpsertProducerProfilePayload,
  type VerificationReviewStatus,
} from '../api/profile.api';

export const profileKeys = {
  user: ['profile', 'user'] as const,
  buyer: ['profile', 'buyer'] as const,
  producer: ['profile', 'producer'] as const,
  verificationStatus: ['profile', 'producer', 'verification-status'] as const,
  adminVerification: (status?: VerificationReviewStatus) =>
    ['profile', 'admin', 'verification-requests', status ?? 'ALL'] as const,
};

export function useCurrentUserProfile() {
  return useQuery({
    queryKey: profileKeys.user,
    queryFn: getCurrentUserProfileApi,
  });
}

export function useUpdateCurrentUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCurrentUserPayload) => updateCurrentUserProfileApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.user });
    },
  });
}

export function useCurrentBuyerProfile() {
  return useQuery({
    queryKey: profileKeys.buyer,
    queryFn: getCurrentBuyerProfileApi,
    retry: false,
  });
}

export function useUpsertCurrentBuyerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertBuyerProfilePayload) => upsertCurrentBuyerProfileApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.buyer });
    },
  });
}

export function useDeleteCurrentBuyerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteCurrentBuyerProfileApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.buyer });
    },
  });
}

export function useCurrentProducerProfile() {
  return useQuery({
    queryKey: profileKeys.producer,
    queryFn: getCurrentProducerProfileApi,
    retry: false,
  });
}

export function useUpsertCurrentProducerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertProducerProfilePayload) => upsertCurrentProducerProfileApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.producer });
      queryClient.invalidateQueries({ queryKey: profileKeys.verificationStatus });
    },
  });
}

export function useDeleteCurrentProducerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteCurrentProducerProfileApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.producer });
      queryClient.invalidateQueries({ queryKey: profileKeys.verificationStatus });
    },
  });
}

export function useProducerVerificationStatus(enabled = true) {
  return useQuery({
    queryKey: profileKeys.verificationStatus,
    queryFn: getProducerVerificationStatusApi,
    enabled,
    retry: false,
  });
}

export function useSubmitProducerVerificationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitVerificationPayload) => submitProducerVerificationRequestApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.verificationStatus });
      queryClient.invalidateQueries({ queryKey: ['profile', 'admin', 'verification-requests'] });
    },
  });
}

export function useAdminProducerVerificationRequests(status?: VerificationReviewStatus) {
  return useQuery({
    queryKey: profileKeys.adminVerification(status),
    queryFn: () => listAdminProducerVerificationRequestsApi(status),
  });
}

export function useReviewAdminProducerVerificationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, payload }: { requestId: string; payload: ReviewVerificationPayload }) =>
      reviewAdminProducerVerificationRequestApi(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'admin', 'verification-requests'] });
      queryClient.invalidateQueries({ queryKey: profileKeys.verificationStatus });
    },
  });
}
