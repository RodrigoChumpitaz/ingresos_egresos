import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { TrendingUp } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { KpiCard } from './KpiCard';

describe('KpiCard', () => {
  it('renders title, formatted value, badge, and wraps in an accessible link when `to` is set', () => {
    render(
      <MemoryRouter>
        <KpiCard
          title="Ingresos"
          value="S/ 4,052.50"
          subtitle="Total recibido"
          icon={TrendingUp}
          tone="income"
          badge="+12% vs. anterior"
          badgeTone="positive"
          to="/movements?type=INCOME"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText('S/ 4,052.50')).toBeInTheDocument();
    expect(screen.getByText('+12% vs. anterior')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/movements?type=INCOME');
  });
});
