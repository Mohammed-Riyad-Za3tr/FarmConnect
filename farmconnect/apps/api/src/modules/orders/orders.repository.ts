import type { AuditAction, OrderStatus, Prisma } from '@prisma/client';

import { prisma } from '../../prisma/client';
const prismaAny = prisma as any;

const orderItemSelect = {
  id: true,
  orderId: true,
  productId: true,
  productSnapshot: true,
  quantity: true,
  unitPrice: true,
  total: true,
  currency: true,
  product: {
    select: {
      id: true,
      slug: true,
      title: true,
      producerId: true,
      producer: {
        select: {
          id: true,
          userId: true,
          businessName: true,
          wilaya: true,
          commune: true,
        },
      },
    },
  },
} as const;

const buyerOrderSelect = {
  id: true,
  buyerId: true,
  buyerAddressId: true,
  status: true,
  paymentStatus: true,
  deliveryStatus: true,
  deliveryMethod: true,
  deliveryFee: true,
  deliveryVerificationToken: true,
  verifiedAt: true,
  total: true,
  currency: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  buyerAddress: {
    select: {
      id: true,
      label: true,
      recipientName: true,
      phone: true,
      wilaya: true,
      commune: true,
      street: true,
      postalCode: true,
    },
  },
  items: {
    select: orderItemSelect,
  },
} as const;

const producerOrderSelect = {
  id: true,
  buyerId: true,
  status: true,
  paymentStatus: true,
  deliveryStatus: true,
  deliveryMethod: true,
  deliveryFee: true,
  deliveryVerificationToken: true,
  verifiedAt: true,
  total: true,
  currency: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  buyer: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
  },
  items: {
    select: orderItemSelect,
  },
} as const;

const cartForCheckoutSelect = {
  id: true,
  buyerId: true,
  items: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      product: {
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          currency: true,
          unit: true,
          recipePdfUrl: true,
          stock: true,
          minOrderQty: true,
          maxOrderQty: true,
          status: true,
          deletedAt: true,
          images: {
            select: {
              url: true,
              altText: true,
              position: true,
            },
            orderBy: { position: 'asc' as const },
            take: 1,
          },
          producer: {
            select: {
              id: true,
              userId: true,
              verificationStatus: true,
              producerOffersDelivery: true,
              user: {
                select: {
                  status: true,
                  deletedAt: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const ordersRepository = {
  listOrderReviewsForBuyer(buyerId: string, orderId: string) {
    return prisma.review.findMany({
      where: { buyerId, orderId },
      select: {
        id: true,
        productId: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });
  },
  findBuyerProfileByUserId(userId: string) {
    return prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true, userId: true },
    });
  },

  createBuyerProfile(userId: string) {
    return prisma.buyerProfile.create({
      data: { userId },
      select: { id: true, userId: true },
    });
  },

  getCartForCheckout(buyerId: string) {
    return prisma.cart.findUnique({
      where: { buyerId },
      select: cartForCheckoutSelect,
    });
  },

  findAddressByIdAndUser(addressId: string, userId: string) {
    return prisma.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true },
    });
  },

  createOrderFromCart(
    buyerId: string,
    payload: {
      buyerAddressId?: string;
      deliveryMethod: 'PICKUP' | 'DELIVERY';
      deliveryFee?: number;
      couponCode?: string;
      discountAmount?: number;
      notes?: string;
      currency: string;
      total: number;
      items: Array<{
        productId: string;
        productSnapshot: Prisma.InputJsonObject;
        quantity: number;
        unitPrice: number;
        total: number;
        currency: string;
      }>;
      cartId: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          buyerId,
          buyerAddressId: payload.buyerAddressId,
          deliveryMethod: payload.deliveryMethod,
          deliveryFee: payload.deliveryFee,
          couponCode: payload.couponCode,
          discountAmount: payload.discountAmount,
          notes: payload.notes,
          currency: payload.currency,
          total: payload.total,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
        } as any,
      });

      if (payload.items.length > 0) {
        await tx.orderItem.createMany({
          data: payload.items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            productSnapshot: item.productSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            currency: item.currency,
          })),
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: payload.cartId } });

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        select: buyerOrderSelect,
      });
    });
  },

  listBuyerOrders(
    buyerId: string,
    query: {
      status?: OrderStatus;
      limit: number;
      offset: number;
    },
  ) {
    const where: Prisma.OrderWhereInput = {
      buyerId,
      ...(query.status ? { status: query.status } : {}),
    };

    return Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
        select: buyerOrderSelect,
      }),
      prisma.order.count({ where }),
    ]);
  },

  getBuyerOrderDetail(buyerId: string, orderId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, buyerId },
      select: buyerOrderSelect,
    });
  },

  listProducerRelatedOrders(
    producerUserId: string,
    query: {
      status?: OrderStatus;
      limit: number;
      offset: number;
    },
  ) {
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      items: {
        some: {
          product: {
            producer: {
              userId: producerUserId,
            },
          },
        },
      },
    };

    return Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
        select: producerOrderSelect,
      }),
      prisma.order.count({ where }),
    ]);
  },

  getProducerRelatedOrderDetail(producerUserId: string, orderId: string) {
    return prisma.order.findFirst({
      where: {
        id: orderId,
        items: {
          some: {
            product: {
              producer: {
                userId: producerUserId,
              },
            },
          },
        },
      },
      select: producerOrderSelect,
    });
  },

  updateOrderStatus(orderId: string, status: OrderStatus) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status },
      select: producerOrderSelect,
    });
  },

  findOrderById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      select: producerOrderSelect,
    });
  },

  setDeliveryVerificationToken(orderId: string, token: string) {
    return prismaAny.order.update({
      where: { id: orderId },
      data: {
        deliveryVerificationToken: token,
        verifiedAt: null,
      },
      select: producerOrderSelect,
    });
  },

  markDeliveryVerified(orderId: string) {
    return prismaAny.order.update({
      where: { id: orderId },
      data: {
        verifiedAt: new Date(),
      },
      select: producerOrderSelect,
    });
  },

  createAuditLog(input: {
    actorId: string;
    targetId: string;
    action: AuditAction;
    changes: Prisma.InputJsonValue;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    return prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        targetType: 'Order',
        targetId: input.targetId,
        action: input.action,
        changes: input.changes,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  },
};
