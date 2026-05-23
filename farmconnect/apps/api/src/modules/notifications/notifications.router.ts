import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './notifications.controller';

const notificationsRouter: IRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get('/', listNotifications);
notificationsRouter.patch('/:notificationId/read', markNotificationRead);
notificationsRouter.patch('/read-all', markAllNotificationsRead);

export { notificationsRouter };
