import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, PiggyBank, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { DateRangeBar } from '@/shared/components/DateRangeBar';
import {
  DashboardSkeleton,
  EmptyState,
  ErrorState,
  TypeBadge,
} from '@/shared/components/FeedbackStates';
import { KpiCard } from '@/shared/components/KpiCard';
import { COLORS } from '@/shared/constants/colors';
import { usePreferences } from '@/shared/context/PreferencesContext';
import { DATE_PRESETS } from '@/shared/utils/date-presets';
import {
  dateLabel,
  formatCurrency,
  today,
} from '@/shared/utils/format';
import { useCachedQuery } from '@/shared/utils/useCachedQuery';
import type { Category, Summary, TrendResponse } from '@/types/finance';

export function ReportsPage({
  categories,
  refreshKey,
}: {
  categories: Category[];
  refreshKey: number;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultRange = DATE_PRESETS[3].getRange(); // Últimos 90 días para análisis detallado
  const from = searchParams.get('from') || defaultRange.from;
  const to = searchParams.get('to') || defaultRange.to;

  const { prefs, convertFromBase, formatMoney, formatCompact } = usePreferences();

  const { data, isInitialLoading, isFetching, error, retry } = useCachedQuery<{
    summary: Summary;
    trend: TrendResponse;
  }>(
    `reports:${from}:${to}`,
    async () => {
      const [summary, trend] = await Promise.all([
        api.summary(from, to, 'prev'),
        api.trend(from, to, 'auto'),
      ]);
      return { summary, trend };
    },
    refreshKey,
  );

  const summary = data?.summary ?? null;
  const trend = data?.trend ?? null;

  const updateRange = (next: { from: string; to: string }) => {
    const p = new URLSearchParams(searchParams);
    p.set('from', next.from);
    p.set('to', next.to);
    setSearchParams(p, { replace: true });
  };

  const incomeRows = useMemo(
    () =>
      (summary?.byCategory ?? [])
        .filter((x) => x.type === 'INCOME')
        .sort((a, b) => b.total - a.total),
    [summary],
  );

  const expenseRows = useMemo(
    () =>
      (summary?.byCategory ?? [])
        .filter((x) => x.type === 'EXPENSE')
        .sort((a, b) => b.total - a.total),
    [summary],
  );

  const trendSeries = useMemo(
    () =>
      (trend?.points ?? []).map((pt) => ({
        label: pt.label,
        income: convertFromBase(pt.totalIncome),
        expense: convertFromBase(pt.totalExpense),
        netSavings: convertFromBase(pt.netSavings),
        savingsRate: pt.savingsRate,
      })),
    [trend, convertFromBase],
  );

  const barConfig = useMemo<ChartConfig>(
    () => ({
      income: { label: 'Ingresos', color: prefs.colors.income },
      expense: { label: 'Egresos', color: prefs.colors.expense },
    }),
    [prefs.colors.income, prefs.colors.expense],
  );

  const savingsConfig = useMemo<ChartConfig>(
    () => ({
      savingsRate: { label: 'Tasa de ahorro (%)', color: prefs.colors.savings },
    }),
    [prefs.colors.savings],
  );

  const downloadCSV = () => {
    if (!summary) return;
    const rows = [
      ['Categoría', 'Tipo', 'Movimientos', 'Total Base (PEN)', `Total (${prefs.displayCurrency})`],
      ...summary.byCategory.map((x) => [
        x.categoryName,
        x.type === 'INCOME' ? 'Ingreso' : 'Egreso',
        String(x.count),
        String(x.total),
        String(convertFromBase(x.total)),
      ]),
    ];
    const csv =
      '\ufeff' +
      rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-financiero-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Reporte CSV descargado');
  };

  return (
    <div className="flex flex-col gap-6">
      <DateRangeBar
        from={from}
        to={to}
        onChange={updateRange}
        extra={
          <Button variant="outline" size="sm" onClick={downloadCSV} disabled={!summary}>
            <Download data-icon="inline-start" />
            Exportar CSV
          </Button>
        }
      />

      {isInitialLoading ? (
        <DashboardSkeleton />
      ) : error && !summary ? (
        <ErrorState message={error} onRetry={retry} />
      ) : summary ? (
        <div
          className={cn(
            'flex flex-col gap-6 transition-opacity duration-200 ease-out',
            isFetching ? 'opacity-75' : 'opacity-100',
          )}
        >
          {error ? <ErrorState message={error} onRetry={retry} /> : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Ingresos acumulados"
              value={formatMoney(summary.totalIncome)}
              subtitle={
                summary.comparison
                  ? `Anterior: ${formatMoney(summary.comparison.totalIncome)}`
                  : 'Total ingresos'
              }
              icon={TrendingUp}
              tone="income"
              badge={
                summary.comparison?.incomeDeltaPct !== null &&
                summary.comparison?.incomeDeltaPct !== undefined
                  ? `${summary.comparison.incomeDeltaPct > 0 ? '+' : ''}${summary.comparison.incomeDeltaPct}%`
                  : undefined
              }
              badgeTone={(summary.comparison?.incomeDeltaPct ?? 0) >= 0 ? 'positive' : 'negative'}
            />
            <KpiCard
              title="Egresos acumulados"
              value={formatMoney(summary.totalExpense)}
              subtitle={
                summary.comparison
                  ? `Anterior: ${formatMoney(summary.comparison.totalExpense)}`
                  : 'Total egresos'
              }
              icon={TrendingDown}
              tone="expense"
              badge={
                summary.comparison?.expenseDeltaPct !== null &&
                summary.comparison?.expenseDeltaPct !== undefined
                  ? `${summary.comparison.expenseDeltaPct > 0 ? '+' : ''}${summary.comparison.expenseDeltaPct}%`
                  : undefined
              }
              badgeTone={(summary.comparison?.expenseDeltaPct ?? 0) <= 0 ? 'positive' : 'negative'}
            />
            <KpiCard
              title="Flujo neto (Ahorro)"
              value={formatMoney(summary.netSavings)}
              subtitle={
                summary.comparison
                  ? `Anterior: ${formatMoney(summary.comparison.netSavings)}`
                  : 'Ingresos - Egresos'
              }
              icon={Wallet}
              tone="primary"
              badge={
                summary.comparison?.savingsDeltaPct !== null &&
                summary.comparison?.savingsDeltaPct !== undefined
                  ? `${summary.comparison.savingsDeltaPct > 0 ? '+' : ''}${summary.comparison.savingsDeltaPct}%`
                  : undefined
              }
              badgeTone={(summary.comparison?.savingsDeltaPct ?? 0) >= 0 ? 'positive' : 'negative'}
            />
            <KpiCard
              title="Tasa de ahorro"
              value={`${summary.savingsRate}%`}
              subtitle={
                summary.comparison
                  ? `Anterior: ${summary.comparison.savingsRate}% · Meta: ${prefs.savingsGoalPct}%`
                  : `Meta: ${prefs.savingsGoalPct}%`
              }
              icon={PiggyBank}
              tone="savings"
              badge={summary.savingsRate >= prefs.savingsGoalPct ? 'Cumplida' : 'Bajo meta'}
              badgeTone={summary.savingsRate >= prefs.savingsGoalPct ? 'positive' : 'negative'}
            />
          </div>

          {summary.comparison ? (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm text-muted-foreground">
                <span>
                  Período comparado: <strong>{dateLabel(summary.comparison.previousFrom)}</strong> al{' '}
                  <strong>{dateLabel(summary.comparison.previousTo)}</strong>
                </span>
                <Badge variant="outline">Granularidad: {trend?.granularity ?? 'auto'}</Badge>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Comparativa Ingresos vs. Egresos</CardTitle>
                <CardDescription>Evolución por intervalo del período</CardDescription>
              </CardHeader>
              <CardContent>
                {trendSeries.length ? (
                  <ChartContainer config={barConfig} className="h-64 w-full">
                    <BarChart data={trendSeries}>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        strokeOpacity={prefs.showChartGrid ? 1 : 0}
                      />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={56}
                        tickFormatter={(v: number) => formatCompact(v)}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(val, name, item) => (
                              <div className="flex w-full items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                  <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  {name}
                                </span>
                                <span className="font-semibold tabular-nums">
                                  {formatCurrency(Number(val), prefs.displayCurrency)}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Bar dataKey="income" name="Ingresos" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Egresos" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <EmptyState title="Sin datos de tendencia" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolución de tasa de ahorro (%)</CardTitle>
                <CardDescription>
                  Porcentaje ahorrado en cada intervalo respecto a tu meta ({prefs.savingsGoalPct}%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trendSeries.length ? (
                  <ChartContainer config={savingsConfig} className="h-64 w-full">
                    <LineChart data={trendSeries}>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        strokeOpacity={prefs.showChartGrid ? 1 : 0}
                      />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `${v}%`} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(val, name, item) => (
                              <div className="flex w-full items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                  <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  {name}
                                </span>
                                <span className="font-semibold tabular-nums">{Number(val)}%</span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Line
                        type="linear"
                        dataKey="savingsRate"
                        name="Tasa de ahorro (%)"
                        stroke="var(--color-savingsRate)"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <EmptyState title="Sin datos de ahorro" />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoryBreakdownCard
              title="Ingresos por categoría"
              description="Fuentes de ingreso ordenadas por impacto"
              rows={incomeRows}
              total={summary.totalIncome}
              formatMoney={formatMoney}
            />
            <CategoryBreakdownCard
              title="Egresos por categoría"
              description="Rubros de gasto ordenados por impacto"
              rows={expenseRows}
              total={summary.totalExpense}
              formatMoney={formatMoney}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Detalle completo del período</CardTitle>
                <CardDescription>Resumen tabular de todas las categorías con actividad</CardDescription>
              </div>
              <Badge variant="secondary">{categories.length} categorías totales</Badge>
            </CardHeader>
            <CardContent>
              {summary.byCategory.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Movimientos</TableHead>
                      <TableHead>Participación</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.byCategory.map((row) => {
                      const baseTotal = row.type === 'INCOME' ? summary.totalIncome : summary.totalExpense;
                      const pct = baseTotal > 0 ? Math.round((row.total / baseTotal) * 1000) / 10 : 0;
                      return (
                        <TableRow key={row.categoryId}>
                          <TableCell className="font-medium">{row.categoryName}</TableCell>
                          <TableCell>
                            <TypeBadge type={row.type} />
                          </TableCell>
                          <TableCell className="tabular-nums">{row.count}</TableCell>
                          <TableCell className="tabular-nums">{pct}%</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatMoney(row.total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState title="Sin actividad en este período" />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function CategoryBreakdownCard({
  title,
  description,
  rows,
  total,
  formatMoney,
}: {
  title: string;
  description: string;
  rows: Summary['byCategory'];
  total: number;
  formatMoney: (n: number) => string;
}) {
  const max = rows[0]?.total ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rows.length ? (
          rows.map((row, idx) => {
            const share = total > 0 ? Math.round((row.total / total) * 100) : 0;
            const barValue = max > 0 ? Math.max(4, Math.round((row.total / max) * 100)) : 0;
            return (
              <div key={row.categoryId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {row.categoryName}{' '}
                    <span className="text-xs text-muted-foreground">({row.count})</span>
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatMoney(row.total)} · {share}%
                  </span>
                </div>
                <Progress
                  value={barValue}
                  style={{ '--primary': COLORS[idx % COLORS.length] } as React.CSSProperties}
                />
              </div>
            );
          })
        ) : (
          <EmptyState title="Sin registros en este período" />
        )}
      </CardContent>
    </Card>
  );
}
