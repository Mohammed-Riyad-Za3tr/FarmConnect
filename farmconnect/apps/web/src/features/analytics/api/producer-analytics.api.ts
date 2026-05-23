import { apiClient } from '@/shared/api/client';

export interface ProducerAnalyticsKpis {
  totalRevenue: number;
  totalOrders: number;
  itemsSold: number;
  avgOrderValue: number;
  activeProducts: number;
}
export type ProducerAnalyticsRange = 'today' | 'week' | 'month' | 'custom';

export interface ProducerAnalyticsTimeseriesPoint {
  date: string;
  orders: number;
  revenue: number;
  itemsSold: number;
}

export interface ProducerAnalyticsStatusPoint {
  status: string;
  count: number;
}

export interface ProducerAnalyticsTopProduct {
  productId: string;
  slug: string;
  title: string;
  orders: number;
  itemsSold: number;
  revenue: number;
}

export interface ProducerAnalyticsRecentOrder {
  id: string;
  createdAt: string;
  status: string;
  buyerName: string;
  lineItems: number;
  subtotal: number;
  currency: string;
}

export interface ProducerAnalyticsOverview {
  range: ProducerAnalyticsRange;
  periodDays: number;
  from: string;
  to: string;
  kpis: ProducerAnalyticsKpis;
  timeseries: ProducerAnalyticsTimeseriesPoint[];
  statusBreakdown: ProducerAnalyticsStatusPoint[];
  topProducts: ProducerAnalyticsTopProduct[];
  recentOrders: ProducerAnalyticsRecentOrder[];
  warnings: {
    lowStockProducts: Array<{
      productId: string;
      slug: string;
      title: string;
      stock: number;
    }>;
    lowSalesProducts: Array<{
      productId: string;
      slug: string;
      title: string;
      revenue: number;
      itemsSold: number;
      orders: number;
    }>;
  };
}

export async function getProducerAnalyticsApi(params: {
  range: ProducerAnalyticsRange;
  from?: string;
  to?: string;
  lowStockThreshold?: number;
  lowSalesBottomN?: number;
}): Promise<ProducerAnalyticsOverview> {
  const { data } = await apiClient.get<{ data: { analytics: ProducerAnalyticsOverview } }>(
    '/api/analytics/producer',
    {
      params,
    },
  );

  return data.data.analytics;
}
