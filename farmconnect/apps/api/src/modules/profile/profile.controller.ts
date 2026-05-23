import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';

import { BadRequestError } from '../../core/errors';
import { profileService } from './profile.service';
import {
  ListVerificationRequestsQuerySchema,
  ReviewProducerVerificationSchema,
  SubmitProducerVerificationSchema,
  UpdateCurrentUserSchema,
  UpsertBuyerProfileSchema,
  UpsertProducerProfileSchema,
} from './profile.schemas';

function getAuthUser(req: Request): { id: string; role: Role } {
  if (!req.user) {
    throw new BadRequestError('Authenticated user context is missing');
  }
  return { id: req.user.id, role: req.user.role };
}

export async function getCurrentUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuthUser(req);
    const user = await profileService.getCurrentUser(auth.id);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateCurrentUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuthUser(req);
    const dto = UpdateCurrentUserSchema.parse(req.body);
    const user = await profileService.updateCurrentUser(auth.id, dto);
    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentBuyerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuthUser(req);
    const profile = await profileService.getBuyerProfileCurrentUser(auth.id, auth.role);
    res.status(200).json({ data: profile });
  } catch (err) {
    next(err);
  }
}

export async function upsertCurrentBuyerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuthUser(req);
    const dto = UpsertBuyerProfileSchema.parse(req.body ?? {});
    const profile = await profileService.upsertBuyerProfileCurrentUser(auth.id, auth.role, dto);
    res.status(200).json({ data: profile });
  } catch (err) {
    next(err);
  }
}

export async function deleteCurrentBuyerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuthUser(req);
    await profileService.deleteBuyerProfileCurrentUser(auth.id, auth.role);
    res.status(200).json({ message: 'Buyer profile deleted' });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentProducerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuthUser(req);
    const profile = await profileService.getProducerProfileCurrentUser(auth.id, auth.role);
    res.status(200).json({ data: profile });
  } catch (err) {
    next(err);
  }
}

export async function upsertCurrentProducerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuthUser(req);
    const dto = UpsertProducerProfileSchema.parse(req.body);
    const profile = await profileService.upsertProducerProfileCurrentUser(auth.id, auth.role, dto);
    res.status(200).json({ data: profile });
  } catch (err) {
    next(err);
  }
}

export async function deleteCurrentProducerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuthUser(req);
    await profileService.deleteProducerProfileCurrentUser(auth.id, auth.role);
    res.status(200).json({ message: 'Producer profile deleted' });
  } catch (err) {
    next(err);
  }
}

export async function submitCurrentProducerVerificationRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const auth = getAuthUser(req);
    const dto = SubmitProducerVerificationSchema.parse(req.body);
    const request = await profileService.submitProducerVerificationRequestCurrentUser(
      auth.id,
      auth.role,
      dto,
    );
    res.status(201).json({ data: request });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentProducerVerificationStatus(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const auth = getAuthUser(req);
    const data = await profileService.getProducerVerificationStatusCurrentUser(auth.id, auth.role);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}

export async function reviewProducerVerificationRequestByAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const auth = getAuthUser(req);
    const dto = ReviewProducerVerificationSchema.parse(req.body);
    const requestId = String(req.params.requestId ?? '');
    const reviewed = await profileService.reviewProducerVerificationRequest(
      auth.id,
      auth.role,
      requestId,
      dto,
    );
    res.status(200).json({ data: reviewed });
  } catch (err) {
    next(err);
  }
}

export async function listProducerVerificationRequestsByAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const auth = getAuthUser(req);
    const query = ListVerificationRequestsQuerySchema.parse(req.query);
    const requests = await profileService.listProducerVerificationRequests(auth.role, query);
    res.status(200).json({ data: requests });
  } catch (err) {
    next(err);
  }
}
