import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CheckoutPage } from '../src/features/orders/pages/CheckoutPage';

const {
  navigateMock,
  toastSuccessMock,
  toastErrorMock,
  checkoutMutateMock,
  createIntentMutateMock,
  usePublicProductMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  checkoutMutateMock: vi.fn(),
  createIntentMutateMock: vi.fn(),
  usePublicProductMock: vi.fn(),
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string, vars?: Record<string, string>) => (vars?.provider ? `${key}:${vars.provider}` : key) }),
  };
});

vi.mock('react-hot-toast', () => ({
  default: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

vi.mock('../src/features/cart/hooks/useCart', () => ({
  useCart: () => ({
    isLoading: false,
    isError: false,
    data: {
      items: [
        {
          id: 'item-1',
          quantity: 2,
          lineTotal: 400,
          product: { slug: 'tomatoes', currency: 'DZD' },
        },
      ],
      summary: {
        subtotal: 400,
        currency: 'DZD',
        itemsCount: 2,
      },
    },
  }),
}));

vi.mock('../src/features/orders/hooks/useOrders', () => ({
  useCheckoutFromCart: () => ({
    mutateAsync: checkoutMutateMock,
    isPending: false,
  }),
  useCreatePaymentIntent: () => ({
    mutateAsync: createIntentMutateMock,
    isPending: false,
  }),
}));

vi.mock('../src/features/products/hooks/useProducts', () => ({
  usePublicProduct: usePublicProductMock,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePublicProductMock.mockReturnValue({ data: undefined });
  });

  it('places order and initiates payment with selected provider', async () => {
    checkoutMutateMock.mockResolvedValue({ id: 'order-101' });
    createIntentMutateMock.mockResolvedValue({
      alreadyPaid: false,
      orderId: 'order-101',
      orderPaymentStatus: 'PENDING',
      payment: null,
      intent: {
        provider: 'STRIPE',
        gatewayRef: 'pi_1',
        status: 'PENDING',
        raw: {},
      },
    });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'orders.placeAndContinue' }));

    await waitFor(() => {
      expect(checkoutMutateMock).toHaveBeenCalled();
    });

    expect(createIntentMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-101',
        payload: expect.objectContaining({ provider: 'BARIDIMOB' }),
      }),
    );
    expect(navigateMock).toHaveBeenCalledWith('/dashboard/orders/order-101');
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it('does not send addressId for pickup checkout', async () => {
    checkoutMutateMock.mockResolvedValue({ id: 'order-303' });
    createIntentMutateMock.mockResolvedValue({
      alreadyPaid: false,
      orderId: 'order-303',
      orderPaymentStatus: 'PAID',
      payment: null,
      intent: {
        provider: 'BARIDIMOB',
        gatewayRef: 'baridi_303',
        status: 'REQUIRES_ACTION',
        raw: {},
      },
    });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'orders.placeAndContinue' }));

    await waitFor(() => {
      expect(checkoutMutateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          deliveryMethod: 'PICKUP',
          addressId: undefined,
        }),
      );
    });
  });

  it('falls back to BARIDIMOB when Stripe is unavailable', async () => {
    checkoutMutateMock.mockResolvedValue({ id: 'order-202' });
    createIntentMutateMock
      .mockRejectedValueOnce({ response: { status: 503 } })
      .mockResolvedValueOnce({
        alreadyPaid: false,
        orderId: 'order-202',
        orderPaymentStatus: 'PAID',
        payment: null,
        intent: {
          provider: 'BARIDIMOB',
          gatewayRef: 'baridi_1',
          status: 'REQUIRES_ACTION',
          raw: {},
        },
      });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Stripe/ }));
    fireEvent.click(screen.getByRole('button', { name: 'orders.placeAndContinue' }));

    await waitFor(() => {
      expect(createIntentMutateMock).toHaveBeenCalledTimes(2);
    });

    expect(createIntentMutateMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        orderId: 'order-202',
        payload: expect.objectContaining({ provider: 'BARIDIMOB' }),
      }),
    );
    expect(toastErrorMock).toHaveBeenCalledWith('orders.stripeUnavailableSwitching');
  });
});
