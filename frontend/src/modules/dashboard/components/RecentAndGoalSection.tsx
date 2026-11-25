import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  PiggyBank,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, TypeBadge } from '@/shared/components/FeedbackStates';
import { usePreferences } from '@/shared/context/PreferencesContext';
import { dateLabel, formatCurrency } from '@/shared/utils/format';
import type { Category, Summary, Transaction } from '@/types/finance';

export function RecentAndGoalSection({
  summary,
  recent,
  categoryMap,
  from,
  to,
  onAddMovement,
}: {
  summary: Summary;
  recent: Transaction[];
  categoryMap: Record<string, Category>;
  from: string;
  to: string;
  onAddMovement: () => void;
}) {
  const { prefs, formatMoney } = usePreferences();

  const savingsRate = summary.savingsRate ?? 0;
  const goalProgress = Math.max(
    0,
    Math.min(100, Math.round((savingsRate / prefs.savingsGoalPct) * 100)),
  );
  const goalMet = savingsRate >= prefs.savingsGoalPct;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-label="Movimientos recientes y meta">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Movimientos recientes</CardTitle>
            <CardDescription>Últimas operaciones del período seleccionado</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/movements">
              Ver todos
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Movimiento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  const catName = categoryMap[tx.categoryId]?.name ?? 'Categoría eliminada';
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              isIncome
                                ? 'flex size-8 shrink-0 items-center justify-center rounded-full bg-income/10 text-income'
                                : 'flex size-8 shrink-0 items-center justify-center rounded-full bg-expense/10 text-expense'
                            }
                          >
                            {isIncome ? (
                              <ArrowDownLeft className="size-4" />
                            ) : (
                              <ArrowUpRight className="size-4" />
                            )}
                          </span>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium">
                              {tx.description || catName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {catName}
                              {tx.currency && tx.currency !== 'PEN' && tx.originalAmount
                                ? ` · ${formatCurrency(tx.originalAmount, tx.currency)} (TC ${tx.exchangeRate})`
                                : ''}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dateLabel(tx.date)}
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={tx.type} />
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold tabular-nums ${
                          isIncome ? 'text-income' : 'text-expense'
                        }`}
                      >
                        {isIncome ? '+' : '−'}
                        {formatMoney(tx.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="Sin movimientos en este período"
              description="Empieza registrando tu primer ingreso o gasto."
              action={<Button onClick={onAddMovement}>Registrar movimiento</Button>}
            />
          )}
        </CardContent>
      </Card>

      <Card className="flex flex-col justify-between">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="size-5 text-savings" />
              Tu meta de ahorro
            </CardTitle>
            <Badge variant={goalMet ? 'default' : 'secondary'}>
              {goalMet ? 'Meta superada' : 'En progreso'}
            </Badge>
          </div>
          <CardDescription>
            Objetivo configurado: ahorrar al menos {prefs.savingsGoalPct}% de tus ingresos.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tabular-nums text-savings">
              {summary.totalIncome > 0 ? `${savingsRate}%` : '0%'}
            </span>
            <span className="text-sm font-medium text-muted-foreground tabular-nums">
              {formatMoney(summary.netSavings)} ahorrado
            </span>
          </div>

          <Progress value={goalProgress} aria-label="Progreso hacia meta de ahorro" />

          <p className="text-sm text-muted-foreground">
            {summary.totalIncome === 0
              ? 'Registra un ingreso en el período para calcular tu tasa de ahorro.'
              : goalMet
                ? `Excelente: superas tu meta por ${Math.round((savingsRate - prefs.savingsGoalPct) * 10) / 10} puntos porcentuales.`
                : `Te faltan ${Math.round((prefs.savingsGoalPct - savingsRate) * 10) / 10}% puntos para alcanzar tu objetivo.`}
          </p>

          {(summary.totalSavingsBalance ?? 0) > 0 ? (
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Acumulado en metas</span>
              <strong className="text-savings tabular-nums">
                {formatMoney(summary.totalSavingsBalance ?? 0)}
              </strong>
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/savings">
              <PiggyBank data-icon="inline-start" />
              Gestionar metas de ahorro
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link to={`/reports?from=${from}&to=${to}`}>
              Ver análisis completo
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link to="/settings">
              <SlidersHorizontal data-icon="inline-start" />
              Ajustar meta o colores
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
