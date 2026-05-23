import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '../../core/errors';
import { sendCreated } from '../../core/response';
import { CreateReviewSchema } from './review.schemas';
import { reviewService } from './review.service';

function authContext(req: Request) {
  if (!req.user) {
    throw new BadRequestError('Authenticated user context is missing');
  }
  return { userId: req.user.id, role: req.user.role };
}

export async function createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const dto = CreateReviewSchema.parse(req.body);
    const review = await reviewService.createReview(auth.userId, auth.role, dto);
    sendCreated(res, { review }, 'Review created');
  } catch (err) {
    next(err);
  }
}
