import { prisma } from '../../prisma/client';
const prismaAny = prisma as any;

const favoriteProductSelect = {
  id: true,
  buyerId: true,
  productId: true,
  createdAt: true,
  product: {
    select: {
      id: true,
      categoryId: true,
      title: true,
      description: true,
      slug: true,
      price: true,
      currency: true,
      unit: true,
      stock: true,
      minOrderQty: true,
      maxOrderQty: true,
      status: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
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
    },
  },
} as const;

const favoriteProducerSelect = {
  id: true,
  buyerId: true,
  producerId: true,
  createdAt: true,
  producer: {
    select: {
      id: true,
      userId: true,
      businessName: true,
      businessType: true,
      bio: true,
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
} as const;

export const favoritesRepository = {
  findProductById(productId: string) {
    return prisma.product.findFirst({
      where: {
        id: productId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
  },

  findProducerById(producerId: string) {
    return prisma.producerProfile.findUnique({
      where: { id: producerId },
      select: { id: true },
    });
  },

  findFavoriteProduct(buyerId: string, productId: string) {
    return prismaAny.favoriteProduct.findUnique({
      where: {
        buyerId_productId: {
          buyerId,
          productId,
        },
      },
      select: { id: true },
    });
  },

  findFavoriteProducer(buyerId: string, producerId: string) {
    return prismaAny.favoriteProducer.findUnique({
      where: {
        buyerId_producerId: {
          buyerId,
          producerId,
        },
      },
      select: { id: true },
    });
  },

  createFavoriteProduct(buyerId: string, productId: string) {
    return prismaAny.favoriteProduct.create({
      data: { buyerId, productId },
      select: { id: true },
    });
  },

  deleteFavoriteProduct(buyerId: string, productId: string) {
    return prismaAny.favoriteProduct.delete({
      where: {
        buyerId_productId: {
          buyerId,
          productId,
        },
      },
      select: { id: true },
    });
  },

  createFavoriteProducer(buyerId: string, producerId: string) {
    return prismaAny.favoriteProducer.create({
      data: { buyerId, producerId },
      select: { id: true },
    });
  },

  deleteFavoriteProducer(buyerId: string, producerId: string) {
    return prismaAny.favoriteProducer.delete({
      where: {
        buyerId_producerId: {
          buyerId,
          producerId,
        },
      },
      select: { id: true },
    });
  },

  listFavoriteProducts(buyerId: string) {
    return prismaAny.favoriteProduct.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      select: favoriteProductSelect,
    });
  },

  listFavoriteProducers(buyerId: string) {
    return prismaAny.favoriteProducer.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      select: favoriteProducerSelect,
    });
  },
};
