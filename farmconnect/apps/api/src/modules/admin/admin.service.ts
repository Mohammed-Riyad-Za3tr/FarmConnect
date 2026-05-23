import { BadRequestError, ForbiddenError, NotFoundError } from '../../core/errors';

import { adminRepository } from './admin.repository';
import type {
  ListAdminAuditLogsQueryDto,
  ListAdminOrdersQueryDto,
  ListAdminProductsQueryDto,
  ListAdminUsersQueryDto,
  ModerateProductDto,
} from './admin.schemas';

function decimalToNumber(value: unknown): number {
  return Number(value ?? 0);
}

export const adminService = {
  async listUsers(query: ListAdminUsersQueryDto) {
    const [items, total] = await adminRepository.listUsers(query);
    return {
      items,
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + items.length < total,
    };
  },

  async moderateUser(
    adminUserId: string,
    targetUserId: string,
    dto: { status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'; reason?: string },
    context?: { ipAddress?: string | null; userAgent?: string | null },
  ) {
    const existing = await adminRepository.findUserById(targetUserId);
    if (!existing) {
      throw new NotFoundError('User');
    }
    if (adminUserId === targetUserId) {
      throw new BadRequestError('Admins cannot moderate their own account');
    }
    if (existing.role === 'ADMIN') {
      throw new ForbiddenError('Admin accounts cannot be moderated here');
    }

    const updated = await adminRepository.moderateUser(targetUserId, dto.status);
    await adminRepository.createAuditLog({
      actorId: adminUserId,
      targetType: 'User',
      targetId: targetUserId,
      action:
        dto.status === 'SUSPENDED'
          ? 'SUSPEND'
          : dto.status === 'ACTIVE'
            ? 'UNSUSPEND'
            : 'DELETE',
      changes: {
        before: { status: existing.status, deletedAt: existing.deletedAt, reason: null },
        after: { status: dto.status, deletedAt: dto.status === 'DELETED', reason: dto.reason ?? null },
      },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return updated;
  },

  async listProducts(query: ListAdminProductsQueryDto) {
    const [items, total] = await adminRepository.listProducts(query);
    return {
      items: items.map((item) => ({
        ...item,
        price: decimalToNumber(item.price),
      })),
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + items.length < total,
    };
  },

  async moderateProduct(productId: string, dto: ModerateProductDto) {
    const existing = await adminRepository.findProductById(productId);
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Product');
    }

    const product = await adminRepository.moderateProduct(productId, dto.status);

    return {
      ...product,
      price: decimalToNumber(product.price),
    };
  },

  async listOrders(query: ListAdminOrdersQueryDto) {
    const [items, total] = await adminRepository.listOrders(query);

    return {
      items: items.map((item) => ({
        ...item,
        total: decimalToNumber(item.total),
        itemsCount: item.items.reduce((acc, row) => acc + row.quantity, 0),
      })),
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + items.length < total,
    };
  },

  async listAuditLogs(query: ListAdminAuditLogsQueryDto) {
    const [items, total] = await adminRepository.listAuditLogs(query);

    return {
      items,
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + items.length < total,
    };
  },

  async getDashboardSummary() {
    const summary = await adminRepository.getDashboardSummary();

    return {
      counts: {
        usersTotal: summary.usersTotal,
        buyersTotal: summary.buyersTotal,
        producersTotal: summary.producersTotal,
        adminsTotal: summary.adminsTotal,
        productsTotal: summary.productsTotal,
        productsActive: summary.productsActive,
        ordersTotal: summary.ordersTotal,
        pendingOrders: summary.pendingOrders,
        pendingVerifications: summary.pendingVerifications,
      },
      paidRevenue: decimalToNumber(summary.paidRevenue),
      recentOrders: summary.recentOrders.map((order) => ({
        ...order,
        total: decimalToNumber(order.total),
      })),
    };
  },
};
