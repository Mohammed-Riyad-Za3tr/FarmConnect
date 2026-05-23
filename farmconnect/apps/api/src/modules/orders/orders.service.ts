import crypto from 'node:crypto';
import type { NotificationType, OrderStatus, Prisma, Role } from '@prisma/client';

import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../core/errors';
import { ordersRepository } from './orders.repository';
import type {
  CheckoutDto,
  ListOrdersQueryDto,
  TransitionOrderStatusDto,
  VerifyDeliveryTokenDto,
} from './orders.schemas';
import { notificationsService } from '../notifications/notifications.service';
import { couponsRepository } from '../coupons/coupons.repository';

function ensureBuyer(role: Role) {
  if (role !== 'BUYER') {
    throw new ForbiddenError('Only buyers can perform this action');
  }
}

async function ensureBuyerProfile(userId: string) {
  const existing = await ordersRepository.findBuyerProfileByUserId(userId);
  if (existing) return existing;

  try {
    return await ordersRepository.createBuyerProfile(userId);
  } catch {
    return ordersRepository.findBuyerProfileByUserId(userId);
  }
}

function ensureProducer(role: Role) {
  if (role !== 'PRODUCER') {
    throw new ForbiddenError('Only producers can perform this action');
  }
}

function ensureProducerOrAdmin(role: Role) {
  if (role !== 'PRODUCER' && role !== 'ADMIN') {
    throw new ForbiddenError('Only producers or admins can perform this action');
  }
}

function decimalToNumber(value: unknown): number {
  return Number(value ?? 0);
}

function notificationTypeFromOrderStatus(status: OrderStatus): NotificationType {
  if (status === 'CONFIRMED' || status === 'PROCESSING') {
    return 'ORDER_CONFIRMED';
  }
  if (status === 'SHIPPED') {
    return 'ORDER_SHIPPED';
  }
  if (status === 'DELIVERED') {
    return 'ORDER_DELIVERED';
  }
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return 'ORDER_CANCELLED';
  }
  return 'GENERAL';
}

function transitionAllowed(current: OrderStatus, next: OrderStatus): boolean {
  const map: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
    REFUNDED: [],
  };

  return map[current].includes(next);
}

function filterProducerItems<T extends { items?: Array<{ product: { producer?: { userId?: string | null } | null } | null }> }>(
  order: T,
  producerUserId: string,
) {
  const items = Array.isArray(order.items) ? order.items : [];
  return {
    ...order,
    items: items.filter((item) => item.product?.producer?.userId === producerUserId),
  };
}

