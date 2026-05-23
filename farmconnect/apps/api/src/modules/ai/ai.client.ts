import { config } from '../../config';

const AI_TIMEOUT_MS = 2500;

type AiClientResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

export interface ExplainableFactor {
  factor: string;
  impact: 'increase' | 'decrease' | 'neutral';
  weight: number;
  detail: string;
}

export interface RecommendPricePayload {
  product_name?: string;
  category?: string;
  current_price: number;
  cost_price?: number;
  stock_level?: number;
  recent_orders_7d?: number;
  seasonality_index?: number;
  currency?: string;
}

export interface RecommendPriceResult {
  recommended_price: number;
  currency: string;
  confidence: number;
  explanation: string;
  fallback_used: boolean;
  explainable_factors: ExplainableFactor[];
}

export interface ForecastDemandPayload {
  product_name?: string;
  category?: string;
  horizon_days: number;
  historical_daily_demand?: number[];
  active_listings?: number;
  stock_level?: number;
  seasonality_index?: number;
}

export interface ForecastDemandResult {
  forecast_demand: number;
  horizon_days: number;
  confidence: number;
  explanation: string;
  fallback_used: boolean;
  explainable_factors: ExplainableFactor[];
}

export interface ChatbotPayload {
  message: string;
  role?: 'BUYER' | 'PRODUCER' | 'ADMIN';
  context?: Record<string, unknown>;
}

export interface ChatbotResult {
  answer: string;
  intent: string;
  confidence: number;
  explanation: string;
  fallback_used: boolean;
  follow_up_suggestions: string[];
}

class AiHttpClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async recommendPrice(payload: RecommendPricePayload): Promise<AiClientResult<RecommendPriceResult>> {
    return this.postJson<RecommendPriceResult>('/api/recommend_price', payload);
  }

  async forecastDemand(payload: ForecastDemandPayload): Promise<AiClientResult<ForecastDemandResult>> {
    return this.postJson<ForecastDemandResult>('/api/forecast_demand', payload);
  }

  async chatbot(payload: ChatbotPayload): Promise<AiClientResult<ChatbotResult>> {
    return this.postJson<ChatbotResult>('/api/chatbot', payload);
  }

  private async postJson<T>(path: string, payload: unknown): Promise<AiClientResult<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const body: unknown = await response.json().catch(() => undefined);

      if (!response.ok) {
        const message =
          body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
            ? body.message
            : `AI service responded with status ${response.status}`;
        return { ok: false, error: message };
      }

      return { ok: true, data: body as T };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'AI service request failed',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const aiClient = new AiHttpClient(config.AI_SERVICE_URL);
