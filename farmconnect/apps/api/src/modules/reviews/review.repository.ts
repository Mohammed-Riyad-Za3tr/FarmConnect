import { prisma } from '../../prisma/client';

export const reviewRepository = {
  findBuyerProfileByUserId(userId: string) {
    return prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
  },

  findReviewableOrderItem(input: { buyerId: string; orderId: string; productId: string }) {
    return prisma.order.findFirst({
      where: {
        id: input.orderId,
        buyerId: input.buyerId,
      },
      select: {
        id: true,
        status: true,
        deliveryStatus: true,
        items: {
          where: {
            productId: input.productId,
          },
          select: {
            productId: true,
            product: {
              select: {
                producerId: true,
              },
            },
          },
          take: 1,
        },
      },
    });
  },

  createReview(data: {
    orderId: string;
    productId: string;
    producerId: string;
    buyerId: string;
    rating: number;
    comment?: string;
  }) {
    return prisma.review.create({
      data,
      select: {
        id: true,
        orderId: true,
        productId: true,
        producerId: true,
        buyerId: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });
  },
};
