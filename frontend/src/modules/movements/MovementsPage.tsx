import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import { DateRangeBar } from '@/shared/components/DateRangeBar';
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
  TypeBadge,
} from '@/shared/components/FeedbackStates';
import { usePreferences } from '@/shared/context/PreferencesContext';
import {
  dateForInput,
  dateLabel,
  errorText,
  formatCurrency,
  today,
} from '@/shared/utils/format';
import { useCachedQuery } from '@/shared/utils/useCachedQuery';
import type { Category, MoneyType, Transaction, TransactionPage } from '@/types/finance';

export function MovementsPage({
  categories,
  refreshKey,
  onEdit,
  onAdd,
  onChanged,
}: {
  categories: Category[];
  refreshKey: number;
  onEdit: (tx: Transaction) => void;
  onAdd: () => void;
  onChanged: () => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = (searchParams.get('type') as MoneyType | '') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const urlQuery = searchParams.get('q') || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));

  const [searchInput, setSearchInput] = useState(urlQuery);
  const [confirmTx, setConfirmTx] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { prefs, convertFromBase, formatMoney } = usePreferences();

  const updateParams = (patch: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, v);
    });
    if (resetPage) next.set('page', '1');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== urlQuery) {
        updateParams({ q: searchInput.trim() || undefined }, true);
      }
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  const {
    data: result,
    isInitialLoading,
    isFetching,
    error,
    retry,
  } = useCachedQuery<TransactionPage>(
    `movements:${type}:${categoryId}:${urlQuery}:${from}:${to}:${page}`,
    () =>
      api.transactions({
        type: type || undefined,
        categoryId: categoryId || undefined,
        q: urlQuery || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        limit: 10,
      }),
    refreshKey,
  );

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])) as Record<string, Category>,
    [categories],
  );

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 10));

  async function confirmDelete() {
    if (!confirmTx) return;
    setDeleting(true);
    try {
      await api.deleteTransaction(confirmTx.id);
      toast.success('Movimiento eliminado correctamente');
      setConfirmTx(null);
      if (items.length === 1 && page > 1) {
        updateParams({ page: String(page - 1) }, false);
      }
      onChanged();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setDeleting(false);
    }
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const full = await api.transactions({
        type: type || undefined,
        categoryId: categoryId || undefined,
        q: urlQuery || undefined,
        from: from || undefined,
        to: to || undefined,
        all: true,
      });
      const rows = [
        [
          'Fecha',
          'Tipo',
          'Categoría',
          'Descripción',
          'Moneda original',
          'Monto original',
          'Tipo de cambio',
          'Monto base (PEN)',
          `Monto (${prefs.displayCurrency})`,
        ],
        ...full.items.map((t) => [
          dateForInput(t.date),
          t.type === 'INCOME' ? 'Ingreso' : 'Egreso',
          categoryMap[t.categoryId]?.name ?? '',
          t.description ?? '',
          t.currency ?? 'PEN',
          String(t.originalAmount ?? t.amount),
          String(t.exchangeRate ?? 1),
          String(t.amount),
          String(convertFromBase(t.amount)),
        ]),
      ];
      const csv =
        '\ufeff' +
        rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `movimientos-${today()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exportados ${full.items.length} movimientos a CSV`);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setExporting(false);
    }
  }

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <DateRangeBar
        from={from}
        to={to}
        onChange={(next) => updateParams({ from: next.from, to: next.to })}
        extra={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={exporting || total === 0}
          >
            <Download data-icon="inline-start" />
            {exporting ? 'Exportando...' : `Exportar CSV (${total})`}
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Todos los movimientos</CardTitle>
            <CardDescription>
              Búsqueda global en servidor y filtros sincronizados en la URL
            </CardDescription>
          </div>
          <Badge variant="secondary">{total} registros</Badge>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-5">
              <Label htmlFor="movements-search" className="sr-only">
                Buscar por descripción
              </Label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="movements-search"
                placeholder="Buscar por descripción..."
                className="pl-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <div className="md:col-span-3">
              <Select
                value={type || 'ALL'}
                onValueChange={(v) =>
                  updateParams({ type: v === 'ALL' ? undefined : v, categoryId: undefined })
                }
              >
                <SelectTrigger aria-label="Filtrar por tipo">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">Todos los tipos</SelectItem>
                    <SelectItem value="INCOME">Ingresos</SelectItem>
                    <SelectItem value="EXPENSE">Egresos</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Select
                value={categoryId || 'ALL'}
                onValueChange={(v) =>
                  updateParams({ categoryId: v === 'ALL' ? undefined : v })
                }
              >
                <SelectTrigger aria-label="Filtrar por categoría">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">Todas las categorías</SelectItem>
                    {categories
                      .filter((c) => !type || c.type === type)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end md:col-span-1">
              <Button
                variant="ghost"
                size="icon"
                title="Limpiar filtros"
                aria-label="Limpiar filtros"
                onClick={clearAllFilters}
              >
                <X />
              </Button>
            </div>
          </div>

          {isInitialLoading ? (
            <TableSkeleton rows={6} />
          ) : error && !result ? (
            <ErrorState message={error} onRetry={retry} />
          ) : items.length ? (
            <div
              className={cn(
                'transition-opacity duration-200 ease-out',
                isFetching ? 'opacity-75' : 'opacity-100',
              )}
            >
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción / Categoría</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  const catName = categoryMap[tx.categoryId]?.name ?? 'Categoría desconocida';
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
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {tx.description || 'Movimiento sin descripción'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {catName}
                              {tx.currency && tx.currency !== 'PEN' && tx.originalAmount
                                ? ` · Original: ${formatCurrency(tx.originalAmount, tx.currency)} (TC ${tx.exchangeRate})`
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Editar movimiento"
                            onClick={() => onEdit(tx)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Eliminar movimiento"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setConfirmTx(tx)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          ) : (
            <EmptyState
              title="No se encontraron movimientos"
              description="Prueba ajustando la búsqueda o los filtros activos."
              action={
                <Button onClick={onAdd}>
                  <Plus data-icon="inline-start" />
                  Nuevo movimiento
                </Button>
              }
            />
          )}

          <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row">
            <span>
              Mostrando {total ? (page - 1) * 10 + 1 : 0}–{Math.min(page * 10, total)} de {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page <= 1}
                aria-label="Página anterior"
                onClick={() => updateParams({ page: String(page - 1) }, false)}
              >
                <ChevronLeft />
              </Button>
              <span className="min-w-14 text-center font-medium text-foreground tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= totalPages}
                aria-label="Página siguiente"
                onClick={() => updateParams({ page: String(page + 1) }, false)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(confirmTx)} onOpenChange={(o) => !o && setConfirmTx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará{' '}
              <strong>{confirmTx?.description || 'el movimiento'}</strong> por{' '}
              {confirmTx ? formatMoney(confirmTx.amount) : ''}.
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
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
