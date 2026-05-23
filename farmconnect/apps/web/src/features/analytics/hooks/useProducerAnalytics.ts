import { useQuery } from '@tanstack/react-query';

import { getProducerAnalyticsApi, type ProducerAnalyticsRange } from '../api/producer-analytics.api';

export const producerAnalyticsKeys = {
  overview: (params: {
    range: ProducerAnalyticsRange;
    from?: string;
    to?: string;
    lowStockThreshold?: number;
    lowSalesBottomN?: number;
  }) => ['analytics', 'producer', params] as const,
};

export function useProducerAnalytics(params: {
  range: ProducerAnalyticsRange;
  from?: string;
  to?: string;
  lowStockThreshold?: number;
  lowSalesBottomN?: number;
}) {
  return useQuery({
    queryKey: producerAnalyticsKeys.overview(params),
    queryFn: () => getProducerAnalyticsApi(params),
  });
}
