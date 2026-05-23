import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/modules/products/product.repository', () => ({
  productRepository: {
    findProducerProfileByUserId: vi.fn(),
    findOwnProductById: vi.fn(),
    findCategoryById: vi.fn(),
    updateOwnProduct: vi.fn(),
  },
}));

import { productRepository } from '../../src/modules/products/product.repository';
import { productService } from '../../src/modules/products/product.service';

const mockedRepo = vi.mocked(productRepository);

describe('productService updateOwnProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes nulls through so edit flow can clear nullable product fields', async () => {
    mockedRepo.findProducerProfileByUserId.mockResolvedValue({
      id: 'producer-1',
      userId: 'user-1',
      verificationStatus: 'APPROVED',
    } as never);
    mockedRepo.findOwnProductById.mockResolvedValue({
      id: 'product-1',
      producerId: 'producer-1',
      categoryId: 'category-1',
      title: { en: 'Tomatoes' },
      description: { en: 'Fresh' },
      slug: 'tomatoes',
      price: 100,
      currency: 'DZD',
      unit: 'KG',
      stock: 10,
      minOrderQty: 1,
      maxOrderQty: 10,
      status: 'DRAFT',
      tags: ['fresh'],
      deletedAt: null,
    } as never);
    mockedRepo.updateOwnProduct.mockResolvedValue({ id: 'product-1' } as never);

    await productService.updateOwnProduct('user-1', 'PRODUCER', 'product-1', {
      categoryId: null,
      recipePdfUrl: null,
      harvestDate: null,
      harvestWindowStart: null,
      harvestWindowEnd: null,
      seasonStartMonth: null,
      seasonEndMonth: null,
    });

    expect(mockedRepo.updateOwnProduct).toHaveBeenCalledWith(
      'product-1',
      expect.objectContaining({
        categoryId: null,
        recipePdfUrl: null,
        harvestDate: null,
        harvestWindowStart: null,
        harvestWindowEnd: null,
        seasonStartMonth: null,
        seasonEndMonth: null,
      }),
    );
  });
});
