import bcrypt from 'bcryptjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../src/modules/auth/auth.repository', () => ({
  authRepository: {
    emailExists: vi.fn(),
    createBuyer: vi.fn(),
    createProducer: vi.fn(),
    createRefreshToken: vi.fn(),
    findByEmailWithHash: vi.fn(),
    deleteExpiredTokens: vi.fn(),
  },
}));

import { authRepository } from '../../src/modules/auth/auth.repository';
import { ConflictError, UnauthorizedError } from '../../src/core/errors';
import { authService } from '../../src/modules/auth/auth.service';

const mockedRepo = vi.mocked(authRepository);

describe('authService unit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedRepo.createRefreshToken.mockResolvedValue({} as never);
    mockedRepo.deleteExpiredTokens.mockResolvedValue({} as never);
  });

  it('register normalizes email and creates buyer account', async () => {
    mockedRepo.emailExists.mockResolvedValue(false);
    mockedRepo.createBuyer.mockResolvedValue({
      id: 'user-1',
      email: 'buyer@example.com',
      fullName: 'Buyer Name',
      role: 'BUYER',
      status: 'ACTIVE',
    } as never);

    const hashSpy = vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

    const result = await authService.register({
      email: '  BUYER@Example.com  ',
      birthDate: new Date('1990-01-01'),
      password: 'StrongPass1',
      fullName: 'Buyer Name',
      role: 'BUYER',
    });

    expect(hashSpy).toHaveBeenCalledTimes(1);
    expect(mockedRepo.createBuyer).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'buyer@example.com',
        fullName: 'Buyer Name',
        role: 'BUYER',
      }),
    );
    expect(result.accessToken).toBeTypeOf('string');
    expect(result.refreshTokenValue).toBeTypeOf('string');
  });

  it('register rejects duplicate email', async () => {
    mockedRepo.emailExists.mockResolvedValue(true);

    await expect(
      authService.register({
        email: 'existing@example.com',
        birthDate: new Date('1990-01-01'),
        password: 'StrongPass1',
        fullName: 'Existing User',
        role: 'BUYER',
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(mockedRepo.createBuyer).not.toHaveBeenCalled();
    expect(mockedRepo.createProducer).not.toHaveBeenCalled();
  });

  it('login rejects invalid password', async () => {
    mockedRepo.findByEmailWithHash.mockResolvedValue({
      id: 'user-2',
      email: 'buyer@example.com',
      fullName: 'Buyer Name',
      role: 'BUYER',
      status: 'ACTIVE',
      passwordHash: 'stored-hash',
    } as never);

    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(
      authService.login({ email: 'buyer@example.com', password: 'WrongPass1' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(mockedRepo.createRefreshToken).not.toHaveBeenCalled();
  });
});
