import type { Role } from '@prisma/client';

import { ForbiddenError, NotFoundError } from '../../core/errors';
import { favoritesRepository } from './favorites.repository';

function ensureBuyer(role: Role) {
  if (role !== 'BUYER') {
    throw new ForbiddenError('Only buyers can perform this action');
  }
}

export const favoritesService = {
  async toggleFavoriteProduct(userId: string, role: Role, productId: string) {
    ensureBuyer(role);

    const product = await favoritesRepository.findProductById(productId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    const existing = await favoritesRepository.findFavoriteProduct(userId, productId);
    if (existing) {
      await favoritesRepository.deleteFavoriteProduct(userId, productId);
      return { productId, isFavorite: false };
    }

    await favoritesRepository.createFavoriteProduct(userId, productId);
    return { productId, isFavorite: true };
  },

  async toggleFavoriteProducer(userId: string, role: Role, producerId: string) {
    ensureBuyer(role);

    const producer = await favoritesRepository.findProducerById(producerId);
    if (!producer) {
      throw new NotFoundError('Producer');
    }

    const existing = await favoritesRepository.findFavoriteProducer(userId, producerId);
    if (existing) {
      await favoritesRepository.deleteFavoriteProducer(userId, producerId);
      return { producerId, isFavorite: false };
    }

    await favoritesRepository.createFavoriteProducer(userId, producerId);
    return { producerId, isFavorite: true };
  },

  async listFavoriteProducts(userId: string, role: Role) {
    ensureBuyer(role);
    const rows = await favoritesRepository.listFavoriteProducts(userId);
    return rows.map((row: any) => ({
      id: row.id,
      createdAt: row.createdAt,
      product: {
        ...row.product,
        isFavorite: true,
      },
    }));
  },

  async listFavoriteProducers(userId: string, role: Role) {
    ensureBuyer(role);
    const rows = await favoritesRepository.listFavoriteProducers(userId);
    return rows.map((row: any) => ({
      id: row.id,
      createdAt: row.createdAt,
      producer: {
        ...row.producer,
        isFavorite: true,
      },
    }));
  },
};
