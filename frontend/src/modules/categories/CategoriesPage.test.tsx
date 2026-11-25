import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/services/api';
import { PreferencesProvider } from '@/shared/context/PreferencesContext';
import type { Category } from '@/types/finance';
import { CategoriesPage } from './CategoriesPage';

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Alimentación', type: 'EXPENSE' },
  { id: 'cat-2', name: 'Ocio futuro', type: 'EXPENSE' },
];

describe('CategoriesPage', () => {
  it('shows summary table by default, disables delete for in-use categories, and toggles to cards view', async () => {
    vi.spyOn(api, 'exchangeRates').mockResolvedValue({
      base: 'PEN',
      rates: { PEN: 1, USD: 0.293, EUR: 0.27, MXN: 5.4 },
      updatedAt: '2026-11-18T00:00:00.000Z',
      source: 'open-er-api',
      stale: false,
    });
    vi.spyOn(api, 'summary').mockResolvedValue({
      from: null,
      to: null,
      totalIncome: 0,
      totalExpense: 300,
      balance: -300,
      netSavings: -300,
      savingsRate: 0,
      byCategory: [
        { categoryId: 'cat-1', categoryName: 'Alimentación', type: 'EXPENSE', total: 300, count: 3 },
      ],
    });

    render(
      <PreferencesProvider>
        <TooltipProvider>
          <MemoryRouter>
            <CategoriesPage
              categories={MOCK_CATEGORIES}
              refreshKey={0}
              onEdit={vi.fn()}
              onChanged={vi.fn()}
            />
          </MemoryRouter>
        </TooltipProvider>
      </PreferencesProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: '3' })).toHaveAttribute(
        'href',
        '/movements?categoryId=cat-1',
      );
    });

    // Peso (100%) y Promedio (S/ 100.00) visibles en Vista Resumida
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/100\.00/)).toBeInTheDocument();

    // Eliminar deshabilitado en categoría con movimientos, habilitado en la vacía
    expect(screen.getByRole('button', { name: 'Eliminar Alimentación' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminar Ocio futuro' })).toBeEnabled();

    // Cambiar a vista Tarjetas
    fireEvent.click(screen.getByRole('radio', { name: 'Vista en tarjetas' }));
    expect(screen.getByRole('link', { name: /Ver movimientos del rubro/i })).toHaveAttribute(
      'href',
      '/movements?categoryId=cat-1',
    );
  });
});
