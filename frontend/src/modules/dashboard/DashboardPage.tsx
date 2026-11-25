import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Loader2, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { DateRangeBar } from '@/shared/components/DateRangeBar';
import { DashboardSkeleton, ErrorState } from '@/shared/components/FeedbackStates';
import { KpiCard } from '@/shared/components/KpiCard';
import { usePreferences } from '@/shared/context/PreferencesContext';
import { monthStart, today } from '@/shared/utils/format';
import { useAnimatedNumber } from '@/shared/utils/useAnimatedNumber';
import { useCachedQuery } from '@/shared/utils/useCachedQuery';
import type { Category, MoneyType, Summary, Transaction, TrendResponse } from '@/types/finance';
import { DashboardCharts } from './components/DashboardCharts';
import { RecentAndGoalSection } from './components/RecentAndGoalSection';

function formatDeltaBadge(delta: number | null | undefined): string | undefined {
  if (delta === null || delta === undefined) return undefined;
  return `${delta > 0 ? '+' : ''}${delta}% vs. anterior`;
}

interface DashboardBundle {
  summary: Summary;
  trend: TrendResponse;
  recent: Transaction[];
}

export function DashboardPage({
  categories,
  refreshKey,
  onAddMovement,
}: {
  categories: Category[];
  refreshKey: number;
  onAddMovement: () => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const from = searchParams.get('from') || monthStart();
  const to = searchParams.get('to') || today();

  const { prefs, formatMoney } = usePreferences();
  const [donutKind, setDonutKind] = useState<MoneyType>('EXPENSE');

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])) as Record<string, Category>,
    [categories],
  );

  const { data, isInitialLoading, isFetching, error, retry } = useCachedQuery<DashboardBundle>(
    `dashboard:${from}:${to}`,
    async () => {
      const [summary, trend, list] = await Promise.all([
        api.summary(from, to, 'prev'),
        api.trend(from, to, 'auto'),
        api.transactions({ from, to, limit: 6, page: 1 }),
      ]);
      return { summary, trend, recent: list.items };
    },
    refreshKey,
  );

  const updateRange = (next: { from: string; to: string }) => {
    const p = new URLSearchParams(searchParams);
    p.set('from', next.from);
    p.set('to', next.to);
    setSearchParams(p, { replace: true });
  };

  const summary = data?.summary ?? null;
  const animIncome = useAnimatedNumber(summary?.totalIncome ?? 0);
  const animExpense = useAnimatedNumber(summary?.totalExpense ?? 0);
  const animSavings = useAnimatedNumber(summary?.netSavings ?? 0);
  const animBalance = useAnimatedNumber(summary?.realAvailable ?? summary?.balance ?? 0);

  return (
    <div className="flex flex-col gap-5">
      <DateRangeBar
        from={from}
        to={to}
        onChange={updateRange}
        extra={
          <div className="flex items-center gap-2">
            {isFetching ? (
              <span
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Loader2 className="size-3.5 animate-spin" />
                Actualizando
              </span>
            ) : null}
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/reports?from=${from}&to=${to}`}>
                Ver análisis detallado
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        }
      />

      {isInitialLoading ? (
        <DashboardSkeleton />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={retry} />
      ) : summary && data ? (
        <div
          className={cn(
            'flex flex-col gap-5 transition-opacity duration-200 ease-out animate-in fade-in-0',
            isFetching ? 'opacity-80' : 'opacity-100',
          )}
        >
          {error ? <ErrorState message={error} onRetry={retry} /> : null}
          <section
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Indicadores principales"
          >
            <KpiCard
              title="Ingresos"
              value={formatMoney(animIncome)}
              subtitle="Total recibido en el período"
              icon={TrendingUp}
              tone="income"
              to={`/movements?type=INCOME&from=${from}&to=${to}`}
              badge={formatDeltaBadge(summary.comparison?.incomeDeltaPct)}
              badgeTone={(summary.comparison?.incomeDeltaPct ?? 0) >= 0 ? 'positive' : 'negative'}
            />
            <KpiCard
              title="Egresos"
              value={formatMoney(animExpense)}
              subtitle="Total gastado en el período"
              icon={TrendingDown}
              tone="expense"
              to={`/movements?type=EXPENSE&from=${from}&to=${to}`}
              badge={formatDeltaBadge(summary.comparison?.expenseDeltaPct)}
              badgeTone={(summary.comparison?.expenseDeltaPct ?? 0) <= 0 ? 'positive' : 'negative'}
            />
            <KpiCard
              title="Ahorro del período"
              value={formatMoney(animSavings)}
              subtitle={`Meta personal: ${prefs.savingsGoalPct}%`}
              icon={PiggyBank}
              tone="savings"
              to={`/reports?from=${from}&to=${to}`}
              badge={
                summary.totalIncome > 0
                  ? summary.netSavings >= 0
                    ? `Ahorraste ${summary.savingsRate}%`
                    : `Déficit ${Math.abs(summary.savingsRate)}%`
                  : 'Sin ingresos'
              }
              badgeTone={
                summary.netSavings > 0
                  ? 'positive'
                  : summary.netSavings < 0
                    ? 'negative'
                    : 'neutral'
              }
            />
            <KpiCard
              title="Disponible real"
              value={formatMoney(animBalance)}
              subtitle={
                (summary.allocatedSavings ?? 0) > 0
                  ? `Apartado en metas: ${formatMoney(summary.allocatedSavings ?? 0)}`
                  : 'Ingresos menos egresos'
              }
              icon={Wallet}
              tone="primary"
              to="/savings"
              badge={formatDeltaBadge(summary.comparison?.savingsDeltaPct)}
              badgeTone={(summary.comparison?.savingsDeltaPct ?? 0) >= 0 ? 'positive' : 'negative'}
            />
          </section>

          <DashboardCharts
            summary={summary}
            trend={data.trend}
            donutKind={donutKind}
            onDonutKindChange={setDonutKind}
          />

          <RecentAndGoalSection
            summary={summary}
            recent={data.recent}
            categoryMap={categoryMap}
            from={from}
            to={to}
            onAddMovement={onAddMovement}
          />
        </div>
      ) : null}
    </div>
  );
}
