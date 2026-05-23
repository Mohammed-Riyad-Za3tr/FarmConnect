import type { Prisma } from '@prisma/client';

import { prisma } from '../../prisma/client';
const prismaAny = prisma as any;

const reportSelect = {
  id: true,
  reporterId: true,
  targetType: true,
  targetId: true,
  reason: true,
  description: true,
  status: true,
  internalNote: true,
  createdAt: true,
  updatedAt: true,
  reporter: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  },
} as const;

export const reportRepository = {
  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: { id: true } });
  },

  findProductById(id: string) {
    return prisma.product.findUnique({ where: { id }, select: { id: true, deletedAt: true } });
  },

  findOrderById(id: string) {
    return prisma.order.findUnique({ where: { id }, select: { id: true } });
  },

  findDuplicateRecentReport(input: {
    reporterId: string;
    targetType: 'USER' | 'PRODUCT' | 'ORDER';
    targetId: string;
    reason: 'SPAM' | 'FRAUD' | 'ABUSE' | 'INAPPROPRIATE_CONTENT' | 'OTHER';
    since: Date;
  }) {
    return prismaAny.report.findFirst({
      where: {
        reporterId: input.reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        createdAt: { gte: input.since },
      },
      select: { id: true },
    });
  },

  createReport(data: any) {
    return prismaAny.report.create({
      data,
      select: reportSelect,
    });
  },

  listAdminReports(query: {
    status?: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
    targetType?: 'USER' | 'PRODUCT' | 'ORDER';
    reporterId?: string;
    limit: number;
    offset: number;
  }) {
    const where: any = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.reporterId ? { reporterId: query.reporterId } : {}),
    };

    return Promise.all([
      prismaAny.report.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: query.offset,
        take: query.limit,
        select: reportSelect,
      }),
      prismaAny.report.count({ where }),
    ]);
  },

  findReportById(reportId: string) {
    return prismaAny.report.findUnique({ where: { id: reportId }, select: reportSelect });
  },

  updateAdminReport(reportId: string, data: any) {
    return prismaAny.report.update({
      where: { id: reportId },
      data,
      select: reportSelect,
    });
  },

  createAuditLog(data: {
    actorId: string;
    targetType: string;
    targetId: string;
    action: 'UPDATE' | 'REJECT' | 'VERIFY';
    changes: Prisma.InputJsonValue;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    return prisma.auditLog.create({ data });
  },
};
