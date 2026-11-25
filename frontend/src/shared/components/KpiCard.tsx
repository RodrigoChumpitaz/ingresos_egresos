import { Link } from 'react-router-dom';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type KpiTone = 'primary' | 'income' | 'expense' | 'savings';

const TONE_STYLES: Record<KpiTone, { iconBox: string; bar: string }> = {
  primary: {
    iconBox: 'bg-primary/10 text-primary',
    bar: 'bg-primary',
  },
  income: {
    iconBox: 'bg-income/10 text-income',
    bar: 'bg-income',
  },
  expense: {
    iconBox: 'bg-expense/10 text-expense',
    bar: 'bg-expense',
  },
  savings: {
    iconBox: 'bg-savings/10 text-savings',
    bar: 'bg-savings',
  },
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'primary',
  badge,
  badgeTone = 'neutral',
  to,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone?: KpiTone;
  badge?: string;
  badgeTone?: 'positive' | 'negative' | 'neutral';
  to?: string;
}) {
  const styles = TONE_STYLES[tone];

  const card = (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200 ease-out',
        to
          ? 'hover:-translate-y-0.5 hover:border-primary/40 focus-within:ring-2 focus-within:ring-ring'
          : 'hover:border-border/80',
      )}
    >
      <span className={cn('absolute inset-x-0 top-0 h-0.5', styles.bar)} aria-hidden="true" />
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-1">
        <CardTitle className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
          {to ? (
            <ArrowUpRight className="size-3.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          ) : null}
        </CardTitle>
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105',
            styles.iconBox,
          )}
        >
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="text-2xl font-bold tracking-tight tabular-nums sm:text-[1.65rem]">
          {value}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {badge ? (
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-medium transition-colors duration-200',
                badgeTone === 'positive' && 'border-income/30 bg-income/10 text-income',
                badgeTone === 'negative' && 'border-expense/30 bg-expense/10 text-expense',
                badgeTone === 'neutral' && 'bg-muted text-muted-foreground',
              )}
            >
              {badge}
            </Badge>
          ) : null}
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
      </CardContent>
    </Card>
  );

  if (!to) return card;

  return (
    <Link
      to={to}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  );
}
