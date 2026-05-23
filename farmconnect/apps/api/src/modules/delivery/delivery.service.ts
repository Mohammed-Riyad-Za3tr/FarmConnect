import type { DeliveryStatus, NotificationType, Role } from '@prisma/client';

import { ForbiddenError, NotFoundError } from '../../core/errors';
import { deliveryRepository } from './delivery.repository';
import type { CreateDeliveryUpdateDto } from './delivery.schemas';
import { notificationsService } from '../notifications/notifications.service';

function ensureProducer(role: Role) {
  if (role !== 'PRODUCER') {
    throw new ForbiddenError('Only producers can update delivery tracking');
  }
}

function resolveNotificationType(status: DeliveryStatus): NotificationType {
  if (status === 'IN_TRANSIT' || status === 'OUT_FOR_DELIVERY') {
    return 'ORDER_SHIPPED';
  }

  if (status === 'DELIVERED') {
    return 'ORDER_DELIVERED';
  }

  if (status === 'FAILED_DELIVERY' || status === 'RETURNED') {
    return 'ORDER_CANCELLED';
  }

  if (status === 'PREPARING') {
    return 'ORDER_CONFIRMED';
  }

  return 'GENERAL';
}

function deliveryMessage(status: DeliveryStatus, location?: string, description?: string): string {
  const base = `Delivery status changed to ${status.replaceAll('_', ' ')}`;

  if (location && description) {
    return `${base} at ${location}: ${description}`;
  }

  if (location) {
    return `${base} at ${location}`;
  }

  if (description) {
    return `${base}: ${description}`;
  }

  return base;
}

export const deliveryService = {
  async getOrderTracking(userId: string, role: Role, orderId: string) {
    if (role === 'BUYER') {
      const order = await deliveryRepository.getOrderTrackingForBuyer(orderId, userId);
      if (!order) {
        throw new NotFoundError('Order');
      }

      return order;
    }

    if (role === 'PRODUCER') {
      const order = await deliveryRepository.getOrderTrackingForProducer(orderId, userId);
      if (!order) {
        throw new NotFoundError('Order');
      }

      return order;
    }

    throw new ForbiddenError('Only buyers and producers can view order tracking');
  },

  async addDeliveryUpdate(userId: string, role: Role, orderId: string, dto: CreateDeliveryUpdateDto) {
    ensureProducer(role);

    const order = await deliveryRepository.findOrderForProducer(orderId, userId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    const result = await deliveryRepository.createTrackingAndSyncOrder(orderId, dto);
    if (!result) {
      throw new NotFoundError('Order');
    }

    const orderRef = orderId.slice(0, 8);

    await Promise.allSettled([
      notificationsService.createOrderNotification({
        userId: result.buyerId,
        type: resolveNotificationType(dto.status),
        title: `Order ${orderRef} delivery update`,
        body: deliveryMessage(dto.status, dto.location, dto.description),
        data: {
          orderId,
          trackingId: result.tracking.id,
          status: dto.status,
          location: dto.location ?? null,
        },
      }),
      notificationsService.createOrderNotification({
        userId,
        type: 'GENERAL',
        title: `You updated order ${orderRef}`,
        body: `Delivery status updated to ${dto.status.replaceAll('_', ' ')}.`,
        data: {
          orderId,
          trackingId: result.tracking.id,
          status: dto.status,
          location: dto.location ?? null,
        },
      }),
    ]);

    return result.tracking;
  },
};
