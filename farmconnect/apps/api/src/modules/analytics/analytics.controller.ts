import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../core/response';
import { ProducerAnalyticsQuerySchema } from './analytics.schemas';
import { analyticsService } from './analytics.service';

export async function getProducerAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = ProducerAnalyticsQuerySchema.parse(req.query);
    const analytics = await analyticsService.getProducerOverview(req.user!.id, query);
    sendSuccess(res, { analytics });
  } catch (error) {
    next(error);
  }
}
