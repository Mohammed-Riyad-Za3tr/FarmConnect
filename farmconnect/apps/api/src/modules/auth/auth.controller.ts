import type { Request, Response, NextFunction } from 'express';

import { config } from '../../config';
import { sendSuccess, sendCreated, sendNoContent } from '../../core/response';
import { RegisterSchema, LoginSchema } from './auth.schemas';
import { authService, REFRESH_COOKIE_MAX_AGE_MS } from './auth.service';

const REFRESH_COOKIE_NAME = 'farmconnect_rt';

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api',
  maxAge,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, cookieOptions(REFRESH_COOKIE_MAX_AGE_MS));
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api' });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
}

function extractRefreshToken(req: Request): string {
  return req.cookies?.[REFRESH_COOKIE_NAME] ?? '';
}

function clientMeta(req: Request) {
  return {
    userAgent: req.headers['user-agent'],
    ipAddress: (req.ip ?? req.socket.remoteAddress) as string,
  };
}

// ── Controllers ───────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = RegisterSchema.parse(req.body);
    const { user, accessToken, refreshTokenValue } = await authService.register(
      dto,
      clientMeta(req),
    );

    setRefreshCookie(res, refreshTokenValue);
    sendCreated(res, { user, accessToken }, 'Account created successfully');
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = LoginSchema.parse(req.body);
    const { user, accessToken, refreshTokenValue } = await authService.login(dto, clientMeta(req));

    setRefreshCookie(res, refreshTokenValue);
    sendSuccess(res, { user, accessToken }, { message: 'Login successful' });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const oldToken = extractRefreshToken(req);
    const { user, accessToken, refreshTokenValue } = await authService.refresh(
      oldToken,
      clientMeta(req),
    );

    setRefreshCookie(res, refreshTokenValue);
    sendSuccess(res, { user, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractRefreshToken(req);
    await authService.logout(token);
    clearRefreshCookie(res);
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.id);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}
