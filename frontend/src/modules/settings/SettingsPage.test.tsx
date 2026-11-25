import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { api } from '@/services/api';
import { PreferencesProvider } from '@/shared/context/PreferencesContext';
import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  it('updates theme, quadrant border/shadow attributes, and interactive color picker, then resets defaults', async () => {
    vi.spyOn(api, 'exchangeRates').mockResolvedValue({
      base: 'PEN',
      rates: { PEN: 1, USD: 0.2933, EUR: 0.27, MXN: 5.85 },
      updatedAt: '2026-11-18T00:00:00.000Z',
      source: 'open-er-api',
      stale: false,
    });

    render(
      <PreferencesProvider>
        <SettingsPage />
      </PreferencesProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/open-er-api/i)).toBeInTheDocument();
    });

    // Cambiar borde de cuadrantes y sombra
    fireEvent.click(screen.getByRole('radio', { name: 'Marcado' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Elevado' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Recto' }));

    expect(document.documentElement.dataset.borderStyle).toBe('strong');
    expect(document.documentElement.dataset.cardShadow).toBe('elevated');
    expect(document.documentElement.style.getPropertyValue('--radius')).toBe('0.25rem');

    // Abrir selector visual de color principal y elegir una muestra
    fireEvent.click(
      screen.getByRole('button', { name: /Abrir selector visual para Color principal/i }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Color #10b981' }));
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#10b981');

    // Restaurar valores por defecto
    fireEvent.click(screen.getByRole('button', { name: /Restaurar valores por defecto/i }));
    expect(document.documentElement.dataset.borderStyle).toBe('default');
    expect(document.documentElement.dataset.cardShadow).toBe('soft');
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('#5b5ce2');
  });
});
