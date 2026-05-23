import type { Role } from '@prisma/client';

import { prisma } from '../../prisma/client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreateUserData {
  email: string;
  passwordHash: string;
  fullName: string;
  role: Role;
}

export interface CreateProducerData {
  userId: string;
  businessName: string;
  wilaya: string;
  commune: string;
}

export interface CreateRefreshTokenData {
  token: string;
  userId: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

// ── Safe user shape returned to callers (never exposes passwordHash) ──────────

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

// ── Repository ────────────────────────────────────────────────────────────────

export const authRepository = {
  /**
   * Find a user by email — includes passwordHash for credential verification.
   * Only used inside auth.service; never returned directly to the client.
   */
  async findByEmailWithHash(email: string) {
    return prisma.user.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: 'insensitive',
        },
      },
      select: { ...userSelect, passwordHash: true },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  async createBuyer(data: CreateUserData) {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        role: data.role,
        status: 'ACTIVE',
        buyerProfile: { create: {} },
      },
      select: userSelect,
    });
  },

  async createProducer(data: CreateUserData, producer: Omit<CreateProducerData, 'userId'>) {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        role: data.role,
        status: 'ACTIVE',
        producerProfile: {
          create: {
            businessName: producer.businessName,
            wilaya: producer.wilaya,
            commune: producer.commune,
            verificationStatus: 'UNVERIFIED',
          },
        },
      },
      select: userSelect,
    });
  },

  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: {
        email: {
          equals: email.trim(),
          mode: 'insensitive',
        },
      },
    });
    return count > 0;
  },

  // ── Refresh tokens ───────────────────────────────────────────────────────

  async createRefreshToken(data: CreateRefreshTokenData) {
    return prisma.refreshToken.create({ data });
  },

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { select: userSelect } },
    });
  },

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  /** Purge expired tokens for a user — called after login to keep the table clean. */
  async deleteExpiredTokens(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
  },
};
