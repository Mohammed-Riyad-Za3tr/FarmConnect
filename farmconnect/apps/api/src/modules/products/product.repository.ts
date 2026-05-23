import type { Prisma } from '@prisma/client';

import { prisma } from '../../prisma/client';
const prismaAny = prisma as any;

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function computeDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat?: number | null,
  toLng?: number | null,
): number {
  if (toLat == null || toLng == null) {
    return Number.POSITIVE_INFINITY;
  }

  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

const producerProfileSelect = {
  id: true,
  userId: true,
  verificationStatus: true,
} as const;

const ownProductSelect = {
  id: true,
  producerId: true,
  categoryId: true,
  title: true,
  description: true,
  slug: true,
  price: true,
  currency: true,
  unit: true,
  recipePdfUrl: true,
  harvestDate: true,
  harvestWindowStart: true,
  harvestWindowEnd: true,
  isSeasonal: true,
  seasonStartMonth: true,
  seasonEndMonth: true,
  stock: true,
  minOrderQty: true,
  maxOrderQty: true,
  status: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  category: {
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameAr: true,
      parentId: true,
    },
  },
  images: {
    select: {
      id: true,
      url: true,
      altText: true,
      position: true,
      createdAt: true,
    },
    orderBy: { position: 'asc' as const },
  },
} as const;

const publicProductSelect = {
  id: true,
  categoryId: true,
  title: true,
  description: true,
  slug: true,
  price: true,
  currency: true,
  unit: true,
  recipePdfUrl: true,
  harvestDate: true,
  harvestWindowStart: true,
  harvestWindowEnd: true,
  isSeasonal: true,
  seasonStartMonth: true,
  seasonEndMonth: true,
  stock: true,
  minOrderQty: true,
  maxOrderQty: true,
  status: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      slug: true,
      nameEn: true,
      nameAr: true,
      parentId: true,
    },
  },
  producer: {
    select: {
      id: true,
      businessName: true,
      wilaya: true,
      commune: true,
      latitude: true,
      longitude: true,
      verificationStatus: true,
      user: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
  },
  images: {
    select: {
      id: true,
      url: true,
      altText: true,
      position: true,
      createdAt: true,
    },
    orderBy: { position: 'asc' as const },
  },
} as const;

const ownProductLogSelect = {
  id: true,
  productId: true,
  type: true,
  note: true,
  happenedAt: true,
  createdBy: true,
  createdAt: true,
} as const;

function mapRatingSummary(avg: number | null | undefined, count: number | undefined) {
  return {
    ratingAverage: avg == null ? null : Number(avg),
    ratingCount: count ?? 0,
  };
}

type EnrichedPublicProduct = Prisma.ProductGetPayload<{ select: typeof publicProductSelect }> & {
  ratingAverage: number | null;
  ratingCount: number;
  isFavorite: boolean;
  hasActiveOffer: boolean;
  producer: Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>['producer'] & {
    ratingAverage: number | null;
    ratingCount: number;
    isFavorite: boolean;
  };
};

async function enrichPublicProductsWithRatings(
  items: Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>[],
  viewerBuyerId?: string,
): Promise<EnrichedPublicProduct[]> {
  const productRatings = await productRepository.getProductRatingMap(items.map((item) => item.id));
  const producerRatings = await productRepository.getProducerRatingMap(
    Array.from(new Set(items.map((item) => item.producer.id))),
  );
  const [favoriteProductIds, favoriteProducerIds] = await Promise.all([
    viewerBuyerId ? productRepository.getFavoriteProductIdSet(viewerBuyerId, items.map((item) => item.id)) : Promise.resolve(new Set<string>()),
    viewerBuyerId
      ? productRepository.getFavoriteProducerIdSet(
          viewerBuyerId,
          Array.from(new Set(items.map((item) => item.producer.id))),
        )
      : Promise.resolve(new Set<string>()),
  ]);
  const producerIds = Array.from(new Set(items.map((item) => item.producer.id)));
  const activeOfferProducerIds = await productRepository.getProducerActiveOfferSet(producerIds);

  return items.map((item) => ({
    ...item,
    ...mapRatingSummary(productRatings.get(item.id)?.ratingAverage, productRatings.get(item.id)?.ratingCount),
    isFavorite: favoriteProductIds.has(item.id),
    hasActiveOffer: activeOfferProducerIds.has(item.producer.id),
    producer: {
      ...item.producer,
      ...mapRatingSummary(
        producerRatings.get(item.producer.id)?.ratingAverage,
        producerRatings.get(item.producer.id)?.ratingCount,
      ),
      isFavorite: favoriteProducerIds.has(item.producer.id),
    },
  }));
}

