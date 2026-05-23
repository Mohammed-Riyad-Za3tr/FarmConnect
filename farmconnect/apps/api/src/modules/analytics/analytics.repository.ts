import { prisma } from '../../prisma/client';

export const analyticsRepository = {
  findProducerProfileByUserId(userId: string) {
    return prisma.producerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
  },

  countActiveProducts(producerId: string) {
    return prisma.product.count({
      where: {
        producerId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  },

  listProducerOrderItems(producerId: string, fromDate: Date) {
    return prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: fromDate,
          },
        },
        product: {
          producerId,
        },
      },
      select: {
        id: true,
        productId: true,
        quantity: true,
        total: true,
        currency: true,
        productSnapshot: true,
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            buyer: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: {
          createdAt: 'desc',
        },
      },
    });
  },

  listProducerOrderItemsInRange(producerId: string, fromDate: Date, toDate: Date) {
    return prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        },
        product: {
          producerId,
        },
      },
      select: {
        id: true,
        productId: true,
        quantity: true,
        total: true,
        currency: true,
        productSnapshot: true,
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            stock: true,
            status: true,
            createdAt: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            buyer: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: {
          createdAt: 'desc',
        },
      },
    });
  },

  listActiveProducts(producerId: string) {
    return prisma.product.findMany({
      where: {
        producerId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        stock: true,
        createdAt: true,
      },
    });
  },
};
