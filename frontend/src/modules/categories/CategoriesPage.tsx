import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, Plus } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { api } from '@/services/api';
import { EmptyState } from '@/shared/components/FeedbackStates';
import { usePreferences } from '@/shared/context/PreferencesContext';
import { errorText } from '@/shared/utils/format';
import type { Category, MoneyType, Summary } from '@/types/finance';
import { CategoryCardGrid } from './components/CategoryCardGrid';
import { CategorySummaryTable, type CategoryRowItem } from './components/CategorySummaryTable';

export function CategoriesPage({
  categories,
  refreshKey,
  onEdit,
  onChanged,
}: {
  categories: Category[];
  refreshKey: number;
  onEdit: (cat: Category | 'new') => void;
  onChanged: () => void;
}) {
  const [filterType, setFilterType] = useState<'ALL' | MoneyType>('ALL');
  const [viewMode, setViewMode] = useState<'summary' | 'cards'>('summary');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [confirmCat, setConfirmCat] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { formatMoney } = usePreferences();

  useEffect(() => {
    let active = true;
    api
      .summary()
      .then((sum) => {
        if (active) setSummary(sum);
      })
      .catch(() => {
        // Mantiene lista usable aunque falle el conteo auxiliar
      });
    return () => {
      active = false;
    };
  }, [refreshKey, categories]);

  const rows = useMemo<CategoryRowItem[]>(() => {
    const usageById = Object.fromEntries(
      (summary?.byCategory ?? []).map((u) => [u.categoryId, u]),
    );
    const totalIncome = summary?.totalIncome ?? 0;
    const totalExpense = summary?.totalExpense ?? 0;

    return categories
      .filter((c) => filterType === 'ALL' || c.type === filterType)
      .map((category) => {
        const usage = usageById[category.id];
        const count = usage?.count ?? 0;
        const total = usage?.total ?? 0;
        const rubroTotal = category.type === 'INCOME' ? totalIncome : totalExpense;
        const sharePct = rubroTotal > 0 ? Math.round((total / rubroTotal) * 100) : 0;
        const avgAmount = count > 0 ? Math.round((total / count) * 100) / 100 : 0;
        return { category, count, total, sharePct, avgAmount };
      })
      .sort((a, b) => b.total - a.total || a.category.name.localeCompare(b.category.name, 'es'));
  }, [categories, filterType, summary]);

  async function confirmDelete() {
    if (!confirmCat) return;
    setDeleting(true);
    try {
      await api.deleteCategory(confirmCat.id);
      toast.success('Categoría eliminada correctamente');
      setConfirmCat(null);
      onChanged();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setDeleting(false);
    }
  }

  const incomeCount = categories.filter((c) => c.type === 'INCOME').length;
  const expenseCount = categories.filter((c) => c.type === 'EXPENSE').length;
  const activeCount = rows.filter((r) => r.count > 0).length;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total:</span>
              <Badge variant="secondary" className="tabular-nums">
                {categories.length} categorías
              </Badge>
            </div>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-income font-medium tabular-nums">{incomeCount} ingresos</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-expense font-medium tabular-nums">{expenseCount} egresos</span>
            </div>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <span className="text-muted-foreground tabular-nums">
              {activeCount} con actividad registrada
            </span>
          </div>
          {summary ? (
            <div className="text-xs text-muted-foreground tabular-nums">
              Histórico: <strong className="text-income">{formatMoney(summary.totalIncome)}</strong>{' '}
              ingresos / <strong className="text-expense">{formatMoney(summary.totalExpense)}</strong>{' '}
              egresos
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Estructura de categorías</CardTitle>
            <CardDescription>
              Peso relativo en su rubro, promedio por operación y acceso directo a sus movimientos.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={filterType}
              onValueChange={(v) => {
                if (v === 'ALL' || v === 'INCOME' || v === 'EXPENSE') setFilterType(v);
              }}
            >
              <ToggleGroupItem value="ALL">Todas</ToggleGroupItem>
              <ToggleGroupItem value="INCOME">Ingresos</ToggleGroupItem>
              <ToggleGroupItem value="EXPENSE">Egresos</ToggleGroupItem>
            </ToggleGroup>

            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={viewMode}
              onValueChange={(v) => {
                if (v === 'summary' || v === 'cards') setViewMode(v);
              }}
              aria-label="Modo de visualización"
            >
              <ToggleGroupItem value="summary" aria-label="Vista resumida">
                <List className="size-3.5" />
                Resumida
              </ToggleGroupItem>
              <ToggleGroupItem value="cards" aria-label="Vista en tarjetas">
                <LayoutGrid className="size-3.5" />
                Tarjetas
              </ToggleGroupItem>
            </ToggleGroup>

            <Button size="sm" onClick={() => onEdit('new')}>
              <Plus data-icon="inline-start" />
              Nueva categoría
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {rows.length ? (
            viewMode === 'summary' ? (
              <CategorySummaryTable
                items={rows}
                onEdit={onEdit}
                onDelete={setConfirmCat}
              />
            ) : (
              <CategoryCardGrid
                items={rows}
                onEdit={onEdit}
                onDelete={setConfirmCat}
              />
            )
          ) : (
            <EmptyState
              title="No hay categorías en esta vista"
              description="Crea tu primera categoría para organizar tus ingresos y egresos."
              action={
                <Button onClick={() => onEdit('new')}>
                  <Plus data-icon="inline-start" />
                  Nueva categoría
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(confirmCat)} onOpenChange={(o) => !o && setConfirmCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la categoría <strong>{confirmCat?.name}</strong>. Esta acción solo es
              posible porque no tiene movimientos asociados.
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
              {deleting ? 'Eliminando...' : 'Eliminar categoría'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