export const productRepository = {
  async getProductRatingMap(productIds: string[]) {
    if (!productIds.length) {
      return new Map<string, { ratingAverage: number | null; ratingCount: number }>();
    }

    const rows = await prisma.review.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
      },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return new Map(
      rows.map((row) => [
        row.productId,
        mapRatingSummary(row._avg.rating, row._count._all),
      ]),
    );
  },

  async getProducerRatingMap(producerIds: string[]) {
    if (!producerIds.length) {
      return new Map<string, { ratingAverage: number | null; ratingCount: number }>();
    }

    const rows = await prisma.review.groupBy({
      by: ['producerId'],
      where: {
        producerId: { in: producerIds },
      },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return new Map(
      rows.map((row) => [
        row.producerId,
        mapRatingSummary(row._avg.rating, row._count._all),
      ]),
    );
  },

  async getFavoriteProductIdSet(buyerId: string, productIds: string[]) {
    if (!productIds.length) {
      return new Set<string>();
    }
    const rows = await prismaAny.favoriteProduct.findMany({
      where: {
        buyerId,
        productId: { in: productIds },
      },
      select: { productId: true },
    });
    return new Set(rows.map((row: { productId: string }) => row.productId));
  },

  async getFavoriteProducerIdSet(buyerId: string, producerIds: string[]) {
    if (!producerIds.length) {
      return new Set<string>();
    }
    const rows = await prismaAny.favoriteProducer.findMany({
      where: {
        buyerId,
        producerId: { in: producerIds },
      },
      select: { producerId: true },
    });
    return new Set(rows.map((row: { producerId: string }) => row.producerId));
  },

  async getProducerActiveOfferSet(producerIds: string[]) {
    if (!producerIds.length) {
      return new Set<string>();
    }
    const now = new Date();
    const rows = await prismaAny.coupon.findMany({
      where: {
        producerId: { in: producerIds },
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      select: { producerId: true },
      distinct: ['producerId'],
    });
    return new Set(rows.map((row: { producerId: string }) => row.producerId));
  },

  findProducerProfileByUserId(userId: string) {
    return prisma.producerProfile.findUnique({
      where: { userId },
      select: producerProfileSelect,
    });
  },

  findCategoryById(categoryId: string) {
    return prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  },

  findCategoryBySlug(slug: string) {
    return prisma.category.findUnique({ where: { slug }, select: { id: true, slug: true } });
  },

  listCategories() {
    return prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { nameEn: 'asc' }],
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameAr: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  createOwnProduct(data: any) {
    return prisma.product.create({ data, select: ownProductSelect });
  },

  listOwnProducts(
    producerId: string,
    options: {
      status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';
      categoryId?: string;
      includeArchived: boolean;
      limit: number;
      offset: number;
    },
  ) {
    const where: Prisma.ProductWhereInput = {
      producerId,
      ...(options.status ? { status: options.status } : {}),
      ...(options.categoryId ? { categoryId: options.categoryId } : {}),
      ...(options.includeArchived ? {} : { deletedAt: null }),
    };

    return Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: options.offset,
        take: options.limit,
        select: ownProductSelect,
      }),
      prisma.product.count({ where }),
    ]);
  },

  findOwnProductById(producerId: string, productId: string) {
    return prisma.product.findFirst({
      where: {
        id: productId,
        producerId,
      },
      select: ownProductSelect,
    });
  },

  updateOwnProduct(productId: string, data: any) {
    return prisma.product.update({
      where: { id: productId },
      data,
      select: ownProductSelect,
    });
  },

  softDeleteOwnProduct(productId: string) {
    return prisma.product.update({
      where: { id: productId },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
      },
      select: ownProductSelect,
    });
  },

  listPublicProducts(options: {
    q?: string;
    categoryId?: string;
    categorySlug?: string;
    wilaya?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly: boolean;
    onlyOffers: boolean;
    onlyFavoriteProducers: boolean;
    tags?: string[];
    buyerLat?: number;
    buyerLng?: number;
    limit: number;
    offset: number;
    sort: 'newest' | 'price_asc' | 'price_desc' | 'rating_desc' | 'distance_asc';
    viewerBuyerId?: string;
  }) {
    const now = new Date();
    const producerWhere: Prisma.ProducerProfileWhereInput = {
      verificationStatus: 'APPROVED',
      ...(options.wilaya
        ? {
            OR: [
              { wilaya: { contains: options.wilaya, mode: 'insensitive' } },
              { commune: { contains: options.wilaya, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(options.onlyOffers
        ? {
            coupons: {
              some: {
                isActive: true,
                startsAt: { lte: now },
                endsAt: { gte: now },
              },
            },
          }
        : {}),
      ...(options.onlyFavoriteProducers && options.viewerBuyerId
        ? {
            favoritedBy: {
              some: {
                buyerId: options.viewerBuyerId,
              },
            },
          }
        : {}),
      user: {
        status: 'ACTIVE',
        deletedAt: null,
      },
    };

    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      deletedAt: null,
      producer: producerWhere,
      ...(options.categoryId ? { categoryId: options.categoryId } : {}),
      ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
      ...(options.inStockOnly ? { stock: { gt: 0 } } : {}),
      ...(options.minPrice !== undefined || options.maxPrice !== undefined
        ? {
            price: {
              ...(options.minPrice !== undefined ? { gte: options.minPrice } : {}),
              ...(options.maxPrice !== undefined ? { lte: options.maxPrice } : {}),
            },
          }
        : {}),
      ...(options.tags?.length ? { tags: { hasSome: options.tags } } : {}),
      ...(options.q
        ? {
            OR: [
              { slug: { contains: options.q, mode: 'insensitive' } },
              { title: { path: ['en'], string_contains: options.q } },
              { title: { path: ['ar'], string_contains: options.q } },
              { description: { path: ['en'], string_contains: options.q } },
              { description: { path: ['ar'], string_contains: options.q } },
              { producer: { businessName: { contains: options.q, mode: 'insensitive' } } },
              { tags: { has: options.q } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      options.sort === 'price_asc'
        ? { price: 'asc' }
        : options.sort === 'price_desc'
          ? { price: 'desc' }
          : { createdAt: 'desc' };

    const shouldSortByDistance =
      options.sort === 'distance_asc' &&
      options.buyerLat !== undefined &&
      options.buyerLng !== undefined;
    const shouldSortByRating = options.sort === 'rating_desc';
    const shouldSortInMemory = shouldSortByDistance || shouldSortByRating;

    if (options.onlyFavoriteProducers && !options.viewerBuyerId) {
      return Promise.resolve([[], 0] as const);
    }

    return Promise.all([
      prisma.product
        .findMany({
          where,
          orderBy,
          ...(shouldSortInMemory
            ? { take: Math.max(options.offset + options.limit, options.limit) }
            : { skip: options.offset, take: options.limit }),
          select: publicProductSelect,
        })
        .then(async (items) => {
          const enrichedItems = await enrichPublicProductsWithRatings(items, options.viewerBuyerId);
          if (shouldSortByDistance) {
            return enrichedItems
              .map((item) => ({
                item,
                distanceKm: computeDistanceKm(
                  options.buyerLat!,
                  options.buyerLng!,
                  item.producer.latitude == null ? null : Number(item.producer.latitude),
                  item.producer.longitude == null ? null : Number(item.producer.longitude),
                ),
              }))
              .sort((a, b) => a.distanceKm - b.distanceKm)
              .slice(options.offset, options.offset + options.limit)
              .map((entry) => entry.item);
          }

          if (shouldSortByRating) {
            return enrichedItems
              .sort((a, b) => {
                const aRating = a.ratingAverage ?? 0;
                const bRating = b.ratingAverage ?? 0;
                if (aRating !== bRating) return bRating - aRating;
                return b.ratingCount - a.ratingCount;
              })
              .slice(options.offset, options.offset + options.limit);
          }

          return enrichedItems;
        }),
      prisma.product.count({ where }),
    ]);
  },

  listOwnProductLogs(productId: string) {
    return prismaAny.productLog.findMany({
      where: { productId },
      orderBy: [{ happenedAt: 'desc' }, { createdAt: 'desc' }],
      select: ownProductLogSelect,
    });
  },

  createOwnProductLog(data: {
    productId: string;
    type: 'WATERING' | 'HARVEST' | 'FERTILIZE' | 'OTHER';
    note: string;
    happenedAt: Date;
    createdBy: string;
  }) {
    return prismaAny.productLog.create({
      data,
      select: ownProductLogSelect,
    });
  },

  async findPublicProductBySlug(slug: string, viewerBuyerId?: string) {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        status: 'ACTIVE',
        deletedAt: null,
        producer: {
          verificationStatus: 'APPROVED',
          user: {
            status: 'ACTIVE',
            deletedAt: null,
          },
        },
      },
      select: publicProductSelect,
    });

    if (!product) {
      return null;
    }

    const enrichedProducts = await enrichPublicProductsWithRatings([product], viewerBuyerId);
    const enrichedProduct = enrichedProducts[0];
    if (!enrichedProduct) {
      return null;
    }
    const similarProducts = await productRepository.findSimilarPublicProducts({
      productId: enrichedProduct.id,
      categoryId: enrichedProduct.categoryId,
      producerWilaya: enrichedProduct.producer.wilaya,
      limit: 6,
      viewerBuyerId,
    });

    return {
      ...enrichedProduct,
      similarProducts,
    };
  },

  async findSimilarPublicProducts(input: {
    productId: string;
    categoryId: string | null;
    producerWilaya?: string | null;
    limit: number;
    viewerBuyerId?: string;
  }) {
    const baseWhere: Prisma.ProductWhereInput = {
      id: { not: input.productId },
      status: 'ACTIVE',
      deletedAt: null,
      producer: {
        verificationStatus: 'APPROVED',
        user: {
          status: 'ACTIVE',
          deletedAt: null,
        },
      },
    };

    const candidates = await prisma.product.findMany({
      where: baseWhere,
      select: publicProductSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: 100,
    });

    const enriched = await enrichPublicProductsWithRatings(candidates, input.viewerBuyerId);

    const sorted = enriched.sort((a, b) => {
      const aSameCategory = input.categoryId && a.categoryId === input.categoryId ? 1 : 0;
      const bSameCategory = input.categoryId && b.categoryId === input.categoryId ? 1 : 0;
      if (aSameCategory !== bSameCategory) return bSameCategory - aSameCategory;

      const aSameWilaya = input.producerWilaya && a.producer.wilaya === input.producerWilaya ? 1 : 0;
      const bSameWilaya = input.producerWilaya && b.producer.wilaya === input.producerWilaya ? 1 : 0;
      if (aSameWilaya !== bSameWilaya) return bSameWilaya - aSameWilaya;

      const aRating = a.ratingAverage ?? 0;
      const bRating = b.ratingAverage ?? 0;
      if (aRating !== bRating) return bRating - aRating;

      const aCreated = new Date(a.createdAt).getTime();
      const bCreated = new Date(b.createdAt).getTime();
      if (aCreated !== bCreated) return bCreated - aCreated;

      return a.id.localeCompare(b.id);
    });

    return sorted.slice(0, input.limit);
  },
};
