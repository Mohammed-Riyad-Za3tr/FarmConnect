import type { NotificationType, Prisma } from '@prisma/client';

import { prisma } from '../../prisma/client';

const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  channel: true,
  title: true,
  body: true,
  data: true,
  readAt: true,
  sentAt: true,
  createdAt: true,
} as const;

export const notificationsRepository = {
  listByUser(
    userId: string,
    query: {
      unreadOnly: boolean;
      limit: number;
      offset: number;
    },
  ) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      channel: 'IN_APP',
      ...(query.unreadOnly ? { readAt: null } : {}),
    };

    return Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
        select: notificationSelect,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId,
          channel: 'IN_APP',
          readAt: null,
        },
      }),
    ]);
  },

  findByIdForUser(notificationId: string, userId: string) {
    return prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
        channel: 'IN_APP',
      },
      select: notificationSelect,
    });
  },

  markRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
        channel: 'IN_APP',
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        channel: 'IN_APP',
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  },

  createInAppNotification(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Prisma.InputJsonObject;
  }) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        channel: 'IN_APP',
        title: input.title,
        body: input.body,
        data: input.data ?? {},
      },
      select: notificationSelect,
    });
  },
};
