import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/services/api';
import { PreferencesProvider } from '@/shared/context/PreferencesContext';
import { queryCache } from '@/shared/utils/query-cache';
import { SavingsPage } from './SavingsPage';

describe('SavingsPage', () => {
  it('renders savings goals, disables delete when balance > 0, and loads entry history on click', async () => {
    queryCache.clear();
    vi.spyOn(api, 'exchangeRates').mockResolvedValue({
      base: 'PEN',
      rates: { PEN: 1, USD: 0.2933, EUR: 0.27, MXN: 5.85 },
      updatedAt: '2026-11-18T00:00:00.000Z',
      source: 'open-er-api',
      stale: false,
    });
    vi.spyOn(api, 'savingsGoals').mockResolvedValue([
      {
        id: 'goal-1',
        name: 'Fondo de emergencia',
        targetAmount: 6000,
        currentAmount: 1850,
        createdAt: '2026-11-01T12:00:00.000Z',
        updatedAt: '2026-11-12T12:00:00.000Z',
      },
      {
        id: 'goal-2',
        name: 'Meta vacía',
        targetAmount: 1000,
        currentAmount: 0,
        createdAt: '2026-11-01T12:00:00.000Z',
        updatedAt: '2026-11-01T12:00:00.000Z',
      },
    ]);
    vi.spyOn(api, 'savingsEntries').mockResolvedValue([
      {
        id: 'entry-1',
        goalId: 'goal-1',
        type: 'CONTRIBUTION',
        amount: 650,
        note: 'Aporte mensual',
        date: '2026-11-12T12:00:00.000Z',
        createdAt: '2026-11-12T12:00:00.000Z',
      },
    ]);

    render(
      <PreferencesProvider>
        <TooltipProvider>
          <SavingsPage refreshKey={0} onChanged={vi.fn()} />
        </TooltipProvider>
      </PreferencesProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Fondo de emergencia')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Eliminar Fondo de emergencia' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminar Meta vacía' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Ver historial de Fondo de emergencia' }));
    await waitFor(() => {
      expect(screen.getByText('Aporte mensual')).toBeInTheDocument();
    });
  });
});
