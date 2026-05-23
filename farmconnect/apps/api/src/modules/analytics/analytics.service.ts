import { NotFoundError } from '../../core/errors';

import { analyticsRepository } from './analytics.repository';

import type { ProducerAnalyticsQueryDto } from './analytics.schemas';

interface DailyBucket {
  date: string;
  orders: Set<string>;
  revenue: number;
  itemsSold: number;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value && typeof value === 'object' && 'toString' in value) {
    return Number(String(value));
  }
  return 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function localizedTitle(input: unknown): string {
  if (!input || typeof input !== 'object') return '';
  const value = input as { en?: unknown; ar?: unknown };
  if (typeof value.en === 'string' && value.en.trim()) return value.en;
  if (typeof value.ar === 'string' && value.ar.trim()) return value.ar;
  return '';
}

export const analyticsService = {
  async getProducerOverview(userId: string, query: ProducerAnalyticsQueryDto) {
    const producerProfile = await analyticsRepository.findProducerProfileByUserId(userId);
    if (!producerProfile) {
      throw new NotFoundError('Producer profile');
    }

    const now = new Date();
    const fromDate = new Date(now);
    const toDate = new Date(now);
    toDate.setHours(23, 59, 59, 999);

    if (query.range === 'today') {
      fromDate.setHours(0, 0, 0, 0);
    } else if (query.range === 'week') {
      fromDate.setHours(0, 0, 0, 0);
      fromDate.setDate(fromDate.getDate() - 6);
    } else if (query.range === 'month') {
      fromDate.setHours(0, 0, 0, 0);
      fromDate.setDate(fromDate.getDate() - 29);
    } else {
      fromDate.setTime(query.from!.getTime());
      fromDate.setHours(0, 0, 0, 0);
      toDate.setTime(query.to!.getTime());
      toDate.setHours(23, 59, 59, 999);
    }

    const periodDays = Math.max(
      1,
      Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );

    const [activeProducts, orderItems, activeProductList] = await Promise.all([
      analyticsRepository.countActiveProducts(producerProfile.id),
      analyticsRepository.listProducerOrderItemsInRange(producerProfile.id, fromDate, toDate),
      analyticsRepository.listActiveProducts(producerProfile.id),
    ]);

    const dailyMap = new Map<string, DailyBucket>();
    for (let offset = 0; offset < periodDays; offset += 1) {
      const date = new Date(fromDate);
      date.setDate(fromDate.getDate() + offset);
      const key = date.toISOString().slice(0, 10);
      dailyMap.set(key, {
        date: key,
        orders: new Set<string>(),
        revenue: 0,
        itemsSold: 0,
      });
    }

    const orderMap = new Map<
      string,
      {
        id: string;
        createdAt: string;
        status: string;
        buyerName: string;
        currency: string;
        subtotal: number;
        lineItems: number;
      }
    >();

    const topProductMap = new Map<
      string,
      {
        productId: string;
        slug: string;
        title: string;
        revenue: number;
        itemsSold: number;
        orderIds: Set<string>;
      }
    >();

    let totalRevenue = 0;
    let totalItemsSold = 0;

    for (const item of orderItems) {
      const status = item.order.status;
      const includeInRevenue = status !== 'CANCELLED' && status !== 'REFUNDED';

      const quantity = item.quantity;
      const lineTotal = toNumber(item.total);
      const orderDateKey = item.order.createdAt.toISOString().slice(0, 10);
      const orderId = item.order.id;

      const daily = dailyMap.get(orderDateKey);
      if (daily) {
        daily.orders.add(orderId);
        if (includeInRevenue) {
          daily.revenue += lineTotal;
          daily.itemsSold += quantity;
        }
      }

      const existingOrder = orderMap.get(orderId);
      if (existingOrder) {
        existingOrder.subtotal += lineTotal;
        existingOrder.lineItems += quantity;
      } else {
        orderMap.set(orderId, {
          id: orderId,
          createdAt: item.order.createdAt.toISOString(),
          status,
          buyerName: item.order.buyer.fullName,
          currency: item.currency,
          subtotal: lineTotal,
          lineItems: quantity,
        });
      }

      if (includeInRevenue) {
        totalRevenue += lineTotal;
        totalItemsSold += quantity;

        const productId = item.productId ?? item.product?.id ?? 'unknown';
        const topProduct = topProductMap.get(productId) ?? {
          productId,
          slug: item.product?.slug ?? 'unknown',
          title:
            localizedTitle(item.product?.title) || localizedTitle(item.productSnapshot) || item.product?.slug || 'Unknown product',
          revenue: 0,
          itemsSold: 0,
          orderIds: new Set<string>(),
        };

        topProduct.revenue += lineTotal;
        topProduct.itemsSold += quantity;
        topProduct.orderIds.add(orderId);

        topProductMap.set(productId, topProduct);
      }
    }

    const totalOrders = orderMap.size;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const timeseries = [...dailyMap.values()].map((entry) => ({
      date: entry.date,
      orders: entry.orders.size,
      revenue: round2(entry.revenue),
      itemsSold: entry.itemsSold,
    }));

    const statusCounter = new Map<string, number>();
    for (const order of orderMap.values()) {
      statusCounter.set(order.status, (statusCounter.get(order.status) ?? 0) + 1);
    }

    const statusBreakdown = [...statusCounter.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    const topProducts = [...topProductMap.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6)
      .map((entry) => ({
        productId: entry.productId,
        slug: entry.slug,
        title: entry.title,
        orders: entry.orderIds.size,
        itemsSold: entry.itemsSold,
        revenue: round2(entry.revenue),
      }));

    const recentOrders = [...orderMap.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
      .map((entry) => ({
        id: entry.id,
        createdAt: entry.createdAt,
        status: entry.status,
        buyerName: entry.buyerName,
        lineItems: entry.lineItems,
        subtotal: round2(entry.subtotal),
        currency: entry.currency,
      }));

    const salesByProduct = new Map<
      string,
      { revenue: number; itemsSold: number; orders: Set<string> }
    >();
    for (const item of orderItems) {
      if (!item.productId || !item.product) continue;
      if (item.order.status === 'CANCELLED' || item.order.status === 'REFUNDED') continue;
      const existing = salesByProduct.get(item.productId) ?? {
        revenue: 0,
        itemsSold: 0,
        orders: new Set<string>(),
      };
      existing.revenue += toNumber(item.total);
      existing.itemsSold += item.quantity;
      existing.orders.add(item.order.id);
      salesByProduct.set(item.productId, existing);
    }

    const lowStockProducts = activeProductList
      .filter((product) => product.stock <= query.lowStockThreshold)
      .sort((a, b) => a.stock - b.stock || a.slug.localeCompare(b.slug))
      .slice(0, 10)
      .map((product) => ({
        productId: product.id,
        slug: product.slug,
        title: localizedTitle(product.title) || product.slug,
        stock: product.stock,
      }));

    const lowSalesProducts = activeProductList
      .map((product) => {
        const sales = salesByProduct.get(product.id);
        return {
          productId: product.id,
          slug: product.slug,
          title: localizedTitle(product.title) || product.slug,
          revenue: round2(sales?.revenue ?? 0),
          itemsSold: sales?.itemsSold ?? 0,
          orders: sales?.orders.size ?? 0,
          createdAt: product.createdAt.toISOString(),
        };
      })
      .sort((a, b) => {
        if (a.revenue !== b.revenue) return a.revenue - b.revenue;
        if (a.itemsSold !== b.itemsSold) return a.itemsSold - b.itemsSold;
        if (a.orders !== b.orders) return a.orders - b.orders;
        return a.createdAt.localeCompare(b.createdAt);
      })
      .slice(0, query.lowSalesBottomN)
      .map(({ createdAt: _createdAt, ...rest }) => rest);

    return {
      range: query.range,
      periodDays,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      kpis: {
        totalRevenue: round2(totalRevenue),
        totalOrders,
        itemsSold: totalItemsSold,
        avgOrderValue: round2(avgOrderValue),
        activeProducts,
      },
      timeseries,
      statusBreakdown,
      topProducts,
      recentOrders,
      warnings: {
        lowStockProducts,
        lowSalesProducts,
      },
    };
  },
};
