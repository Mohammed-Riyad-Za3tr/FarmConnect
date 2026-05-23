import type { Prisma } from '@prisma/client';

import { prisma } from '../../prisma/client';

const adminUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
  avatarUrl: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
  buyerProfile: {
    select: {
      id: true,
    },
  },
  producerProfile: {
    select: {
      id: true,
      businessName: true,
      verificationStatus: true,
    },
  },
} as const;

const adminProductSelect = {
  id: true,
  slug: true,
  title: true,
  status: true,
  price: true,
  currency: true,
  stock: true,
  createdAt: true,
  updatedAt: true,
  producer: {
    select: {
      id: true,
      businessName: true,
      verificationStatus: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  },
  images: {
    select: {
      id: true,
      url: true,
      altText: true,
      position: true,
    },
    orderBy: { position: 'asc' as const },
    take: 1,
  },
} as const;

const adminOrderSelect = {
  id: true,
  status: true,
  paymentStatus: true,
  deliveryStatus: true,
  total: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
  buyer: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  items: {
    select: {
      id: true,
      quantity: true,
      total: true,
      currency: true,
    },
  },
} as const;

const adminAuditLogSelect = {
  id: true,
  targetType: true,
  targetId: true,
  action: true,
  changes: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
  actor: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
    },
  },
} as const;

export const adminRepository = {
  listUsers(query: {
    q?: string;
    role?: 'BUYER' | 'PRODUCER' | 'ADMIN';
    status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED';
    limit: number;
    offset: number;
  }) {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { fullName: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
        select: adminUserSelect,
      }),
      prisma.user.count({ where }),
    ]);
  },

  listProducts(query: {
    q?: string;
    status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';
    limit: number;
    offset: number;
  }) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { slug: { contains: query.q, mode: 'insensitive' } },
              { title: { path: ['en'], string_contains: query.q } },
              { title: { path: ['ar'], string_contains: query.q } },
              { producer: { businessName: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    return Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
        select: adminProductSelect,
      }),
      prisma.product.count({ where }),
    ]);
  },

  findProductById(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, deletedAt: true },
    });
  },

  findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });
  },

  moderateUser(userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'DELETED') {
    return prisma.user.update({
      where: { id: userId },
      data: {
        status,
        deletedAt: status === 'DELETED' ? new Date() : null,
      },
      select: adminUserSelect,
    });
  },

  createAuditLog(input: {
    actorId: string;
    targetType: string;
    targetId: string;
    action: 'UPDATE' | 'SUSPEND' | 'UNSUSPEND' | 'DELETE';
    changes: Prisma.InputJsonValue;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    return prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        targetType: input.targetType,
        targetId: input.targetId,
        action: input.action,
        changes: input.changes,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  },

  moderateProduct(productId: string, status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED') {
    return prisma.product.update({
      where: { id: productId },
      data: {
        status,
        ...(status === 'ARCHIVED' ? { deletedAt: new Date() } : { deletedAt: null }),
      },
      select: adminProductSelect,
    });
  },

  listOrders(query: {
    status?: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    paymentStatus?: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
    limit: number;
    offset: number;
  }) {
    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    };

    return Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
        select: adminOrderSelect,
      }),
      prisma.order.count({ where }),
    ]);
  },

  listAuditLogs(query: {
    q?: string;
    action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VERIFY' | 'REJECT' | 'SUSPEND' | 'UNSUSPEND';
    actorId?: string;
    targetType?: string;
    limit: number;
    offset: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.targetType ? { targetType: { contains: query.targetType, mode: 'insensitive' } } : {}),
      ...(query.q
        ? {
            OR: [
              { targetType: { contains: query.q, mode: 'insensitive' } },
              { targetId: { contains: query.q, mode: 'insensitive' } },
              { actor: { fullName: { contains: query.q, mode: 'insensitive' } } },
              { actor: { email: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    return Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
        select: adminAuditLogSelect,
      }),
      prisma.auditLog.count({ where }),
    ]);
  },

  async getDashboardSummary() {
    const [
      usersTotal,
      buyersTotal,
      producersTotal,
      adminsTotal,
      productsTotal,
      productsActive,
      ordersTotal,
      pendingOrders,
      pendingVerifications,
      paidPayments,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.user.count({ where: { role: 'PRODUCER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.product.count({ where: { deletedAt: null } }),
      prisma.product.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.producerVerificationRequest.count({ where: { status: 'PENDING' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          status: true,
          total: true,
          currency: true,
          createdAt: true,
          buyer: {
            select: {
              fullName: true,
            },
          },
        },
      }),
    ]);

    return {
      usersTotal,
      buyersTotal,
      producersTotal,
      adminsTotal,
      productsTotal,
      productsActive,
      ordersTotal,
      pendingOrders,
      pendingVerifications,
      paidRevenue: paidPayments._sum.amount,
      recentOrders,
    };
  },
};
