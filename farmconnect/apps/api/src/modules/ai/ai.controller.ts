import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../core/response';
import { BadRequestError } from '../../core/errors';

import { aiService } from './ai.service';
import {
  ChatbotRelayInputSchema,
  ForecastDemandInputSchema,
  RecommendPriceInputSchema,
} from './ai.schemas';

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('Authenticated user is required');
  }
  return userId;
}

export async function recommendPrice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = RecommendPriceInputSchema.parse(req.body);
    const userId = requireUserId(req);
    const result = await aiService.recommendPrice(userId, dto);
    sendSuccess(res, { recommendation: result });
  } catch (error) {
    next(error);
  }
}

export async function forecastDemand(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = ForecastDemandInputSchema.parse(req.body);
    const result = await aiService.forecastDemand(dto);
    sendSuccess(res, { forecast: result });
  } catch (error) {
    next(error);
  }
}

export async function relayChatbot(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = ChatbotRelayInputSchema.parse(req.body);
    const result = await aiService.relayChatbot(dto);
    sendSuccess(res, { reply: result });
  } catch (error) {
    next(error);
  }
}
