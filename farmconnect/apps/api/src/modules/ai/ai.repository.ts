import { prisma } from '../../prisma/client';

interface RecommendationUpsertInput {
  userId: string;
  productId: string;
  score: number;
  reason?: string;
}

interface ForecastPersistInput {
  productId?: string;
  categoryId?: string;
  forecastDate: Date;
  predictedDemand: number;
  confidenceScore: number;
  modelVersion: string;
}

export const aiRepository = {
  findProductById(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        stock: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
          },
        },
      },
    });
  },

  countRecentOrderedQuantity(productId: string, since: Date) {
    return prisma.orderItem.aggregate({
      where: {
        productId,
        order: {
          createdAt: { gte: since },
        },
      },
      _sum: {
        quantity: true,
      },
    });
  },

  countActiveProductsByCategory(categoryId: string) {
    return prisma.product.count({
      where: {
        categoryId,
        deletedAt: null,
        status: 'ACTIVE',
      },
    });
  },

  upsertRecommendation(input: RecommendationUpsertInput) {
    return prisma.aiRecommendation.upsert({
      where: {
        userId_productId: {
          userId: input.userId,
          productId: input.productId,
        },
      },
      update: {
        score: input.score,
        reason: input.reason,
      },
      create: {
        userId: input.userId,
        productId: input.productId,
        score: input.score,
        reason: input.reason,
      },
      select: {
        id: true,
        score: true,
        reason: true,
        createdAt: true,
      },
    });
  },

  createForecast(input: ForecastPersistInput) {
    return prisma.aiForecast.create({
      data: {
        productId: input.productId,
        categoryId: input.categoryId,
        forecastDate: input.forecastDate,
        predictedDemand: input.predictedDemand,
        confidenceScore: input.confidenceScore,
        modelVersion: input.modelVersion,
      },
      select: {
        id: true,
        forecastDate: true,
        predictedDemand: true,
        confidenceScore: true,
        modelVersion: true,
        createdAt: true,
      },
    });
  },
};
