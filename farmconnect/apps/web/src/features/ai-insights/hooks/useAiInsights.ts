import { useMutation } from '@tanstack/react-query';

import {
  forecastDemandApi,
  recommendPriceApi,
  relayChatbotApi,
  type AiChatbotInput,
  type AiForecastDemandInput,
  type AiRecommendPriceInput,
} from '../api/ai-insights.api';

export function useAiRecommendPrice() {
  return useMutation({
    mutationFn: (payload: AiRecommendPriceInput) => recommendPriceApi(payload),
  });
}

export function useAiForecastDemand() {
  return useMutation({
    mutationFn: (payload: AiForecastDemandInput) => forecastDemandApi(payload),
  });
}

export function useAiChatbot() {
  return useMutation({
    mutationFn: (payload: AiChatbotInput) => relayChatbotApi(payload),
  });
}