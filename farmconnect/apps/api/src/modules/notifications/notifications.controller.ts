import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '../../core/errors';
import { sendSuccess } from '../../core/response';
import { ListNotificationsQuerySchema } from './notifications.schemas';
import { notificationsService } from './notifications.service';

function authUserId(req: Request): string {
  if (!req.user) {
    throw new BadRequestError('Authenticated user context is missing');
  }

  return req.user.id;
}

export async function listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = authUserId(req);
    const query = ListNotificationsQuerySchema.parse(req.query);
    const data = await notificationsService.list(userId, query);

    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = authUserId(req);
    const notificationId = String(req.params.notificationId ?? '');
    const notification = await notificationsService.markRead(userId, notificationId);

    sendSuccess(res, { notification }, { message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = authUserId(req);
    const data = await notificationsService.markAllRead(userId);

    sendSuccess(res, data, { message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}
