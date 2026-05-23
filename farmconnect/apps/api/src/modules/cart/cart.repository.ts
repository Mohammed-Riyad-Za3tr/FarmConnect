import { prisma } from '../../prisma/client';

const cartItemSelect = {
  id: true,
  cartId: true,
  productId: true,
  quantity: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      currency: true,
      unit: true,
      stock: true,
      minOrderQty: true,
      maxOrderQty: true,
      status: true,
      deletedAt: true,
      producer: {
        select: {
          id: true,
          businessName: true,
          verificationStatus: true,
          user: {
            select: {
              id: true,
              status: true,
              deletedAt: true,
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
        orderBy: { position: 'asc' },
        take: 1,
      },
    },
  },
} as const;

const cartSelect = {
  id: true,
  buyerId: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: cartItemSelect,
    orderBy: { updatedAt: 'desc' as const },
  },
} as const;

export const cartRepository = {
  findBuyerProfileByUserId(userId: string) {
    return prisma.buyerProfile.findUnique({
      where: { userId },
      select: { id: true, userId: true },
    });
  },

  ensureCartByBuyerId(buyerId: string) {
    return prisma.cart.upsert({
      where: { buyerId },
      update: {},
      create: { buyerId },
      select: { id: true, buyerId: true },
    });
  },

  getCartByBuyerId(buyerId: string) {
    return prisma.cart.findUnique({
      where: { buyerId },
      select: cartSelect,
    });
  },

  findCartItemByCartAndProduct(cartId: string, productId: string) {
    return prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
      select: cartItemSelect,
    });
  },

  findProductForCart(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        slug: true,
        title: true,
        price: true,
        currency: true,
        unit: true,
        stock: true,
        minOrderQty: true,
        maxOrderQty: true,
        status: true,
        deletedAt: true,
        producer: {
          select: {
            id: true,
            verificationStatus: true,
            user: {
              select: {
                id: true,
                status: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });
  },

  createCartItem(data: { cartId: string; productId: string; quantity: number }) {
    return prisma.cartItem.create({
      data,
      select: cartItemSelect,
    });
  },

  updateCartItemQuantity(itemId: string, quantity: number) {
    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      select: cartItemSelect,
    });
  },

  removeCartItemById(itemId: string) {
    return prisma.cartItem.delete({
      where: { id: itemId },
      select: cartItemSelect,
    });
  },

  clearCartItems(cartId: string) {
    return prisma.cartItem.deleteMany({ where: { cartId } });
  },
};
