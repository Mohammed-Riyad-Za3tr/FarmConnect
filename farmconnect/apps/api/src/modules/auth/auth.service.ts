import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

import { config } from '../../config';
import { BadRequestError, ConflictError, UnauthorizedError } from '../../core/errors';
import { authRepository } from './auth.repository';
import type { RegisterDto, LoginDto, AccessTokenPayload } from './auth.schemas';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 30;
const BCRYPT_ROUNDS = 12;

// ── Token helpers ─────────────────────────────────────────────────────────────

function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefreshToken(payload: { sub: string }): string {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): { sub: string } {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

export const authService = {
  async register(dto: RegisterDto, meta: { userAgent?: string; ipAddress?: string } = {}) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const exists = await authRepository.emailExists(normalizedEmail);
    if (exists) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user =
      dto.role === 'PRODUCER'
        ? await authRepository.createProducer(
            { email: normalizedEmail, passwordHash, fullName: dto.fullName, role: dto.role },
            {
              businessName: dto.businessName!,
              wilaya: dto.wilaya!,
              commune: dto.commune!,
            },
          )
        : await authRepository.createBuyer({
          email: normalizedEmail,
            passwordHash,
            fullName: dto.fullName,
            role: dto.role,
          });

    const { accessToken, refreshTokenValue, expiresAt } = await authService._issueTokens(
      user,
      meta,
    );

    return { user, accessToken, refreshTokenValue, expiresAt };
  },

  async login(dto: LoginDto, meta: { userAgent?: string; ipAddress?: string } = {}) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const passwordInput = dto.password.trim();

    const userWithHash = await authRepository.findByEmailWithHash(normalizedEmail);

    if (!userWithHash) {
      // Constant-time comparison even on miss to prevent user enumeration
      await bcrypt.compare(passwordInput, '$2b$12$invalidhashfortimingreasonx');
      throw new UnauthorizedError('Invalid email or password');
    }

    if (userWithHash.status === 'SUSPENDED' || userWithHash.status === 'DELETED') {
      throw new UnauthorizedError('Account is not active');
    }

    const valid = await bcrypt.compare(passwordInput, userWithHash.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Background cleanup of expired tokens (non-blocking)
    authRepository.deleteExpiredTokens(userWithHash.id).catch(() => {});

    const { passwordHash: _ph, ...user } = userWithHash;

    const { accessToken, refreshTokenValue, expiresAt } = await authService._issueTokens(
      user,
      meta,
    );

    return { user, accessToken, refreshTokenValue, expiresAt };
  },

  async refresh(
    oldRefreshToken: string,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ) {
    // 1. Verify JWT signature and expiry
    verifyRefreshToken(oldRefreshToken);

    // 2. Look up token in DB
    const record = await authRepository.findRefreshToken(oldRefreshToken);

    if (!record) {
      throw new UnauthorizedError('Refresh token not found');
    }
    if (record.revokedAt) {
      // Token reuse detected — revoke all tokens for this user (security measure)
      await authRepository.revokeAllUserTokens(record.userId);
      throw new UnauthorizedError('Refresh token reuse detected');
    }
    if (record.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    // 3. Rotate: revoke old, issue new
    await authRepository.revokeRefreshToken(record.id);

    const user = record.user;
    if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
      throw new UnauthorizedError('Account is not active');
    }

    const { accessToken, refreshTokenValue, expiresAt } = await authService._issueTokens(
      user,
      meta,
    );

    return { user, accessToken, refreshTokenValue, expiresAt };
  },

  async logout(refreshToken: string) {
    if (!refreshToken) return;

    const record = await authRepository.findRefreshToken(refreshToken);
    if (record && !record.revokedAt) {
      await authRepository.revokeRefreshToken(record.id);
    }
  },

  async getMe(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return user;
  },

  /** Internal helper — creates DB refresh token record and signs both tokens. */
  async _issueTokens(
    user: { id: string; email: string; role: string },
    meta: { userAgent?: string; ipAddress?: string },
  ) {
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshTokenValue = randomUUID(); // opaque random token stored in DB

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    // Store the opaque token value (not the JWT) so we can revoke individual tokens
    await authRepository.createRefreshToken({
      token: refreshTokenValue,
      userId: user.id,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    return { accessToken, refreshTokenValue, expiresAt };
  },
};

// Export TTL for cookie configuration in controller
export const REFRESH_COOKIE_MAX_AGE_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
