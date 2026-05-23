import type { NotificationType, Prisma } from '@prisma/client';

import { NotFoundError } from '../../core/errors';
import {
  sendEmailPlaceholder,
  sendPushPlaceholder,
  sendSmsPlaceholder,
} from './notifications.channels';
import { notificationsRepository } from './notifications.repository';
import type { ListNotificationsQueryDto } from './notifications.schemas';

export const notificationsService = {
  async list(userId: string, query: ListNotificationsQueryDto) {
    const [items, total, unreadCount] = await notificationsRepository.listByUser(userId, {
      unreadOnly: query.unreadOnly,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      items,
      total,
      unreadCount,
      limit: query.limit,
      offset: query.offset,
    };
  },

  async markRead(userId: string, notificationId: string) {
    const existing = await notificationsRepository.findByIdForUser(notificationId, userId);
    if (!existing) {
      throw new NotFoundError('Notification');
    }

    await notificationsRepository.markRead(notificationId, userId);

    return notificationsRepository.findByIdForUser(notificationId, userId);
  },

  async markAllRead(userId: string) {
    const result = await notificationsRepository.markAllRead(userId);

    return {
      updatedCount: result.count,
    };
  },

  async createOrderNotification(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Prisma.InputJsonObject;
  }) {
    const notification = await notificationsRepository.createInAppNotification({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data,
    });

    await Promise.all([
      sendEmailPlaceholder({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
      }),
      sendSmsPlaceholder({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
      }),
      sendPushPlaceholder({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
      }),
    ]);

    return notification;
  },
};
