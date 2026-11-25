import type { TransactionRepository } from '../domain/transaction-repository';

export type TrendGranularity = 'day' | 'week' | 'month';

export interface TrendPoint {
  key: string;
  label: string;
  start: string;
  end: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
}

export interface TrendResult {
  from: Date;
  to: Date;
  granularity: TrendGranularity;
  points: TrendPoint[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function formatYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfUtcWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const copy = startOfUtcDay(d);
  copy.setUTCDate(copy.getUTCDate() + diffToMonday);
  return copy;
}

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function bucketStartFor(date: Date, granularity: TrendGranularity): Date {
  if (granularity === 'day') return startOfUtcDay(date);
  if (granularity === 'week') return startOfUtcWeek(date);
  return startOfUtcMonth(date);
}

function nextBucketStart(cursor: Date, granularity: TrendGranularity): Date {
  const next = new Date(cursor);
  if (granularity === 'day') next.setUTCDate(next.getUTCDate() + 1);
  else if (granularity === 'week') next.setUTCDate(next.getUTCDate() + 7);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

function formatLabel(start: Date, granularity: TrendGranularity): string {
  if (granularity === 'month') {
    return start.toLocaleDateString('es-PE', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  }
  return start.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export class GetTrendUseCase {
  constructor(private readonly transactions: TransactionRepository) {}

  async execute(input: {
    userId?: string;
    from?: Date;
    to?: Date;
    granularity?: 'auto' | TrendGranularity;
  }): Promise<TrendResult> {
    const now = new Date();
    const to =
      input.to ??
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const from =
      input.from ??
      new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() - 29, 0, 0, 0, 0));

    const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
    const granularity: TrendGranularity =
      input.granularity && input.granularity !== 'auto'
        ? input.granularity
        : days <= 31
          ? 'day'
          : days <= 90
            ? 'week'
            : 'month';

    const entries = await this.transactions.findEntriesForTrend({
      from,
      to,
      userId: input.userId,
    });

    const buckets = new Map<string, { start: Date; end: Date; income: number; expense: number }>();
    let cursor = bucketStartFor(from, granularity);
    const limitDate = bucketStartFor(to, granularity);

    while (cursor <= limitDate) {
      const next = nextBucketStart(cursor, granularity);
      const bucketEnd = new Date(Math.min(to.getTime(), next.getTime() - 1));
      const key = granularity === 'month' ? formatYmd(cursor).slice(0, 7) : formatYmd(cursor);
      buckets.set(key, {
        start: new Date(Math.max(from.getTime(), cursor.getTime())),
        end: bucketEnd,
        income: 0,
        expense: 0,
      });
      cursor = next;
    }

    for (const entry of entries) {
      const bStart = bucketStartFor(entry.date, granularity);
      const key = granularity === 'month' ? formatYmd(bStart).slice(0, 7) : formatYmd(bStart);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      if (entry.type === 'INCOME') bucket.income += entry.amount;
      else bucket.expense += entry.amount;
    }

    const points: TrendPoint[] = Array.from(buckets.entries()).map(([key, b]) => {
      const totalIncome = round2(b.income);
      const totalExpense = round2(b.expense);
      const netSavings = round2(totalIncome - totalExpense);
      const savingsRate = totalIncome > 0 ? round2((netSavings / totalIncome) * 100) : 0;
      return {
        key,
        label: formatLabel(b.start, granularity),
        start: formatYmd(b.start),
        end: formatYmd(b.end),
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
      };
    });

    return { from, to, granularity, points };
  }
}
