import type { Role } from '@prisma/client';

import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../core/errors';
import type { CreateReportDto, ListAdminReportsQueryDto, UpdateAdminReportDto } from './report.schemas';
import { reportRepository } from './report.repository';

function ensureReporterRole(role: Role): void {
  if (role !== 'BUYER' && role !== 'PRODUCER') {
    throw new ForbiddenError('Only buyers and producers can create reports');
  }
}

function ensureAdminRole(role: Role): void {
  if (role !== 'ADMIN') {
    throw new ForbiddenError('Only admins can manage reports');
  }
}

export const reportService = {
  async createReport(userId: string, role: Role, dto: CreateReportDto) {
    ensureReporterRole(role);

    if (dto.targetType === 'USER') {
      const user = await reportRepository.findUserById(dto.targetId);
      if (!user) throw new BadRequestError('Invalid target user');
    } else if (dto.targetType === 'PRODUCT') {
      const product = await reportRepository.findProductById(dto.targetId);
      if (!product || product.deletedAt) throw new BadRequestError('Invalid target product');
    } else if (dto.targetType === 'ORDER') {
      const order = await reportRepository.findOrderById(dto.targetId);
      if (!order) throw new BadRequestError('Invalid target order');
    }

    const duplicate = await reportRepository.findDuplicateRecentReport({
      reporterId: userId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      reason: dto.reason,
      since: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    if (duplicate) {
      throw new ConflictError('A similar report was already submitted recently');
    }

    return reportRepository.createReport({
      reporterId: userId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      reason: dto.reason,
      description: dto.description,
      status: 'OPEN',
    });
  },

  async listAdminReports(role: Role, query: ListAdminReportsQueryDto) {
    ensureAdminRole(role);
    const [items, total] = await reportRepository.listAdminReports(query);
    return {
      items,
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + items.length < total,
    };
  },

  async updateAdminReport(
    adminUserId: string,
    role: Role,
    reportId: string,
    dto: UpdateAdminReportDto,
    context?: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    ensureAdminRole(role);
    const existing = await reportRepository.findReportById(reportId);
    if (!existing) throw new NotFoundError('Report');

    const updated = await reportRepository.updateAdminReport(reportId, {
      status: dto.status,
      ...(dto.internalNote !== undefined ? { internalNote: dto.internalNote } : {}),
    });

    await reportRepository.createAuditLog({
      actorId: adminUserId,
      targetType: 'Report',
      targetId: reportId,
      action: dto.status === 'REJECTED' ? 'REJECT' : dto.status === 'RESOLVED' ? 'VERIFY' : 'UPDATE',
      changes: {
        before: { status: existing.status, internalNote: existing.internalNote },
        after: { status: updated.status, internalNote: updated.internalNote },
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return updated;
  },
};
