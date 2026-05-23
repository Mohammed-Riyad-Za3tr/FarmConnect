import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import {
  getAdminDashboardSummary,
  listAdminAuditLogs,
  listAdminOrders,
  listAdminProducts,
  listAdminUsers,
  moderateAdminProduct,
  moderateAdminUser,
} from './admin.controller';

const adminRouter: IRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(authorize('ADMIN'));

adminRouter.get('/dashboard/summary', getAdminDashboardSummary);
adminRouter.get('/users', listAdminUsers);
adminRouter.patch('/users/:userId/moderation', moderateAdminUser);
adminRouter.get('/products', listAdminProducts);
adminRouter.patch('/products/:productId/moderation', moderateAdminProduct);
adminRouter.get('/orders', listAdminOrders);
adminRouter.get('/audit-logs', listAdminAuditLogs);

export { adminRouter };