export const ordersService = {
  async checkout(userId: string, role: Role, dto: CheckoutDto) {
    ensureBuyer(role);

    const buyerProfile = await ensureBuyerProfile(userId);
    if (!buyerProfile) {
      throw new NotFoundError('Buyer profile');
    }

    if (dto.addressId) {
      const address = await ordersRepository.findAddressByIdAndUser(dto.addressId, userId);
      if (!address) {
        throw new BadRequestError('Invalid addressId for current buyer');
      }
    }

    if (dto.deliveryMethod === 'DELIVERY' && !dto.addressId) {
      throw new BadRequestError('addressId is required when deliveryMethod is DELIVERY');
    }

    const cart = await ordersRepository.getCartForCheckout(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    const firstCurrency = cart.items[0]?.product.currency;
    const currency = firstCurrency ?? 'DZD';

    let total = 0;
    const producerIdsInCart = new Set<string>();
    let allProducersOfferDelivery = true;
    const orderItems = [] as Array<{
      productId: string;
      productSnapshot: Prisma.InputJsonObject;
      quantity: number;
      unitPrice: number;
      total: number;
      currency: string;
    }>;

    for (const item of cart.items) {
      const product = item.product;

      if (product.deletedAt || product.status !== 'ACTIVE') {
        throw new BadRequestError(`Product ${product.slug} is no longer available`);
      }

      if (product.producer.verificationStatus !== 'APPROVED') {
        throw new BadRequestError(`Producer for product ${product.slug} is not approved`);
      }

      if (product.producer.user.status !== 'ACTIVE' || product.producer.user.deletedAt) {
        throw new BadRequestError(`Producer account for product ${product.slug} is not active`);
      }

      if (item.quantity < product.minOrderQty) {
        throw new BadRequestError(`Quantity for ${product.slug} must be at least ${product.minOrderQty}`);
      }

      if (item.quantity > product.maxOrderQty) {
        throw new BadRequestError(`Quantity for ${product.slug} cannot exceed ${product.maxOrderQty}`);
      }

      if (item.quantity > product.stock) {
        throw new ConflictError(`Insufficient stock for ${product.slug}`);
      }

      if (product.currency !== currency) {
        throw new BadRequestError('Mixed-currency carts are not supported yet');
      }

      producerIdsInCart.add(product.producer.id);
      if (!product.producer.producerOffersDelivery) {
        allProducersOfferDelivery = false;
      }

      const unitPrice = decimalToNumber(product.price);
      const lineTotal = unitPrice * item.quantity;
      total += lineTotal;

      orderItems.push({
        productId: product.id,
        productSnapshot: {
          title: product.title as Prisma.InputJsonValue,
          imageUrl: product.images[0]?.url ?? null,
          unit: product.unit,
          recipePdfUrl: product.recipePdfUrl ?? null,
        },
        quantity: item.quantity,
        unitPrice,
        total: lineTotal,
        currency: product.currency,
      });
    }

    const isSingleProducerOrder = producerIdsInCart.size === 1;
    if (dto.deliveryMethod === 'DELIVERY' && (!isSingleProducerOrder || !allProducersOfferDelivery)) {
      throw new BadRequestError(
        'DELIVERY is only available for single-producer orders where the producer offers delivery',
      );
    }

    const deliveryFee = dto.deliveryMethod === 'DELIVERY' ? 0 : undefined;
    const singleProducerId = isSingleProducerOrder ? Array.from(producerIdsInCart)[0] : undefined;

    let discountAmount = 0;
    let appliedCouponCode: string | undefined;
    if (dto.couponCode) {
      if (!singleProducerId) {
        throw new BadRequestError('Coupons can only be applied to single-producer orders');
      }

      const now = new Date();
      const coupon = await couponsRepository.findActiveCouponByCode(dto.couponCode.toUpperCase(), now);
      if (!coupon) {
        throw new BadRequestError('Coupon is invalid or inactive');
      }

      if (coupon.producerId !== singleProducerId) {
        throw new BadRequestError('Coupon does not apply to items in this cart');
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new BadRequestError('Coupon usage limit has been reached');
      }

      if (coupon.type === 'PERCENT') {
        discountAmount = Math.min(total, (total * decimalToNumber(coupon.amount)) / 100);
      } else {
        discountAmount = Math.min(total, decimalToNumber(coupon.amount));
      }

      appliedCouponCode = coupon.code;
      await couponsRepository.incrementCouponUsage(coupon.id);
    }

    const createdOrder = await ordersRepository.createOrderFromCart(userId, {
      buyerAddressId: dto.addressId,
      deliveryMethod: dto.deliveryMethod,
      deliveryFee,
      couponCode: appliedCouponCode,
      discountAmount,
      notes: dto.notes,
      currency,
      total: total + (deliveryFee ?? 0) - discountAmount,
      items: orderItems,
      cartId: cart.id,
    });

    const producerUserIds = Array.from(
      new Set(
        cart.items
          .map((item) => item.product.producer.userId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const orderRef = createdOrder.id.slice(0, 8);

    await Promise.allSettled([
      notificationsService.createOrderNotification({
        userId,
        type: 'ORDER_PLACED',
        title: `Order #${orderRef} placed`,
        body: `Your order has been placed with ${createdOrder.items.length} item(s).`,
        data: {
          orderId: createdOrder.id,
          total,
          currency,
        },
      }),
      ...producerUserIds.map((producerUserId) =>
        notificationsService.createOrderNotification({
          userId: producerUserId,
          type: 'ORDER_PLACED',
          title: `New order #${orderRef}`,
          body: 'A buyer has placed an order that includes your products.',
          data: {
            orderId: createdOrder.id,
            buyerId: userId,
          },
        }),
      ),
    ]);

    return createdOrder;
  },

  async listBuyerOrders(userId: string, role: Role, query: ListOrdersQueryDto) {
    ensureBuyer(role);

    const buyerProfile = await ensureBuyerProfile(userId);
    if (!buyerProfile) {
      throw new NotFoundError('Buyer profile');
    }

    const [items, total] = await ordersRepository.listBuyerOrders(userId, {
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      items,
      total,
      limit: query.limit,
      offset: query.offset,
    };
  },

  async getBuyerOrderDetail(userId: string, role: Role, orderId: string) {
    ensureBuyer(role);

    const buyerProfile = await ensureBuyerProfile(userId);
    if (!buyerProfile) {
      throw new NotFoundError('Buyer profile');
    }

    const order = await ordersRepository.getBuyerOrderDetail(userId, orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    const reviews = await ordersRepository.listOrderReviewsForBuyer(userId, orderId);
    const reviewMap = new Map(reviews.map((review) => [review.productId, review]));

    const canAccessRecipes = order.paymentStatus === 'PAID';
    return {
      ...order,
      items: order.items.map((item) => {
        const snapshot = (item.productSnapshot ?? {}) as { recipePdfUrl?: string | null };
        return {
          ...item,
          recipePdfUrl: canAccessRecipes ? snapshot.recipePdfUrl ?? null : null,
          review: item.productId ? reviewMap.get(item.productId) ?? null : null,
        };
      }),
    };
  },

  async listProducerOrders(userId: string, role: Role, query: ListOrdersQueryDto) {
    ensureProducer(role);

    const [items, total] = await ordersRepository.listProducerRelatedOrders(userId, {
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      items: items.map((order) => filterProducerItems(order, userId)),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  },

  async getProducerOrderDetail(userId: string, role: Role, orderId: string) {
    ensureProducer(role);

    const order = await ordersRepository.getProducerRelatedOrderDetail(userId, orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    return filterProducerItems(order, userId);
  },

  async transitionProducerOrderStatus(
    userId: string,
    role: Role,
    orderId: string,
    dto: TransitionOrderStatusDto,
  ) {
    ensureProducer(role);

    const order = await ordersRepository.getProducerRelatedOrderDetail(userId, orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    if (!transitionAllowed(order.status, dto.status)) {
      throw new BadRequestError(`Invalid status transition from ${order.status} to ${dto.status}`);
    }

    const updated = await ordersRepository.updateOrderStatus(order.id, dto.status);

    const producerUserIds = Array.from(
      new Set(
        updated.items
          .map((item) => item.product?.producer?.userId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const orderRef = updated.id.slice(0, 8);
    const notificationType = notificationTypeFromOrderStatus(dto.status);

    await Promise.allSettled([
      notificationsService.createOrderNotification({
        userId: updated.buyerId,
        type: notificationType,
        title: `Order #${orderRef} updated`,
        body: `Your order status is now ${dto.status.replaceAll('_', ' ')}.`,
        data: {
          orderId: updated.id,
          status: dto.status,
          actorRole: 'PRODUCER',
        },
      }),
      ...producerUserIds.map((producerUserId) =>
        notificationsService.createOrderNotification({
          userId: producerUserId,
          type: notificationType,
          title: `Order #${orderRef} status changed`,
          body: `Order status changed to ${dto.status.replaceAll('_', ' ')}.`,
          data: {
            orderId: updated.id,
            status: dto.status,
          },
        }),
      ),
    ]);

    return filterProducerItems(updated, userId);
  },

  async generateDeliveryVerificationToken(
    userId: string,
    role: Role,
    orderId: string,
    context?: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    ensureProducerOrAdmin(role);
    const order =
      role === 'ADMIN'
        ? await ordersRepository.findOrderById(orderId)
        : await ordersRepository.getProducerRelatedOrderDetail(userId, orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new BadRequestError('Cannot generate verification token for cancelled/refunded order');
    }
    if (order.deliveryMethod !== 'DELIVERY') {
      throw new BadRequestError('Delivery verification is only available for DELIVERY orders');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const updated = await ordersRepository.setDeliveryVerificationToken(order.id, token);
    await ordersRepository.createAuditLog({
      actorId: userId,
      targetId: order.id,
      action: 'UPDATE',
      changes: { event: 'delivery_verification_token_generated' },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
    return role === 'PRODUCER' ? filterProducerItems(updated, userId) : updated;
  },

  async verifyDeliveryToken(
    userId: string,
    role: Role,
    dto: VerifyDeliveryTokenDto,
    context?: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    ensureProducerOrAdmin(role);
    const order =
      role === 'ADMIN'
        ? await ordersRepository.findOrderById(dto.orderId)
        : await ordersRepository.getProducerRelatedOrderDetail(userId, dto.orderId);
    if (!order) {
      throw new NotFoundError('Order');
    }
    if (!order.deliveryVerificationToken) {
      throw new BadRequestError('No verification token generated for this order');
    }
    if (order.verifiedAt) {
      return role === 'PRODUCER' ? filterProducerItems(order, userId) : order;
    }

    const actualBuffer = Buffer.from(order.deliveryVerificationToken);
    const inputBuffer = Buffer.from(dto.token);
    const valid =
      actualBuffer.length === inputBuffer.length && crypto.timingSafeEqual(actualBuffer, inputBuffer);
    if (!valid) {
      throw new BadRequestError('Invalid verification token');
    }

    const updated = await ordersRepository.markDeliveryVerified(order.id);
    await ordersRepository.createAuditLog({
      actorId: userId,
      targetId: order.id,
      action: 'VERIFY',
      changes: { event: 'delivery_handoff_verified' },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });
    return role === 'PRODUCER' ? filterProducerItems(updated, userId) : updated;
  },
};
