import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '@/services/api';
import { AuthProvider } from '@/shared/context/AuthContext';
import { AuthPage } from './AuthPage';

describe('AuthPage', () => {
  it('renders login/register tabs and triggers demo login when clicking demo button', async () => {
    vi.spyOn(api, 'me').mockRejectedValue(new Error('No autenticado'));
    const loginSpy = vi.spyOn(api, 'login').mockResolvedValue({
      user: {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Usuario Demo',
        email: 'demo@finanza.local',
        createdAt: '2026-11-18T00:00:00.000Z',
      },
    });

    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>,
    );

    const demoBtn = screen.getByRole('button', { name: /Entrar con usuario demo/i });
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        email: 'demo@finanza.local',
        password: 'Demo1234!',
      });
    });
  });
});
