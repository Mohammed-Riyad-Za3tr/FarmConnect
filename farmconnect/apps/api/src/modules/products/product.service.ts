import type { Prisma, Role } from '@prisma/client';

import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../core/errors';
import { productRepository } from './product.repository';
import type {
  CreateProductLogDto,
  CreateProductDto,
  ListOwnProductsQueryDto,
  ListPublicProductsQueryDto,
  UpdateProductDto,
} from './product.schemas';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function ensureProducer(role: Role): void {
  if (role !== 'PRODUCER') {
    throw new ForbiddenError('Only producers can manage products');
  }
}

function mapUniqueConstraintError(err: unknown): never {
  const prismaErr = err as { code?: string; meta?: { target?: string[] } };
  if (prismaErr?.code === 'P2002') {
    const fields = prismaErr.meta?.target?.join(', ') ?? 'unique field';
    throw new ConflictError(`Duplicate value for ${fields}`);
  }
  throw err;
}

export const productService = {
  async listCategories() {
    return productRepository.listCategories();
  },

  async createOwnProduct(userId: string, role: Role, dto: CreateProductDto) {
    ensureProducer(role);

    const producerProfile = await productRepository.findProducerProfileByUserId(userId);
    if (!producerProfile) {
      throw new NotFoundError('Producer profile');
    }

    if (dto.categoryId) {
      const category = await productRepository.findCategoryById(dto.categoryId);
      if (!category) {
        throw new BadRequestError('Invalid categoryId');
      }
    }

    if (dto.status === 'ACTIVE' && producerProfile.verificationStatus !== 'APPROVED') {
      throw new ForbiddenError('Producer must be verified before publishing ACTIVE products');
    }

    const fallbackTitle = dto.title.en ?? dto.title.ar;
    const slugBase = dto.slug ?? slugify(fallbackTitle ?? 'product');
    const slug = dto.slug ?? `${slugBase}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      return await productRepository.createOwnProduct({
        producerId: producerProfile.id,
        categoryId: dto.categoryId,
        title: dto.title as Prisma.JsonObject,
        description: dto.description as Prisma.JsonObject,
        slug,
        price: dto.price,
        currency: dto.currency,
        unit: dto.unit,
        recipePdfUrl: dto.recipePdfUrl,
        harvestDate: dto.harvestDate,
        harvestWindowStart: dto.harvestWindowStart,
        harvestWindowEnd: dto.harvestWindowEnd,
        isSeasonal: dto.isSeasonal,
        seasonStartMonth: dto.seasonStartMonth,
        seasonEndMonth: dto.seasonEndMonth,
        stock: dto.stock,
        minOrderQty: dto.minOrderQty,
        maxOrderQty: dto.maxOrderQty,
        status: dto.status,
        tags: dto.tags,
      });
    } catch (err) {
      mapUniqueConstraintError(err);
    }
  },

  async listOwnProducts(userId: string, role: Role, query: ListOwnProductsQueryDto) {
    ensureProducer(role);

    const producerProfile = await productRepository.findProducerProfileByUserId(userId);
    if (!producerProfile) {
      return {
        items: [],
        total: 0,
        limit: query.limit,
        offset: query.offset,
      };
    }

    if (query.categoryId) {
      const category = await productRepository.findCategoryById(query.categoryId);
      if (!category) {
        throw new BadRequestError('Invalid categoryId');
      }
    }

    const [items, total] = await productRepository.listOwnProducts(producerProfile.id, {
      status: query.status,
      categoryId: query.categoryId,
      includeArchived: query.includeArchived,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      items,
      total,
      limit: query.limit,
      offset: query.offset,
    };
  },

  async getOwnProductById(userId: string, role: Role, productId: string) {
    ensureProducer(role);

    const producerProfile = await productRepository.findProducerProfileByUserId(userId);
    if (!producerProfile) {
      throw new NotFoundError('Producer profile');
    }

    const product = await productRepository.findOwnProductById(producerProfile.id, productId);
    if (!product || product.deletedAt) {
      throw new NotFoundError('Product');
    }

    return product;
  },

  async updateOwnProduct(userId: string, role: Role, productId: string, dto: UpdateProductDto) {
    ensureProducer(role);

    const producerProfile = await productRepository.findProducerProfileByUserId(userId);
    if (!producerProfile) {
      throw new NotFoundError('Producer profile');
    }

    const existing = await productRepository.findOwnProductById(producerProfile.id, productId);
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Product');
    }

    if (dto.categoryId) {
      const category = await productRepository.findCategoryById(dto.categoryId);
      if (!category) {
        throw new BadRequestError('Invalid categoryId');
      }
    }

    const minOrderQty = dto.minOrderQty ?? existing.minOrderQty;
    const maxOrderQty = dto.maxOrderQty ?? existing.maxOrderQty;
    if (minOrderQty > maxOrderQty) {
      throw new BadRequestError('minOrderQty cannot be greater than maxOrderQty');
    }

    const nextStatus = dto.status ?? existing.status;
    if (nextStatus === 'ACTIVE' && producerProfile.verificationStatus !== 'APPROVED') {
      throw new ForbiddenError('Producer must be verified before publishing ACTIVE products');
    }

    try {
      return await productRepository.updateOwnProduct(existing.id, {
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.title !== undefined ? { title: dto.title as Prisma.JsonObject } : {}),
        ...(dto.description !== undefined ? { description: dto.description as Prisma.JsonObject } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.recipePdfUrl !== undefined ? { recipePdfUrl: dto.recipePdfUrl } : {}),
        ...(dto.harvestDate !== undefined ? { harvestDate: dto.harvestDate } : {}),
        ...(dto.harvestWindowStart !== undefined ? { harvestWindowStart: dto.harvestWindowStart } : {}),
        ...(dto.harvestWindowEnd !== undefined ? { harvestWindowEnd: dto.harvestWindowEnd } : {}),
        ...(dto.isSeasonal !== undefined ? { isSeasonal: dto.isSeasonal } : {}),
        ...(dto.seasonStartMonth !== undefined ? { seasonStartMonth: dto.seasonStartMonth } : {}),
        ...(dto.seasonEndMonth !== undefined ? { seasonEndMonth: dto.seasonEndMonth } : {}),
        ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
        ...(dto.minOrderQty !== undefined ? { minOrderQty: dto.minOrderQty } : {}),
        ...(dto.maxOrderQty !== undefined ? { maxOrderQty: dto.maxOrderQty } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      });
    } catch (err) {
      mapUniqueConstraintError(err);
    }
  },

  async deleteOwnProduct(userId: string, role: Role, productId: string) {
    ensureProducer(role);

    const producerProfile = await productRepository.findProducerProfileByUserId(userId);
    if (!producerProfile) {
      throw new NotFoundError('Producer profile');
    }

    const existing = await productRepository.findOwnProductById(producerProfile.id, productId);
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Product');
    }

    return productRepository.softDeleteOwnProduct(existing.id);
  },

  async listPublicProducts(query: ListPublicProductsQueryDto, viewer?: { id: string; role: Role }) {
    if (query.categoryId) {
      const category = await productRepository.findCategoryById(query.categoryId);
      if (!category) {
        throw new BadRequestError('Invalid categoryId');
      }
    }
    if (query.categorySlug) {
      const category = await productRepository.findCategoryBySlug(query.categorySlug);
      if (!category) {
        throw new BadRequestError('Invalid categorySlug');
      }
    }

    const [items, total] = await productRepository.listPublicProducts({
      q: query.q,
      categoryId: query.categoryId,
      categorySlug: query.categorySlug,
      wilaya: query.wilaya,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      buyerLat: query.buyerLat,
      buyerLng: query.buyerLng,
      inStockOnly: query.inStockOnly,
      onlyOffers: query.onlyOffers,
      onlyFavoriteProducers: query.onlyFavoriteProducers,
      tags: query.tags,
      limit: query.limit,
      offset: query.offset,
      sort: query.sort,
      viewerBuyerId: viewer?.role === 'BUYER' ? viewer.id : undefined,
    });

    return {
      items,
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + items.length < total,
      distanceSortNote:
        query.sort === 'distance_asc'
          ? 'MVP distance sort computed in memory from current result set; producers without coordinates are ranked last.'
          : undefined,
    };
  },

  async getPublicProductBySlug(slug: string, viewer?: { id: string; role: Role }) {
    const product = await productRepository.findPublicProductBySlug(
      slug,
      viewer?.role === 'BUYER' ? viewer.id : undefined,
    );
    if (!product) {
      throw new NotFoundError('Product');
    }
    return product;
  },

  async listOwnProductLogs(userId: string, role: Role, productId: string) {
    ensureProducer(role);
    const producerProfile = await productRepository.findProducerProfileByUserId(userId);
    if (!producerProfile) {
      throw new NotFoundError('Producer profile');
    }
    const product = await productRepository.findOwnProductById(producerProfile.id, productId);
    if (!product || product.deletedAt) {
      throw new NotFoundError('Product');
    }
    return productRepository.listOwnProductLogs(product.id);
  },

  async createOwnProductLog(userId: string, role: Role, productId: string, dto: CreateProductLogDto) {
    ensureProducer(role);
    const producerProfile = await productRepository.findProducerProfileByUserId(userId);
    if (!producerProfile) {
      throw new NotFoundError('Producer profile');
    }
    const product = await productRepository.findOwnProductById(producerProfile.id, productId);
    if (!product || product.deletedAt) {
      throw new NotFoundError('Product');
    }
    return productRepository.createOwnProductLog({
      productId: product.id,
      type: dto.type,
      note: dto.note,
      happenedAt: dto.happenedAt,
      createdBy: userId,
    });
  },
};
