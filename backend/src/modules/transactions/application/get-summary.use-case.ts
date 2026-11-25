import type { MoneyType } from '../../../shared/domain/money-type';
import type { CategoryRepository } from '../../categories/domain/category-repository';
import type { SavingsReader } from '../../savings/domain/savings-repository';
import type { TransactionRepository } from '../domain/transaction-repository';

export interface SummaryComparison {
  previousFrom: Date;
  previousTo: Date;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  incomeDeltaPct: number | null;
  expenseDeltaPct: number | null;
  savingsDeltaPct: number | null;
}

export interface Summary {
  from: Date | null;
  to: Date | null;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  netSavings: number;
  savingsRate: number;
  allocatedSavings: number;
  totalSavingsBalance: number;
  realAvailable: number;
  byCategory: Array<{ categoryId: string; categoryName: string; type: MoneyType; total: number; count: number }>;
  comparison?: SummaryComparison;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function calcPctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return round2(((current - previous) / Math.abs(previous)) * 100);
}

function calcRate(income: number, netSavings: number): number {
  return income > 0 ? round2((netSavings / income) * 100) : 0;
}

export class GetSummaryUseCase {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly categories: CategoryRepository,
    private readonly savings?: SavingsReader,
  ) {}

  async execute(range: { from?: Date; to?: Date; compare?: 'prev'; userId?: string }): Promise<Summary> {
    const [totals, categories, allocatedSavings, totalSavingsBalance] = await Promise.all([
      this.transactions.totalsByCategory({ from: range.from, to: range.to, userId: range.userId }),
      this.categories.findAll({ userId: range.userId }),
      this.savings
        ? this.savings.sumNetAllocated({ from: range.from, to: range.to, userId: range.userId })
        : Promise.resolve(0),
      this.savings ? this.savings.totalBalance(range.userId) : Promise.resolve(0),
    ]);
    const names = new Map(categories.map((c) => [c.id, c.name]));

    const sumOf = (list: typeof totals, type: MoneyType) =>
      round2(list.filter((t) => t.type === type).reduce((acc, t) => acc + t.total, 0));

    const totalIncome = sumOf(totals, 'INCOME');
    const totalExpense = sumOf(totals, 'EXPENSE');
    const netSavings = round2(totalIncome - totalExpense);
    const savingsRate = calcRate(totalIncome, netSavings);
    const realAvailable = round2(netSavings - allocatedSavings);

    let comparison: SummaryComparison | undefined;
    if (range.compare === 'prev' && range.from && range.to) {
      const durationMs = Math.max(0, range.to.getTime() - range.from.getTime());
      const previousTo = new Date(range.from.getTime() - 1);
      const previousFrom = new Date(previousTo.getTime() - durationMs);
      const prevTotals = await this.transactions.totalsByCategory({
        from: previousFrom,
        to: previousTo,
        userId: range.userId,
      });
      const prevIncome = sumOf(prevTotals, 'INCOME');
      const prevExpense = sumOf(prevTotals, 'EXPENSE');
      const prevSavings = round2(prevIncome - prevExpense);

      comparison = {
        previousFrom,
        previousTo,
        totalIncome: prevIncome,
        totalExpense: prevExpense,
        netSavings: prevSavings,
        savingsRate: calcRate(prevIncome, prevSavings),
        incomeDeltaPct: calcPctDelta(totalIncome, prevIncome),
        expenseDeltaPct: calcPctDelta(totalExpense, prevExpense),
        savingsDeltaPct: calcPctDelta(netSavings, prevSavings),
      };
    }

    return {
      from: range.from ?? null,
      to: range.to ?? null,
      totalIncome,
      totalExpense,
      balance: netSavings,
      netSavings,
      savingsRate,
      allocatedSavings,
      totalSavingsBalance,
      realAvailable,
      byCategory: totals
        .map((t) => ({ ...t, total: round2(t.total), categoryName: names.get(t.categoryId) ?? '(eliminada)' }))
        .sort((a, b) => b.total - a.total),
      ...(comparison ? { comparison } : {}),
    };
  }
}
