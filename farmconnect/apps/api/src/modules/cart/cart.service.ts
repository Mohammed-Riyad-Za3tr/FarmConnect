import type { Role } from '@prisma/client';

import { BadRequestError, ForbiddenError, NotFoundError } from '../../core/errors';
import { cartRepository } from './cart.repository';
import type { AddCartItemDto, UpdateCartItemDto } from './cart.schemas';

type CartProduct = NonNullable<Awaited<ReturnType<typeof cartRepository.findProductForCart>>>;

function ensureBuyer(role: Role) {
  if (role !== 'BUYER') {
    throw new ForbiddenError('Only buyers can manage carts');
  }
}

function ensureProductPurchasable(
  product: Awaited<ReturnType<typeof cartRepository.findProductForCart>>,
): asserts product is CartProduct {
  if (!product || product.deletedAt) {
    throw new NotFoundError('Product');
  }
  if (product.status !== 'ACTIVE') {
    throw new BadRequestError('Product is not available for purchase');
  }
  if (product.producer.verificationStatus !== 'APPROVED') {
    throw new BadRequestError('Product producer is not approved for public sales');
  }
  if (product.producer.user.status !== 'ACTIVE' || product.producer.user.deletedAt) {
    throw new BadRequestError('Product producer account is not active');
  }
}

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

function mapCart(cart: NonNullable<Awaited<ReturnType<typeof cartRepository.getCartByBuyerId>>>) {
  const items = cart.items.map((item) => {
    const unitPrice = asNumber(item.product.price);
    const lineTotal = unitPrice * item.quantity;

    return {
      ...item,
      unitPrice,
      lineTotal,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    ...cart,
    items,
    summary: {
      itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      currency: items[0]?.product.currency ?? 'DZD',
    },
  };
}

export const cartService = {
  async getCart(userId: string, role: Role) {
    ensureBuyer(role);

    const buyerProfile = await cartRepository.findBuyerProfileByUserId(userId);
    if (!buyerProfile) {
      throw new NotFoundError('Buyer profile');
    }

    await cartRepository.ensureCartByBuyerId(userId);
    const cart = await cartRepository.getCartByBuyerId(userId);
    if (!cart) {
      throw new NotFoundError('Cart');
    }

    return mapCart(cart);
  },

  async addItem(userId: string, role: Role, dto: AddCartItemDto) {
    ensureBuyer(role);

    const buyerProfile = await cartRepository.findBuyerProfileByUserId(userId);
    if (!buyerProfile) {
      throw new NotFoundError('Buyer profile');
    }

    const cart = await cartRepository.ensureCartByBuyerId(userId);
    const product = await cartRepository.findProductForCart(dto.productId);
    ensureProductPurchasable(product);

    const existing = await cartRepository.findCartItemByCartAndProduct(cart.id, dto.productId);
    const nextQty = (existing?.quantity ?? 0) + dto.quantity;

    if (nextQty < product.minOrderQty) {
      throw new BadRequestError(`Quantity must be at least ${product.minOrderQty}`);
    }
    if (nextQty > product.maxOrderQty) {
      throw new BadRequestError(`Quantity cannot exceed ${product.maxOrderQty}`);
    }
    if (nextQty > product.stock) {
      throw new BadRequestError('Insufficient stock for requested quantity');
    }

    if (existing) {
      await cartRepository.updateCartItemQuantity(existing.id, nextQty);
    } else {
      await cartRepository.createCartItem({ cartId: cart.id, productId: dto.productId, quantity: dto.quantity });
    }

    const updatedCart = await cartRepository.getCartByBuyerId(userId);
    if (!updatedCart) {
      throw new NotFoundError('Cart');
    }

    return mapCart(updatedCart);
  },

  async updateItemQuantity(userId: string, role: Role, productId: string, dto: UpdateCartItemDto) {
    ensureBuyer(role);

    const buyerProfile = await cartRepository.findBuyerProfileByUserId(userId);
    if (!buyerProfile) {
      throw new NotFoundError('Buyer profile');
    }

    const cart = await cartRepository.getCartByBuyerId(userId);
    if (!cart) {
      throw new NotFoundError('Cart');
    }

    const item = await cartRepository.findCartItemByCartAndProduct(cart.id, productId);
    if (!item) {
      throw new NotFoundError('Cart item');
    }

    const product = await cartRepository.findProductForCart(productId);
    ensureProductPurchasable(product);

    if (dto.quantity < product.minOrderQty) {
      throw new BadRequestError(`Quantity must be at least ${product.minOrderQty}`);
    }
    if (dto.quantity > product.maxOrderQty) {
      throw new BadRequestError(`Quantity cannot exceed ${product.maxOrderQty}`);
    }
    if (dto.quantity > product.stock) {
      throw new BadRequestError('Insufficient stock for requested quantity');
    }

    await cartRepository.updateCartItemQuantity(item.id, dto.quantity);

    const updatedCart = await cartRepository.getCartByBuyerId(userId);
    if (!updatedCart) {
      throw new NotFoundError('Cart');
    }

    return mapCart(updatedCart);
  },

  async removeItem(userId: string, role: Role, productId: string) {
    ensureBuyer(role);

    const buyerProfile = await cartRepository.findBuyerProfileByUserId(userId);
    if (!buyerProfile) {
      throw new NotFoundError('Buyer profile');
    }

    const cart = await cartRepository.getCartByBuyerId(userId);
    if (!cart) {
      throw new NotFoundError('Cart');
    }

    const item = await cartRepository.findCartItemByCartAndProduct(cart.id, productId);
    if (!item) {
      throw new NotFoundError('Cart item');
    }

    await cartRepository.removeCartItemById(item.id);

    const updatedCart = await cartRepository.getCartByBuyerId(userId);
    if (!updatedCart) {
      throw new NotFoundError('Cart');
    }

    return mapCart(updatedCart);
  },

  async clearCart(userId: string, role: Role) {
    ensureBuyer(role);

    const buyerProfile = await cartRepository.findBuyerProfileByUserId(userId);
    if (!buyerProfile) {
      throw new NotFoundError('Buyer profile');
    }

    const cart = await cartRepository.ensureCartByBuyerId(userId);
    await cartRepository.clearCartItems(cart.id);

    const updatedCart = await cartRepository.getCartByBuyerId(userId);
    if (!updatedCart) {
      throw new NotFoundError('Cart');
    }

    return mapCart(updatedCart);
  },
};
