import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../../src/app';
import { authService } from '../../src/modules/auth/auth.service';

const accessSecret = process.env['JWT_ACCESS_SECRET'] ?? 'test-access-secret-that-is-at-least-32-chars!!';

function authHeader(userId = 'buyer-1', role = 'BUYER') {
  const token = jwt.sign({ sub: userId, email: 'buyer@example.com', role }, accessSecret);
  return `Bearer ${token}`;
}

describe('Auth integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/auth/register creates account and sets refresh cookie', async () => {
    vi.spyOn(authService, 'register').mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'buyer@example.com',
        fullName: 'Buyer Name',
        role: 'BUYER',
        status: 'ACTIVE',
      } as never,
      accessToken: 'access-token-1',
      refreshTokenValue: 'refresh-token-1',
      expiresAt: new Date(Date.now() + 60_000),
    });

    const response = await request(app).post('/api/auth/register').send({
      email: 'buyer@example.com',
      birthDate: '1995-01-01',
      password: 'StrongPass1',
      fullName: 'Buyer Name',
      role: 'BUYER',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('buyer@example.com');
    expect(response.headers['set-cookie']?.[0]).toContain('farmconnect_rt=refresh-token-1');
  });

  it('POST /api/auth/login rejects invalid payload with validation error', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'not-an-email',
      password: '',
    });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/auth/me returns authenticated user', async () => {
    vi.spyOn(authService, 'getMe').mockResolvedValue({
      id: 'buyer-1',
      email: 'buyer@example.com',
      fullName: 'Buyer Name',
      role: 'BUYER',
      status: 'ACTIVE',
    } as never);

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', authHeader());

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.id).toBe('buyer-1');
  });
});
