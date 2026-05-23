import { prisma } from '../../prisma/client';
import type { BuyerBusinessType } from '@farmconnect/shared';

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
  avatarUrl: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
} as const;

const buyerProfileSelect = {
  id: true,
  userId: true,
  businessType: true,
  createdAt: true,
  updatedAt: true,
} as const;

const producerProfileSelect = {
  id: true,
  userId: true,
  businessName: true,
  businessType: true,
  bio: true,
  latitude: true,
  longitude: true,
  wilaya: true,
  commune: true,
  nif: true,
  nis: true,
  nifDocumentUrl: true,
  verificationStatus: true,
  verifiedAt: true,
  verifiedById: true,
  createdAt: true,
  updatedAt: true,
} as const;

const adminProducerVerificationProfileSelect = {
  ...producerProfileSelect,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  verificationRequests: {
    select: {
      id: true,
      producerProfileId: true,
      status: true,
      notes: true,
      documents: true,
      submittedAt: true,
      reviewedAt: true,
      reviewedById: true,
    },
    orderBy: { submittedAt: 'desc' as const },
    take: 1,
  },
} as const;

const verificationRequestSelect = {
  id: true,
  producerProfileId: true,
  status: true,
  notes: true,
  documents: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedById: true,
} as const;

export const profileRepository = {
  findCurrentUser(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  },

  updateCurrentUser(
    userId: string,
    data: {
      fullName?: string;
      avatarUrl?: string | null;
      phone?: string | null;
    },
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    });
  },

  findBuyerProfileByUserId(userId: string) {
    return prisma.buyerProfile.findUnique({
      where: { userId },
      select: buyerProfileSelect,
    });
  },

  createBuyerProfile(userId: string, data?: { businessType?: BuyerBusinessType | null }) {
    return prisma.buyerProfile.create({
      data: { userId, ...data },
      select: buyerProfileSelect,
    });
  },

  updateBuyerProfileByUserId(
    userId: string,
    data: { businessType?: BuyerBusinessType | null },
  ) {
    return prisma.buyerProfile.update({
      where: { userId },
      data,
      select: buyerProfileSelect,
    });
  },

  deleteBuyerProfileByUserId(userId: string) {
    return prisma.buyerProfile.delete({
      where: { userId },
      select: buyerProfileSelect,
    });
  },

  findProducerProfileByUserId(userId: string) {
    return prisma.producerProfile.findUnique({
      where: { userId },
      select: producerProfileSelect,
    });
  },

  createProducerProfile(
    userId: string,
    data: {
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
    },
  ) {
    return prisma.producerProfile.create({
      data: { userId, ...data },
      select: producerProfileSelect,
    });
  },

  updateProducerProfileByUserId(
    userId: string,
    data: {
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
    },
  ) {
    return prisma.producerProfile.update({
      where: { userId },
      data,
      select: producerProfileSelect,
    });
  },

  deleteProducerProfileByUserId(userId: string) {
    return prisma.producerProfile.delete({
      where: { userId },
      select: producerProfileSelect,
    });
  },

  findLatestVerificationRequestByProducerProfileId(producerProfileId: string) {
    return prisma.producerVerificationRequest.findFirst({
      where: { producerProfileId },
      orderBy: { submittedAt: 'desc' },
      select: verificationRequestSelect,
    });
  },

  createVerificationRequest(
    producerProfileId: string,
    data: {
      notes?: string;
      documents: string[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.producerVerificationRequest.create({
        data: {
          producerProfileId,
          status: 'PENDING',
          notes: data.notes,
          documents: data.documents,
        },
        select: verificationRequestSelect,
      });

      await tx.producerProfile.update({
        where: { id: producerProfileId },
        data: { verificationStatus: 'PENDING' },
      });

      return request;
    });
  },

  findVerificationRequestById(requestId: string) {
    return prisma.producerVerificationRequest.findUnique({
      where: { id: requestId },
      select: {
        ...verificationRequestSelect,
        producerProfile: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });
  },

  reviewVerificationRequest(
    requestId: string,
    data: {
      action: 'APPROVE' | 'REJECT';
      notes?: string;
      reviewerId: string;
      producerProfileId: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const reviewedRequest = await tx.producerVerificationRequest.update({
        where: { id: requestId },
        data: {
          status: data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          notes: data.notes,
          reviewedAt: new Date(),
          reviewedById: data.reviewerId,
        },
        select: verificationRequestSelect,
      });

      const updatedProfile = await tx.producerProfile.update({
        where: { id: data.producerProfileId },
        data: {
          verificationStatus: data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          verifiedAt: data.action === 'APPROVE' ? new Date() : null,
          verifiedById: data.action === 'APPROVE' ? data.reviewerId : null,
        },
        select: producerProfileSelect,
      });

      return {
        reviewedRequest,
        updatedProfile,
      };
    });
  },

  listVerificationRequests(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return prisma.producerProfile.findMany({
      where: status ? { verificationStatus: status } : undefined,
      orderBy: [{ verificationStatus: 'asc' }, { updatedAt: 'desc' }],
      select: adminProducerVerificationProfileSelect,
      take: 100,
    });
  },
};
