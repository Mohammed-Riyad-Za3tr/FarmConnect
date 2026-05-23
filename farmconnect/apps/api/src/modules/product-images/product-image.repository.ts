import { prisma } from '../../prisma/client';

const producerProfileSelect = {
  id: true,
  userId: true,
} as const;

const imageSelect = {
  id: true,
  productId: true,
  url: true,
  altText: true,
  position: true,
  createdAt: true,
} as const;

export const productImageRepository = {
  findProducerProfileByUserId(userId: string) {
    return prisma.producerProfile.findUnique({
      where: { userId },
      select: producerProfileSelect,
    });
  },

  findOwnProductById(producerId: string, productId: string) {
    return prisma.product.findFirst({
      where: {
        id: productId,
        producerId,
        deletedAt: null,
      },
      select: {
        id: true,
        producerId: true,
      },
    });
  },

  createProductImage(data: { productId: string; url: string; altText?: string; position: number }) {
    return prisma.productImage.create({
      data,
      select: imageSelect,
    });
  },

  listProductImages(productId: string) {
    return prisma.productImage.findMany({
      where: { productId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: imageSelect,
    });
  },

  findProductImageById(imageId: string) {
    return prisma.productImage.findUnique({
      where: { id: imageId },
      select: imageSelect,
    });
  },

  updateProductImage(imageId: string, data: { altText?: string | null; position?: number }) {
    return prisma.productImage.update({
      where: { id: imageId },
      data,
      select: imageSelect,
    });
  },

  deleteProductImage(imageId: string) {
    return prisma.productImage.delete({
      where: { id: imageId },
      select: imageSelect,
    });
  },
};
