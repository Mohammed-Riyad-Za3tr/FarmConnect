import type { DeliveryStatus, OrderStatus, Prisma } from '@prisma/client';

import { prisma } from '../../prisma/client';

const trackingSelect = {
  id: true,
  orderId: true,
  status: true,
  location: true,
  description: true,
  occurredAt: true,
} as const;

const orderTrackingSelect = {
  id: true,
  buyerId: true,
  status: true,
  paymentStatus: true,
  deliveryStatus: true,
  total: true,
  currency: true,
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
  deliveryTrackings: {
    select: trackingSelect,
    orderBy: { occurredAt: 'asc' as const },
  },
} as const;

function deriveOrderStatusPatch(currentOrderStatus: OrderStatus, nextDeliveryStatus: DeliveryStatus): OrderStatus | null {
  if (currentOrderStatus === 'CANCELLED' || currentOrderStatus === 'REFUNDED') {
    return null;
  }

  if (nextDeliveryStatus === 'PREPARING') {
    if (currentOrderStatus === 'PENDING' || currentOrderStatus === 'CONFIRMED') {
      return 'PROCESSING';
    }
    return null;
  }

  if (nextDeliveryStatus === 'IN_TRANSIT' || nextDeliveryStatus === 'OUT_FOR_DELIVERY') {
    if (currentOrderStatus !== 'DELIVERED') {
      return 'SHIPPED';
    }
    return null;
  }

  if (nextDeliveryStatus === 'DELIVERED') {
    return 'DELIVERED';
  }

  return null;
}

export const deliveryRepository = {
  findOrderForBuyer(orderId: string, buyerId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, buyerId },
      select: {
        id: true,
        buyerId: true,
        status: true,
        paymentStatus: true,
        deliveryStatus: true,
      },
    });
  },

  findOrderForProducer(orderId: string, producerUserId: string) {
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
      select: {
        id: true,
        buyerId: true,
        status: true,
        paymentStatus: true,
        deliveryStatus: true,
      },
    });
  },

  getOrderTrackingForBuyer(orderId: string, buyerId: string) {
    return prisma.order.findFirst({
      where: { id: orderId, buyerId },
      select: orderTrackingSelect,
    });
  },

  getOrderTrackingForProducer(orderId: string, producerUserId: string) {
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
      select: orderTrackingSelect,
    });
  },

  async createTrackingAndSyncOrder(
    orderId: string,
    payload: {
      status: DeliveryStatus;
      location?: string;
      description?: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          buyerId: true,
        },
      });

      if (!order) {
        return null;
      }

      const tracking = await tx.deliveryTracking.create({
        data: {
          orderId,
          status: payload.status,
          location: payload.location,
          description: payload.description,
        },
        select: trackingSelect,
      });

      const nextOrderStatus = deriveOrderStatusPatch(order.status, payload.status);
      const updateData: Prisma.OrderUpdateInput = {
        deliveryStatus: payload.status,
      };

      if (nextOrderStatus) {
        updateData.status = nextOrderStatus;
      }

      await tx.order.update({
        where: { id: orderId },
        data: updateData,
      });

      return {
        tracking,
        orderId: order.id,
        buyerId: order.buyerId,
      };
    });
  },
};
