import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProductForm } from '../src/features/products/components/ProductForm';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('ProductForm edit mode', () => {
  it('submits nulls for cleared nullable fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ProductForm
        mode="edit"
        categories={[
          {
            id: 'category-1',
            slug: 'vegetables',
            nameEn: 'Vegetables',
            nameAr: 'Vegetables',
            parentId: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ]}
        initial={{
          categoryId: 'category-1',
          title: { en: 'Tomatoes' },
          description: { en: 'Fresh tomatoes' },
          slug: 'tomatoes',
          price: 150,
          currency: 'DZD',
          unit: 'KG',
          recipePdfUrl: 'https://example.com/recipe.pdf',
          harvestDate: '2026-05-01',
          harvestWindowStart: '2026-05-01',
          harvestWindowEnd: '2026-05-10',
          isSeasonal: true,
          seasonStartMonth: 5,
          seasonEndMonth: 7,
          stock: 20,
          minOrderQty: 1,
          maxOrderQty: 10,
          status: 'DRAFT',
          tags: [],
        }}
        submitLabel="Save"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('products.formCategory'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Recipe PDF URL'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Harvest date'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Harvest window start'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Harvest window end'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Season start month (1-12)'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Season end month (1-12)'), { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
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
});
