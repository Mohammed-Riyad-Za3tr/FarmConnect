import type { Role } from '@prisma/client';

import { ConflictError, ForbiddenError, NotFoundError } from '../../core/errors';
import { profileRepository } from './profile.repository';
import type {
  ListVerificationRequestsQueryDto,
  ReviewProducerVerificationDto,
  SubmitProducerVerificationDto,
  UpdateCurrentUserDto,
  UpsertBuyerProfileDto,
  UpsertProducerProfileDto,
} from './profile.schemas';

function assertRole(actual: Role, allowed: Role[]): void {
  if (!allowed.includes(actual)) {
    throw new ForbiddenError('You are not allowed to access this resource');
  }
}

export const profileService = {
  async getCurrentUser(userId: string) {
    const user = await profileRepository.findCurrentUser(userId);
    if (!user) {
      throw new NotFoundError('Current user not found');
    }
    return user;
  },

  async updateCurrentUser(userId: string, dto: UpdateCurrentUserDto) {
    const user = await profileRepository.findCurrentUser(userId);
    if (!user) {
      throw new NotFoundError('Current user not found');
    }

    return profileRepository.updateCurrentUser(userId, dto);
  },

  async getBuyerProfileCurrentUser(userId: string, role: Role) {
    assertRole(role, ['BUYER', 'ADMIN']);

    const profile = await profileRepository.findBuyerProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Buyer profile not found');
    }

    return profile;
  },

  async upsertBuyerProfileCurrentUser(userId: string, role: Role, dto: UpsertBuyerProfileDto) {
    assertRole(role, ['BUYER', 'ADMIN']);

    const existing = await profileRepository.findBuyerProfileByUserId(userId);
    if (existing) {
      return profileRepository.updateBuyerProfileByUserId(userId, dto);
    }

    return profileRepository.createBuyerProfile(userId, dto);
  },

  async deleteBuyerProfileCurrentUser(userId: string, role: Role) {
    assertRole(role, ['BUYER', 'ADMIN']);

    const existing = await profileRepository.findBuyerProfileByUserId(userId);
    if (!existing) {
      throw new NotFoundError('Buyer profile not found');
    }

    return profileRepository.deleteBuyerProfileByUserId(userId);
  },

  async getProducerProfileCurrentUser(userId: string, role: Role) {
    assertRole(role, ['PRODUCER', 'ADMIN']);

    const profile = await profileRepository.findProducerProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Producer profile not found');
    }

    return profile;
  },

  async upsertProducerProfileCurrentUser(userId: string, role: Role, dto: UpsertProducerProfileDto) {
    assertRole(role, ['PRODUCER', 'ADMIN']);

    const existing = await profileRepository.findProducerProfileByUserId(userId);
    if (existing) {
      return profileRepository.updateProducerProfileByUserId(userId, dto);
    }

    return profileRepository.createProducerProfile(userId, dto);
  },

  async deleteProducerProfileCurrentUser(userId: string, role: Role) {
    assertRole(role, ['PRODUCER', 'ADMIN']);

    const existing = await profileRepository.findProducerProfileByUserId(userId);
    if (!existing) {
      throw new NotFoundError('Producer profile not found');
    }

    return profileRepository.deleteProducerProfileByUserId(userId);
  },

  async submitProducerVerificationRequestCurrentUser(
    userId: string,
    role: Role,
    dto: SubmitProducerVerificationDto,
  ) {
    assertRole(role, ['PRODUCER']);

    const profile = await profileRepository.findProducerProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Producer profile');
    }

    const latest = await profileRepository.findLatestVerificationRequestByProducerProfileId(profile.id);
    if (latest?.status === 'PENDING') {
      throw new ConflictError('A verification request is already pending review');
    }

    return profileRepository.createVerificationRequest(profile.id, dto);
  },

  async getProducerVerificationStatusCurrentUser(userId: string, role: Role) {
    assertRole(role, ['PRODUCER', 'ADMIN']);

    const profile = await profileRepository.findProducerProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Producer profile');
    }

    const latestRequest = await profileRepository.findLatestVerificationRequestByProducerProfileId(profile.id);

    return {
      producerProfile: profile,
      latestRequest,
    };
  },

  async reviewProducerVerificationRequest(
    adminUserId: string,
    role: Role,
    requestId: string,
    dto: ReviewProducerVerificationDto,
  ) {
    assertRole(role, ['ADMIN']);

    const request = await profileRepository.findVerificationRequestById(requestId);
    if (!request) {
      throw new NotFoundError('Verification request');
    }

    if (request.status !== 'PENDING') {
      throw new ConflictError('This verification request has already been reviewed');
    }

    return profileRepository.reviewVerificationRequest(requestId, {
      action: dto.action,
      notes: dto.notes,
      reviewerId: adminUserId,
      producerProfileId: request.producerProfile.id,
    });
  },

  async listProducerVerificationRequests(role: Role, query: ListVerificationRequestsQueryDto) {
    assertRole(role, ['ADMIN']);
    const profiles = await profileRepository.listVerificationRequests(query.status);
    return profiles.map((profile) => ({
      id: profile.id,
      verificationStatus: profile.verificationStatus,
      verifiedAt: profile.verifiedAt,
      verifiedById: profile.verifiedById,
      businessName: profile.businessName,
      wilaya: profile.wilaya,
      commune: profile.commune,
      user: profile.user,
      latestRequest: profile.verificationRequests[0] ?? null,
    }));
  },
};
