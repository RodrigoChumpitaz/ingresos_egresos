import { Link } from 'react-router-dom';
import { ArrowUpRight, Pencil, Tags, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TypeBadge } from '@/shared/components/FeedbackStates';
import { usePreferences } from '@/shared/context/PreferencesContext';
import type { Category } from '@/types/finance';

export interface CategoryRowItem {
  category: Category;
  count: number;
  total: number;
  sharePct: number;
  avgAmount: number;
}

export function CategorySummaryTable({
  items,
  onEdit,
  onDelete,
}: {
  items: CategoryRowItem[];
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) {
  const { formatMoney } = usePreferences();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Categoría</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="w-44">Peso en su rubro</TableHead>
          <TableHead className="text-right">Movs.</TableHead>
          <TableHead className="text-right">Promedio</TableHead>
          <TableHead className="text-right">Total acumulado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(({ category, count, total, sharePct, avgAmount }) => {
          const inUse = count > 0;
          const isIncome = category.type === 'INCOME';
          return (
            <TableRow key={category.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <span
                    className={
                      isIncome
                        ? 'flex size-7 shrink-0 items-center justify-center rounded-md bg-income/10 text-income'
                        : 'flex size-7 shrink-0 items-center justify-center rounded-md bg-expense/10 text-expense'
                    }
                  >
                    <Tags className="size-3.5" />
                  </span>
                  <span className="font-medium">{category.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <TypeBadge type={category.type} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    value={inUse ? Math.max(4, sharePct) : 0}
                    className="h-2 flex-1"
                    aria-label={`Participación de ${category.name}`}
                  />
                  <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                    {sharePct}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {inUse ? (
                  <Button variant="link" size="sm" className="h-auto p-0 tabular-nums" asChild>
                    <Link to={`/movements?categoryId=${category.id}`}>
                      {count}
                      <ArrowUpRight className="ml-0.5 size-3" />
                    </Link>
                  </Button>
                ) : (
                  <Badge variant="secondary">0</Badge>
                )}
              </TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">
                {inUse ? formatMoney(avgAmount) : '—'}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatMoney(total)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Editar ${category.name}`}
                    onClick={() => onEdit(category)}
                  >
                    <Pencil />
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={inUse ? 0 : undefined}>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={inUse}
                          aria-label={`Eliminar ${category.name}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => onDelete(category)}
                        >
                          <Trash2 />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {inUse
                        ? `Protegida: tiene ${count} ${count === 1 ? 'movimiento' : 'movimientos'}`
                        : 'Eliminar categoría'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
