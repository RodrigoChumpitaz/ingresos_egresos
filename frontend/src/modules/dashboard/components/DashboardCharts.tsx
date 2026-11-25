import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { EmptyState } from '@/shared/components/FeedbackStates';
import { COLORS } from '@/shared/constants/colors';
import { usePreferences } from '@/shared/context/PreferencesContext';
import { dateLabel, formatCurrency } from '@/shared/utils/format';
import type { CurrencyCode, MoneyType, Summary, TrendResponse } from '@/types/finance';

interface TrendChartPoint {
  label: string;
  start: string;
  end: string;
  income: number;
  expense: number;
  net: number;
}

function CashflowTooltip({
  active,
  payload,
  currency,
  incomeColor,
  expenseColor,
  granularity,
}: {
  active?: boolean;
  payload?: Array<{ payload?: TrendChartPoint }>;
  currency: CurrencyCode;
  incomeColor: string;
  expenseColor: string;
  granularity: 'day' | 'week' | 'month';
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  const hasIncome = point.income > 0;
  const hasExpense = point.expense > 0;
  const hasActivity = hasIncome || hasExpense;
  const title =
    granularity === 'day'
      ? dateLabel(`${point.start}T12:00:00Z`)
      : `${dateLabel(`${point.start}T12:00:00Z`)} – ${dateLabel(`${point.end}T12:00:00Z`)}`;

  return (
    <div className="min-w-52 rounded-lg border bg-popover p-3 text-xs text-popover-foreground shadow-lg">
      <div className="mb-2 font-semibold">{title}</div>
      {hasActivity ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: incomeColor }} />
              Ingresos
            </span>
            <span className="font-semibold tabular-nums">
              {hasIncome ? formatCurrency(point.income, currency) : 'Sin ingresos'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: expenseColor }} />
              Egresos
            </span>
            <span className="font-semibold tabular-nums">
              {hasExpense ? formatCurrency(point.expense, currency) : 'Sin egresos'}
            </span>
          </div>
          <Separator className="my-1" />
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Balance del día</span>
            <span
              className={`font-bold tabular-nums ${
                point.net >= 0 ? 'text-income' : 'text-expense'
              }`}
            >
              {point.net > 0 ? '+' : ''}
              {formatCurrency(point.net, currency)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground">Sin movimientos registrados en esta fecha.</div>
      )}
    </div>
  );
}

function CategoryDonutTooltip({
  active,
  payload,
  total,
  currency,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: { categoryName: string; displayTotal: number; count: number; fill?: string };
    color?: string;
  }>;
  total: number;
  currency: CurrencyCode;
}) {
  const entry = payload?.[0]?.payload;
  if (!active || !entry) return null;
  const pct = total > 0 ? Math.round((entry.displayTotal / total) * 100) : 0;

  return (
    <div className="min-w-44 rounded-lg border bg-popover p-2.5 text-xs text-popover-foreground shadow-lg">
      <div className="mb-1 flex items-center gap-1.5 font-semibold">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: payload?.[0]?.color || entry.fill }}
        />
        {entry.categoryName}
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">
          {entry.count} {entry.count === 1 ? 'movimiento' : 'movimientos'} ({pct}%)
        </span>
        <span className="font-bold tabular-nums">
          {formatCurrency(entry.displayTotal, currency)}
        </span>
      </div>
    </div>
  );
}

function ActiveDot(props: {
  cx?: number;
  cy?: number;
  value?: number;
  fill: string;
}) {
  const { cx, cy, value, fill } = props;
  if (typeof value !== 'number' || value <= 0 || cx === undefined || cy === undefined) {
    return <g />;
  }
  return <circle cx={cx} cy={cy} r={4.5} fill={fill} stroke="#ffffff" strokeWidth={1.5} />;
}

