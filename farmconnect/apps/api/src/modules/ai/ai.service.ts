import { BadRequestError, NotFoundError } from '../../core/errors';
import { logger } from '../../core/logger';

import { aiClient } from './ai.client';
import { aiRepository } from './ai.repository';
import type {
  ChatbotRelayInputDto,
  ForecastDemandInputDto,
  RecommendPriceInputDto,
} from './ai.schemas';

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value && typeof value === 'object' && 'toString' in value) {
    return Number(String(value));
  }
  return 0;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function localizedText(input: unknown): string {
  if (!input || typeof input !== 'object') return '';
  const text = input as { en?: unknown; ar?: unknown };
  if (typeof text.en === 'string' && text.en.trim()) return text.en.trim();
  if (typeof text.ar === 'string' && text.ar.trim()) return text.ar.trim();
  return '';
}

function localizedCategoryName(input: { nameEn?: string | null; nameAr?: string | null } | null | undefined): string {
  if (!input) return '';
  if (input.nameEn?.trim()) return input.nameEn.trim();
  if (input.nameAr?.trim()) return input.nameAr.trim();
  return '';
}

function safeRound2(value: number): number {
  return Math.round(value * 100) / 100;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export const aiService = {
  async recommendPrice(userId: string, dto: RecommendPriceInputDto) {
    const product = dto.productId ? await aiRepository.findProductById(dto.productId) : null;

    if (dto.productId && !product) {
      throw new NotFoundError('Product');
    }

    const currentPrice = dto.currentPrice ?? (product ? toNumber(product.price) : undefined);
    if (!currentPrice || currentPrice <= 0) {
      throw new BadRequestError('A valid current price is required');
    }

    const stockLevel = dto.stockLevel ?? product?.stock;
    const categoryName = localizedCategoryName(product?.category);
    const productName = product ? localizedText(product.title) : undefined;

    const recentOrders7d =
      dto.recentOrders7d ??
      (product
        ? (await aiRepository.countRecentOrderedQuantity(
            product.id,
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ))._sum.quantity ?? undefined
        : undefined);

    const aiResult = await aiClient.recommendPrice({
      product_name: productName || undefined,
      category: categoryName || undefined,
      current_price: currentPrice,
      cost_price: dto.costPrice,
      stock_level: stockLevel,
      recent_orders_7d: recentOrders7d,
      seasonality_index: dto.seasonalityIndex,
      currency: (dto.currency ?? product?.currency ?? 'DZD').toUpperCase(),
    });

    const result = aiResult.ok
      ? {
          recommendedPrice: safeRound2(aiResult.data.recommended_price),
          currency: aiResult.data.currency,
          confidence: clamp01(aiResult.data.confidence),
          explanation: aiResult.data.explanation,
          fallbackUsed: aiResult.data.fallback_used,
          explainableFactors: aiResult.data.explainable_factors,
          source: 'ai-service' as const,
        }
      : {
          recommendedPrice: safeRound2(
            dto.costPrice && dto.costPrice > 0
              ? Math.max(currentPrice, dto.costPrice * 1.1)
              : currentPrice,
          ),
          currency: (dto.currency ?? product?.currency ?? 'DZD').toUpperCase(),
          confidence: 0.3,
          explanation: 'Fallback recommendation used because AI service is unavailable.',
          fallbackUsed: true,
          explainableFactors: [
            {
              factor: 'service_unavailable',
              impact: 'neutral' as const,
              weight: 1,
              detail: aiResult.error,
            },
          ],
          source: 'api-fallback' as const,
        };

    if (!aiResult.ok) {
      logger.warn({ err: aiResult.error, userId, productId: dto.productId }, 'AI recommend price fallback used');
    }

    const persistedRecommendation =
      product && userId
        ? await aiRepository.upsertRecommendation({
            userId,
            productId: product.id,
            score: result.confidence,
            reason: result.explanation,
          })
        : null;

    return {
      ...result,
      persistedRecommendation,
    };
  },

  async forecastDemand(dto: ForecastDemandInputDto) {
    const product = dto.productId ? await aiRepository.findProductById(dto.productId) : null;

    if (dto.productId && !product) {
      throw new NotFoundError('Product');
    }

    const productName = product ? localizedText(product.title) : undefined;
    const categoryId = dto.categoryId ?? product?.category?.id;
    const categoryName = localizedCategoryName(product?.category);
    const activeListings =
      dto.activeListings ??
      (categoryId ? await aiRepository.countActiveProductsByCategory(categoryId) : undefined);
    const stockLevel = dto.stockLevel ?? product?.stock;

    const aiResult = await aiClient.forecastDemand({
      product_name: productName || undefined,
      category: categoryName || undefined,
      horizon_days: dto.horizonDays,
      historical_daily_demand: dto.historicalDailyDemand,
      active_listings: activeListings,
      stock_level: stockLevel,
      seasonality_index: dto.seasonalityIndex,
    });

    const history = dto.historicalDailyDemand;
    const averageDaily = history.length ? history.reduce((acc, value) => acc + value, 0) / history.length : 1.5;

    const result = aiResult.ok
      ? {
          forecastDemand: safeRound2(aiResult.data.forecast_demand),
          horizonDays: aiResult.data.horizon_days,
          confidence: clamp01(aiResult.data.confidence),
          explanation: aiResult.data.explanation,
          fallbackUsed: aiResult.data.fallback_used,
          explainableFactors: aiResult.data.explainable_factors,
          source: 'ai-service' as const,
        }
      : {
          forecastDemand: safeRound2(Math.max(0, averageDaily * dto.horizonDays)),
          horizonDays: dto.horizonDays,
          confidence: 0.3,
          explanation: 'Fallback demand forecast used because AI service is unavailable.',
          fallbackUsed: true,
          explainableFactors: [
            {
              factor: 'service_unavailable',
              impact: 'neutral' as const,
              weight: 1,
              detail: aiResult.error,
            },
          ],
          source: 'api-fallback' as const,
        };

    if (!aiResult.ok) {
      logger.warn({ err: aiResult.error, productId: dto.productId, categoryId: dto.categoryId }, 'AI forecast fallback used');
    }

    const persistedForecast =
      dto.productId || categoryId
        ? await aiRepository.createForecast({
            productId: dto.productId,
            categoryId,
            forecastDate: new Date(startOfDay(new Date()).getTime() + dto.horizonDays * 24 * 60 * 60 * 1000),
            predictedDemand: result.forecastDemand,
            confidenceScore: result.confidence,
            modelVersion: dto.modelVersion ?? (result.source === 'ai-service' ? 'v1-baseline' : 'v1-fallback'),
          })
        : null;

    return {
      ...result,
      persistedForecast,
    };
  },

  async relayChatbot(dto: ChatbotRelayInputDto) {
    const aiResult = await aiClient.chatbot({
      message: dto.message,
      role: dto.role,
      context: dto.context,
    });

    if (aiResult.ok) {
      return {
        answer: aiResult.data.answer,
        intent: aiResult.data.intent,
        confidence: clamp01(aiResult.data.confidence),
        explanation: aiResult.data.explanation,
        fallbackUsed: aiResult.data.fallback_used,
        followUpSuggestions: aiResult.data.follow_up_suggestions,
        source: 'ai-service' as const,
      };
    }

    logger.warn({ err: aiResult.error }, 'AI chatbot fallback used');

    return {
      answer: 'AI assistant is temporarily unavailable. Please try again shortly.',
      intent: 'service_unavailable',
      confidence: 0.25,
      explanation: 'Fallback chatbot response used because AI service is unavailable.',
      fallbackUsed: true,
      followUpSuggestions: ['Retry in a few seconds.', 'Ask a shorter question with product context.'],
      source: 'api-fallback' as const,
    };
  },
};
