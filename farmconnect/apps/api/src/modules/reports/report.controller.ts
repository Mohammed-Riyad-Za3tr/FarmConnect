import type { NextFunction, Request, Response } from 'express';

import { BadRequestError } from '../../core/errors';
import { sendCreated, sendSuccess } from '../../core/response';
import { CreateReportSchema, ListAdminReportsQuerySchema, UpdateAdminReportSchema } from './report.schemas';
import { reportService } from './report.service';

function authContext(req: Request) {
  if (!req.user) throw new BadRequestError('Authenticated user context is missing');
  return { userId: req.user.id, role: req.user.role };
}

export async function createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const dto = CreateReportSchema.parse(req.body);
    const report = await reportService.createReport(auth.userId, auth.role, dto);
    sendCreated(res, { report }, 'Report submitted');
  } catch (error) {
    next(error);
  }
}

export async function listAdminReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const query = ListAdminReportsQuerySchema.parse(req.query);
    const data = await reportService.listAdminReports(auth.role, query);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function updateAdminReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = authContext(req);
    const reportId = String(req.params.reportId ?? '');
    const dto = UpdateAdminReportSchema.parse(req.body);
    const report = await reportService.updateAdminReport(auth.userId, auth.role, reportId, dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? null,
    });
    sendSuccess(res, { report }, { message: 'Report updated' });
  } catch (error) {
    next(error);
  }
}
