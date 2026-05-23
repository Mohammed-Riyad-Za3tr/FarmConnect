import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CartPage } from '../src/features/cart/pages/CartPage';

const { navigateMock, useCartMock, usePublicProductMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useCartMock: vi.fn(),
  usePublicProductMock: vi.fn(),
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../src/features/cart/hooks/useCart', () => ({
  useCart: useCartMock,
  useUpdateCartItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveCartItem: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useClearCart: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../src/features/products/hooks/useProducts', () => ({
  usePublicProduct: usePublicProductMock,
}));

vi.mock('../src/features/products/components/ProductCard', () => ({
  ProductCard: ({ product }: { product: { slug: string } }) => <div>{product.slug}</div>,
}));

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePublicProductMock.mockReturnValue({ data: undefined });
  });

  it('calls the suggestions query hook even while cart data is still loading', () => {
    useCartMock.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    });

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>,
    );

    expect(usePublicProductMock).toHaveBeenCalledWith('');
    expect(screen.getByText('cart.loading')).toBeInTheDocument();
  });
});
