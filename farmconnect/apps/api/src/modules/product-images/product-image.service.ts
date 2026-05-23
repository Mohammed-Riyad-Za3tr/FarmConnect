import type { Role } from '@prisma/client';

import { ForbiddenError, NotFoundError } from '../../core/errors';
import { imageStorageProvider } from './image-storage.service';
import { productImageRepository } from './product-image.repository';
import type { CreateProductImageDto, UpdateProductImageDto } from './product-image.schemas';

function ensureProducer(role: Role): void {
  if (role !== 'PRODUCER') {
    throw new ForbiddenError('Only producers can manage product images');
  }
}

export const productImageService = {
  async addImageToOwnProduct(
    userId: string,
    role: Role,
    productId: string,
    dto: CreateProductImageDto,
  ) {
    ensureProducer(role);

    const producerProfile = await productImageRepository.findProducerProfileByUserId(userId);
    if (!producerProfile) {
      throw new NotFoundError('Producer profile');
    }

    const product = await productImageRepository.findOwnProductById(producerProfile.id, productId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    const upload = await imageStorageProvider.upload({
      sourceUrl: dto.sourceUrl,
      productId: product.id,
      producerId: producerProfile.id,
    });

    return productImageRepository.createProductImage({
      productId: product.id,
      url: upload.url,
      altText: dto.altText,
      position: dto.position,
    });
  },

  async listImagesForOwnProduct(userId: string, role: Role, productId: string) {
    ensureProducer(role);

    const producerProfile = await productImageRepository.findProducerProfileByUserId(userId);
    if (!producerProfile) {
      throw new NotFoundError('Producer profile');
    }

    const product = await productImageRepository.findOwnProductById(producerProfile.id, productId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    return productImageRepository.listProductImages(product.id);
  },

  async updateImageForOwnProduct(
    userId: string,
    role: Role,
    productId: string,
    imageId: string,
    dto: UpdateProductImageDto,
  ) {
    ensureProducer(role);

    const producerProfile = await productImageRepository.findProducerProfileByUserId(userId);
    if (!producerProfile) {
      throw new NotFoundError('Producer profile');
    }

    const product = await productImageRepository.findOwnProductById(producerProfile.id, productId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    const image = await productImageRepository.findProductImageById(imageId);
    if (!image || image.productId !== product.id) {
      throw new NotFoundError('Product image');
    }

    return productImageRepository.updateProductImage(image.id, {
      ...(dto.altText !== undefined ? { altText: dto.altText } : {}),
      ...(dto.position !== undefined ? { position: dto.position } : {}),
    });
  },

  async deleteImageForOwnProduct(userId: string, role: Role, productId: string, imageId: string) {
    ensureProducer(role);

    const producerProfile = await productImageRepository.findProducerProfileByUserId(userId);
    if (!producerProfile) {
      throw new NotFoundError('Producer profile');
    }

    const product = await productImageRepository.findOwnProductById(producerProfile.id, productId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    const image = await productImageRepository.findProductImageById(imageId);
    if (!image || image.productId !== product.id) {
      throw new NotFoundError('Product image');
    }

    return productImageRepository.deleteProductImage(image.id);
  },
};
