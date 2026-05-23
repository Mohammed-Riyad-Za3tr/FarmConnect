import type { Role } from '@prisma/client';

import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../core/errors';
import type { CreateReviewDto } from './review.schemas';
import { reviewRepository } from './review.repository';

function ensureBuyer(role: Role) {
  if (role !== 'BUYER') {
    throw new ForbiddenError('Only buyers can perform this action');
  }
}

export const reviewService = {
  async createReview(userId: string, role: Role, dto: CreateReviewDto) {
    ensureBuyer(role);

    const buyerProfile = await reviewRepository.findBuyerProfileByUserId(userId);
    if (!buyerProfile) {
      throw new NotFoundError('Buyer profile');
    }

    const order = await reviewRepository.findReviewableOrderItem({
      buyerId: userId,
      orderId: dto.orderId,
      productId: dto.productId,
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.status !== 'DELIVERED' && order.deliveryStatus !== 'DELIVERED') {
      throw new BadRequestError('Reviews are allowed only after order delivery/fulfillment');
    }

    const matchedItem = order.items[0];
    if (!matchedItem?.productId || !matchedItem.product?.producerId) {
      throw new BadRequestError('Product was not purchased in this order');
    }

    try {
      return await reviewRepository.createReview({
        orderId: order.id,
        productId: dto.productId,
        producerId: matchedItem.product.producerId,
        buyerId: userId,
        rating: dto.rating,
        comment: dto.comment,
      });
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        throw new ConflictError('Review already exists for this product and order');
      }
      throw error;
    }
  },
};
