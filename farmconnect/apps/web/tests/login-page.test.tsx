import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginPage } from '../src/features/auth/pages/LoginPage';

const {
  navigateMock,
  setAuthMock,
  toastSuccessMock,
  toastErrorMock,
  loginApiMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  setAuthMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  loginApiMock: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

vi.mock('../src/features/auth/api/auth.api', () => ({
  loginApi: loginApiMock,
}));

vi.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: () => ({ setAuth: setAuthMock }),
  roleHomePath: () => '/dashboard',
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ state: null }),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation errors when required fields are empty', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'auth.login' }));

    expect(await screen.findByText('auth.emailRequired')).toBeInTheDocument();
    expect(await screen.findByText('auth.passwordRequired')).toBeInTheDocument();
    expect(loginApiMock).not.toHaveBeenCalled();
  });

  it('logs in and redirects to role home path', async () => {
    loginApiMock.mockResolvedValue({
      user: {
        id: 'u1',
        email: 'buyer@example.com',
        fullName: 'Buyer',
        role: 'BUYER',
        status: 'ACTIVE',
      },
      accessToken: 'access-1',
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('auth.email'), {
      target: { value: ' buyer@example.com ' },
    });
    fireEvent.change(screen.getByLabelText('auth.password'), {
      target: { value: 'StrongPass1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'auth.login' }));

    await waitFor(() => {
      expect(loginApiMock).toHaveBeenCalledWith({
        email: 'buyer@example.com',
        password: 'StrongPass1',
      });
    });

    expect(setAuthMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'u1' }),
      'access-1',
    );
    expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
    expect(toastSuccessMock).toHaveBeenCalledWith('auth.loggedInSuccessfully');
  });
});
