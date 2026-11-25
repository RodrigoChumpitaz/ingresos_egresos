import { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { api } from '@/services/api';
import { DashboardSkeleton, EmptyState, ErrorState } from '@/shared/components/FeedbackStates';
import { usePreferences } from '@/shared/context/PreferencesContext';
import { dateLabel, errorText } from '@/shared/utils/format';
import { useCachedQuery } from '@/shared/utils/useCachedQuery';
import type { SavingsEntry, SavingsGoal, SavingsMovementType } from '@/types/finance';
import { SavingsGoalModal } from './components/SavingsGoalModal';
import { SavingsMovementModal } from './components/SavingsMovementModal';

export function SavingsPage({
  refreshKey,
  onChanged,
}: {
  refreshKey: number;
  onChanged: () => void;
}) {
  const { formatMoney } = usePreferences();
  const [goalModal, setGoalModal] = useState<SavingsGoal | null | 'new'>(null);
  const [moveModal, setMoveModal] = useState<{
    goal: SavingsGoal;
    type: SavingsMovementType;
  } | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [confirmGoal, setConfirmGoal] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: goals, isInitialLoading, error, retry } = useCachedQuery<SavingsGoal[]>(
    'savings:goals',
    () => api.savingsGoals(),
    refreshKey,
  );

  useEffect(() => {
    if (!selectedGoal) {
      setEntries([]);
      return;
    }
    let active = true;
    setEntriesLoading(true);
    api
      .savingsEntries(selectedGoal.id)
      .then((list) => {
        if (active) setEntries(list);
      })
      .catch(() => {
        if (active) setEntries([]);
      })
      .finally(() => {
        if (active) setEntriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedGoal, refreshKey]);

  const goalList = goals ?? [];
  const totalSaved = goalList.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goalList.reduce((acc, g) => acc + g.targetAmount, 0);

  async function confirmDelete() {
    if (!confirmGoal) return;
    setDeleting(true);
    try {
      await api.deleteSavingsGoal(confirmGoal.id);
      toast.success('Meta eliminada correctamente');
      if (selectedGoal?.id === confirmGoal.id) setSelectedGoal(null);
      setConfirmGoal(null);
      onChanged();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <PiggyBank className="size-4 text-savings" />
              <span className="text-muted-foreground">Total apartado:</span>
              <strong className="text-base text-savings tabular-nums">
                {formatMoney(totalSaved)}
              </strong>
            </div>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <span className="text-muted-foreground tabular-nums">
              Objetivo combinado: <strong>{formatMoney(totalTarget)}</strong>
            </span>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <Badge variant="secondary">{goalList.length} metas</Badge>
          </div>

          <Button size="sm" onClick={() => setGoalModal('new')}>
            <Plus data-icon="inline-start" />
            Nueva meta de ahorro
          </Button>
        </CardContent>
      </Card>

      {isInitialLoading ? (
        <DashboardSkeleton />
      ) : error && !goals ? (
        <ErrorState message={error} onRetry={retry} />
      ) : goalList.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goalList.map((goal) => {
            const pct =
              goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : 0;
            const hasBalance = goal.currentAmount > 0;
            const accent = goal.color || 'var(--savings)';

            return (
              <Card key={goal.id} className="flex flex-col justify-between">
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: accent }}
                      />
                      {goal.name}
                    </CardTitle>
                    <CardDescription>
                      {goal.deadline
                        ? `Meta al ${dateLabel(goal.deadline)}`
                        : 'Sin fecha límite'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Ver historial de ${goal.name}`}
                      onClick={() =>
                        setSelectedGoal((prev) => (prev?.id === goal.id ? null : goal))
                      }
                    >
                      <History />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Editar ${goal.name}`}
                      onClick={() => setGoalModal(goal)}
                    >
                      <Pencil />
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={hasBalance ? 0 : undefined}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={hasBalance}
                            aria-label={`Eliminar ${goal.name}`}
                            className="text-destructive hover:text-destructive"
                            onClick={() => setConfirmGoal(goal)}
                          >
                            <Trash2 />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {hasBalance
                          ? 'Retira el saldo ahorrado antes de eliminar'
                          : 'Eliminar meta'}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold tabular-nums" style={{ color: accent }}>
                      {formatMoney(goal.currentAmount)}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      de {formatMoney(goal.targetAmount)} ({pct}%)
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    style={{ '--primary': accent } as React.CSSProperties}
                  />
                </CardContent>

                <CardFooter className="grid grid-cols-2 gap-2 border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMoveModal({ goal, type: 'CONTRIBUTION' })}
                  >
                    <ArrowDownLeft data-icon="inline-start" className="text-income" />
                    Aportar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!hasBalance}
                    onClick={() => setMoveModal({ goal, type: 'WITHDRAWAL' })}
                  >
                    <ArrowUpRight data-icon="inline-start" className="text-expense" />
                    Retirar
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Sin metas de ahorro"
          description="Crea una meta para separar dinero de tu gasto diario sin distorsionar tus egresos."
          action={
            <Button onClick={() => setGoalModal('new')}>
              <Plus data-icon="inline-start" />
              Crear primera meta
            </Button>
          }
        />
      )}

      {selectedGoal ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Historial de {selectedGoal.name}</CardTitle>
              <CardDescription>Aportes y retiros registrados en esta meta</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedGoal(null)}>
              Cerrar
            </Button>
          </CardHeader>
          <CardContent>
            {entriesLoading ? (
              <div className="text-sm text-muted-foreground">Cargando historial...</div>
            ) : entries.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operación</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const isContrib = entry.type === 'CONTRIBUTION';
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge variant={isContrib ? 'default' : 'outline'}>
                            {isContrib ? 'Aporte' : 'Retiro'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.note || 'Sin nota'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {dateLabel(entry.date)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold tabular-nums ${
                            isContrib ? 'text-income' : 'text-expense'
                          }`}
                        >
                          {isContrib ? '+' : '−'}
                          {formatMoney(entry.amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title="Sin movimientos en esta meta" />
            )}
          </CardContent>
        </Card>
      ) : null}

      {goalModal !== null ? (
        <SavingsGoalModal
          item={goalModal === 'new' ? null : goalModal}
          onClose={() => setGoalModal(null)}
          onSuccess={() => {
            setGoalModal(null);
            onChanged();
          }}
        />
      ) : null}

      {moveModal !== null ? (
        <SavingsMovementModal
          goal={moveModal.goal}
          initialType={moveModal.type}
          onClose={() => setMoveModal(null)}
          onSuccess={() => {
            setMoveModal(null);
            onChanged();
          }}
        />
      ) : null}

      <AlertDialog open={Boolean(confirmGoal)} onOpenChange={(o) => !o && setConfirmGoal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar meta de ahorro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la meta <strong>{confirmGoal?.name}</strong> y su historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? 'Eliminando...' : 'Eliminar meta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
