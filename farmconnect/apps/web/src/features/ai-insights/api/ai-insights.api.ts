import { apiClient } from '@/shared/api/client';

export interface AiExplainableFactor {
  factor: string;
  impact: 'increase' | 'decrease' | 'neutral';
  weight: number;
  detail: string;
}

export interface AiRecommendationPersisted {
  id: string;
  score: number;
  reason: string | null;
  createdAt: string;
}

export interface AiForecastPersisted {
  id: string;
  forecastDate: string;
  predictedDemand: number;
  confidenceScore: number;
  modelVersion: string;
  createdAt: string;
}

export interface AiRecommendPriceInput {
  productId?: string;
  currentPrice?: number;
  costPrice?: number;
  stockLevel?: number;
  recentOrders7d?: number;
  seasonalityIndex?: number;
  currency?: string;
}

export interface AiRecommendPriceResult {
  recommendedPrice: number;
  currency: string;
  confidence: number;
  explanation: string;
  fallbackUsed: boolean;
  explainableFactors: AiExplainableFactor[];
  source: 'ai-service' | 'api-fallback';
  persistedRecommendation: AiRecommendationPersisted | null;
}

export interface AiForecastDemandInput {
  productId?: string;
  categoryId?: string;
  horizonDays?: number;
  historicalDailyDemand?: number[];
  activeListings?: number;
  stockLevel?: number;
  seasonalityIndex?: number;
  modelVersion?: string;
}

export interface AiForecastDemandResult {
  forecastDemand: number;
  horizonDays: number;
  confidence: number;
  explanation: string;
  fallbackUsed: boolean;
  explainableFactors: AiExplainableFactor[];
  source: 'ai-service' | 'api-fallback';
  persistedForecast: AiForecastPersisted | null;
}

export interface AiChatbotInput {
  message: string;
  role?: 'BUYER' | 'PRODUCER' | 'ADMIN';
  context?: Record<string, unknown>;
}

export interface AiChatbotReply {
  answer: string;
  intent: string;
  confidence: number;
  explanation: string;
  fallbackUsed: boolean;
  followUpSuggestions: string[];
  source: 'ai-service' | 'api-fallback';
}

export async function recommendPriceApi(payload: AiRecommendPriceInput): Promise<AiRecommendPriceResult> {
  const { data } = await apiClient.post<{ data: { recommendation: AiRecommendPriceResult } }>(
    '/api/ai/recommend-price',
    payload,
  );
  return data.data.recommendation;
}

export async function forecastDemandApi(payload: AiForecastDemandInput): Promise<AiForecastDemandResult> {
  const { data } = await apiClient.post<{ data: { forecast: AiForecastDemandResult } }>(
    '/api/ai/forecast-demand',
    payload,
  );
  return data.data.forecast;
}

export async function relayChatbotApi(payload: AiChatbotInput): Promise<AiChatbotReply> {
  const { data } = await apiClient.post<{ data: { reply: AiChatbotReply } }>('/api/ai/chatbot', payload);
  return data.data.reply;
}