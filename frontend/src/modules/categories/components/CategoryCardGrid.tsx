import { Link } from 'react-router-dom';
import { ArrowRight, Pencil, Tags, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TypeBadge } from '@/shared/components/FeedbackStates';
import { usePreferences } from '@/shared/context/PreferencesContext';
import type { Category } from '@/types/finance';
import type { CategoryRowItem } from './CategorySummaryTable';

export function CategoryCardGrid({
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ category, count, total, sharePct, avgAmount }) => {
        const inUse = count > 0;
        const isIncome = category.type === 'INCOME';
        return (
          <Card key={category.id} className="flex flex-col justify-between">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div className="flex items-center gap-3">
                <span
                  className={
                    isIncome
                      ? 'flex size-9 items-center justify-center rounded-lg bg-income/10 text-income'
                      : 'flex size-9 items-center justify-center rounded-lg bg-expense/10 text-expense'
                  }
                >
                  <Tags className="size-4" />
                </span>
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base">{category.name}</CardTitle>
                  <TypeBadge type={category.type} />
                </div>
              </div>
              <div className="flex items-center gap-1">
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
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold tabular-nums">{formatMoney(total)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {sharePct}% de su rubro
                </span>
              </div>
              <Progress value={inUse ? Math.max(4, sharePct) : 0} className="h-1.5" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {count} {count === 1 ? 'movimiento' : 'movimientos'}
                </span>
                <span>Prom.: {inUse ? formatMoney(avgAmount) : '—'}</span>
              </div>
            </CardContent>

            <CardFooter className="border-t pt-3">
              {inUse ? (
                <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
                  <Link to={`/movements?categoryId=${category.id}`}>
                    Ver movimientos del rubro
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              ) : (
                <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                  <span>Sin actividad aún</span>
                  <Badge variant="secondary">Eliminable</Badge>
                </div>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