export function DashboardCharts({
  summary,
  trend,
  donutKind,
  onDonutKindChange,
}: {
  summary: Summary;
  trend: TrendResponse | null;
  donutKind: MoneyType;
  onDonutKindChange: (kind: MoneyType) => void;
}) {
  const [chartMode, setChartMode] = useState<'bars' | 'line'>('bars');
  const { prefs, convertFromBase, formatCompact, formatMoney } = usePreferences();

  const chartConfig = useMemo<ChartConfig>(
    () => ({
      income: { label: 'Ingresos', color: prefs.colors.income },
      expense: { label: 'Egresos', color: prefs.colors.expense },
    }),
    [prefs.colors.income, prefs.colors.expense],
  );

  const trendData = useMemo<TrendChartPoint[]>(
    () =>
      (trend?.points ?? []).map((pt) => ({
        label: pt.label,
        start: pt.start,
        end: pt.end,
        income: convertFromBase(pt.totalIncome),
        expense: convertFromBase(pt.totalExpense),
        net: convertFromBase(pt.netSavings),
      })),
    [trend, convertFromBase],
  );

  const breakdown = useMemo(
    () =>
      summary.byCategory
        .filter((x) => x.type === donutKind)
        .sort((a, b) => b.total - a.total),
    [summary, donutKind],
  );

  const breakdownTotal = donutKind === 'EXPENSE' ? summary.totalExpense : summary.totalIncome;
  const breakdownDisplayTotal = convertFromBase(breakdownTotal);

  const donutConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    breakdown.forEach((item, index) => {
      cfg[item.categoryId] = {
        label: item.categoryName,
        color: COLORS[index % COLORS.length],
      };
    });
    return cfg;
  }, [breakdown]);

  const granularity = trend?.granularity ?? 'day';
  const granularityLabel =
    granularity === 'day' ? 'día' : granularity === 'week' ? 'semana' : 'mes';

  const activeIncomeDays = trendData.filter((d) => d.income > 0).length;
  const activeExpenseDays = trendData.filter((d) => d.expense > 0).length;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-label="Gráficos financieros">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Movimiento financiero</CardTitle>
            <CardDescription>
              Por {granularityLabel} · {activeIncomeDays} con ingresos y {activeExpenseDays} con egresos
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: prefs.colors.income }}
                />
                Ingresos
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: prefs.colors.expense }}
                />
                Egresos
              </span>
            </div>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={chartMode}
              onValueChange={(v) => {
                if (v === 'bars' || v === 'line') setChartMode(v);
              }}
              aria-label="Tipo de gráfico"
            >
              <ToggleGroupItem value="bars" aria-label="Vista en barras">
                <BarChart2 className="size-3.5" />
                Barras
              </ToggleGroupItem>
              <ToggleGroupItem value="line" aria-label="Vista en línea">
                <TrendingUp className="size-3.5" />
                Línea
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>

        <CardContent>
          {trendData.length ? (
            <ChartContainer config={chartConfig} className="h-72 w-full">
              {chartMode === 'bars' ? (
                <BarChart data={trendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  {prefs.showChartGrid ? (
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  ) : null}
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(v: number) => formatCompact(v)}
                  />
                  <ChartTooltip
                    content={
                      <CashflowTooltip
                        currency={prefs.displayCurrency}
                        incomeColor={prefs.colors.income}
                        expenseColor={prefs.colors.expense}
                        granularity={granularity}
                      />
                    }
                  />
                  <Bar
                    dataKey="income"
                    name="Ingresos"
                    fill="var(--color-income)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                    animationDuration={420}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="expense"
                    name="Egresos"
                    fill="var(--color-expense)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                    animationDuration={420}
                    animationEasing="ease-out"
                  />
                </BarChart>
              ) : (
                <AreaChart data={trendData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashIncomeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="dashExpenseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    strokeOpacity={prefs.showChartGrid ? 1 : 0}
                  />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={(v: number) => formatCompact(v)}
                  />
                  <ChartTooltip
                    content={
                      <CashflowTooltip
                        currency={prefs.displayCurrency}
                        incomeColor={prefs.colors.income}
                        expenseColor={prefs.colors.expense}
                        granularity={granularity}
                      />
                    }
                  />
                  <Area
                    type="linear"
                    dataKey="income"
                    name="Ingresos"
                    stroke="var(--color-income)"
                    strokeWidth={2}
                    fill="url(#dashIncomeFill)"
                    animationDuration={420}
                    animationEasing="ease-out"
                    dot={(p) => (
                      <ActiveDot
                        key={`in-${p.index}`}
                        cx={p.cx}
                        cy={p.cy}
                        value={(p.payload as TrendChartPoint | undefined)?.income}
                        fill={prefs.colors.income}
                      />
                    )}
                  />
                  <Area
                    type="linear"
                    dataKey="expense"
                    name="Egresos"
                    stroke="var(--color-expense)"
                    strokeWidth={2}
                    fill="url(#dashExpenseFill)"
                    animationDuration={420}
                    animationEasing="ease-out"
                    dot={(p) => (
                      <ActiveDot
                        key={`ex-${p.index}`}
                        cx={p.cx}
                        cy={p.cy}
                        value={(p.payload as TrendChartPoint | undefined)?.expense}
                        fill={prefs.colors.expense}
                      />
                    )}
                  />
                </AreaChart>
              )}
            </ChartContainer>
          ) : (
            <EmptyState title="Sin datos en el período" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div>
            <CardTitle>
              {donutKind === 'EXPENSE' ? '¿En qué gastas?' : '¿De dónde ingresas?'}
            </CardTitle>
            <CardDescription>Distribución por categoría</CardDescription>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={donutKind}
            onValueChange={(v) => {
              if (v === 'INCOME' || v === 'EXPENSE') onDonutKindChange(v);
            }}
            className="grid w-full grid-cols-2"
          >
            <ToggleGroupItem value="EXPENSE">Egresos</ToggleGroupItem>
            <ToggleGroupItem value="INCOME">Ingresos</ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {breakdown.length ? (
            <>
              <div className="relative flex items-center justify-center">
                <ChartContainer config={donutConfig} className="relative z-10 h-52 w-full">
                  <PieChart>
                    <Pie
                      data={breakdown.map((b) => ({
                        ...b,
                        displayTotal: convertFromBase(b.total),
                      }))}
                      dataKey="displayTotal"
                      nameKey="categoryName"
                      innerRadius={60}
                      outerRadius={84}
                      paddingAngle={3}
                      stroke="none"
                      animationDuration={420}
                      animationEasing="ease-out"
                    >
                      {breakdown.map((item, idx) => (
                        <Cell key={item.categoryId} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      wrapperStyle={{ zIndex: 30 }}
                      content={
                        <CategoryDonutTooltip
                          total={breakdownDisplayTotal}
                          currency={prefs.displayCurrency}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center px-4 text-center">
                  <span className="text-[11px] text-muted-foreground">
                    {donutKind === 'EXPENSE' ? 'Total egresos' : 'Total ingresos'}
                  </span>
                  <span className="text-sm font-bold tabular-nums">
                    {formatMoney(breakdownTotal)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {breakdown.slice(0, 5).map((item, idx) => {
                  const pct =
                    breakdownTotal > 0 ? Math.round((item.total / breakdownTotal) * 100) : 0;
                  return (
                    <Link
                      key={item.categoryId}
                      to={`/movements?categoryId=${item.categoryId}`}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-200 hover:bg-muted"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="truncate">{item.categoryName}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 tabular-nums">
                        <span className="font-semibold">{formatMoney(item.total)}</span>
                        <span className="min-w-9 text-right text-xs text-muted-foreground">
                          ({pct}%)
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState
              title={donutKind === 'EXPENSE' ? 'Sin egresos' : 'Sin ingresos'}
              description="Registra un movimiento para ver el reparto por categoría."
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
