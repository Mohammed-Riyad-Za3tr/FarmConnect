import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../core/response';
import {
  ListAdminAuditLogsQuerySchema,
  ListAdminOrdersQuerySchema,
  ListAdminProductsQuerySchema,
  ListAdminUsersQuerySchema,
  ModerateProductSchema,
  ModerateUserSchema,
} from './admin.schemas';
import { adminService } from './admin.service';

export async function getAdminDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await adminService.getDashboardSummary();
    sendSuccess(res, { summary });
  } catch (error) {
    next(error);
  }
}

export async function listAdminUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = ListAdminUsersQuerySchema.parse(req.query);
    const data = await adminService.listUsers(query);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function moderateAdminUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = String(req.params.userId ?? '');
    const dto = ModerateUserSchema.parse(req.body);
    const user = await adminService.moderateUser(req.user!.id, userId, dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? null,
    });
    sendSuccess(res, { user }, { message: 'User moderation updated' });
  } catch (error) {
    next(error);
  }
}

export async function listAdminProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = ListAdminProductsQuerySchema.parse(req.query);
    const data = await adminService.listProducts(query);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function moderateAdminProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = String(req.params.productId ?? '');
    const dto = ModerateProductSchema.parse(req.body);
    const product = await adminService.moderateProduct(productId, dto);
    sendSuccess(res, { product }, { message: 'Product moderation updated' });
  } catch (error) {
    next(error);
  }
}

export async function listAdminOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = ListAdminOrdersQuerySchema.parse(req.query);
    const data = await adminService.listOrders(query);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function listAdminAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = ListAdminAuditLogsQuerySchema.parse(req.query);
    const data = await adminService.listAuditLogs(query);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
