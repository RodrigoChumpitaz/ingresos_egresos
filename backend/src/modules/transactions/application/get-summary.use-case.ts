import type { MoneyType } from '../../../shared/domain/money-type';
import type { CategoryRepository } from '../../categories/domain/category-repository';
import type { TransactionRepository } from '../domain/transaction-repository';

export interface Summary {
  from: Date | null;
  to: Date | null;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Array<{ categoryId: string; categoryName: string; type: MoneyType; total: number; count: number }>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export class GetSummaryUseCase {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly categories: CategoryRepository,
  ) {}

  async execute(range: { from?: Date; to?: Date }): Promise<Summary> {
    const [totals, categories] = await Promise.all([
      this.transactions.totalsByCategory(range),
      this.categories.findAll(),
    ]);
    const names = new Map(categories.map((c) => [c.id, c.name]));

    const sumOf = (type: MoneyType) =>
      round2(totals.filter((t) => t.type === type).reduce((acc, t) => acc + t.total, 0));
    const totalIncome = sumOf('INCOME');
    const totalExpense = sumOf('EXPENSE');

    return {
      from: range.from ?? null,
      to: range.to ?? null,
      totalIncome,
      totalExpense,
      balance: round2(totalIncome - totalExpense),
      byCategory: totals
        .map((t) => ({ ...t, total: round2(t.total), categoryName: names.get(t.categoryId) ?? '(eliminada)' }))
        .sort((a, b) => b.total - a.total),
    };
  }
}
