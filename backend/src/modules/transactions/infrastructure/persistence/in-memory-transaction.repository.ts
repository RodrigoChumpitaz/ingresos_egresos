import { Transaction } from '../../domain/transaction';
import type {
  CategoryTotal,
  Paginated,
  Pagination,
  TransactionFilter,
  TransactionRepository,
  TrendEntry,
} from '../../domain/transaction-repository';

export class InMemoryTransactionRepository implements TransactionRepository {
  private readonly items = new Map<string, Transaction>();

  constructor(initial: Transaction[] = []) {
    for (const tx of initial) {
      this.items.set(tx.id, tx);
    }
  }

  async save(transaction: Transaction): Promise<void> {
    this.items.set(transaction.id, Transaction.fromPrimitives(transaction.toPrimitives()));
  }

  async findById(id: string, userId?: string): Promise<Transaction | null> {
    const found = this.items.get(id);
    if (!found) return null;
    if (userId && found.userId !== userId) return null;
    return Transaction.fromPrimitives(found.toPrimitives());
  }

  async findMany(filter: TransactionFilter, { page, limit, all }: Pagination): Promise<Paginated<Transaction>> {
    const q = filter.q?.trim().toLowerCase();
    const filtered = Array.from(this.items.values())
      .map((t) => t.toPrimitives())
      .filter((t) => {
        if (filter.userId && t.userId !== filter.userId) return false;
        if (filter.type && t.type !== filter.type) return false;
        if (filter.categoryId && t.categoryId !== filter.categoryId) return false;
        if (filter.from && t.date < filter.from) return false;
        if (filter.to && t.date > filter.to) return false;
        if (q && !t.description.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort(
        (a, b) =>
          b.date.getTime() - a.date.getTime() || b.createdAt.getTime() - a.createdAt.getTime(),
      );

    const total = filtered.length;
    const slice = all ? filtered : filtered.slice((page - 1) * limit, page * limit);
    return {
      items: slice.map((p) => Transaction.fromPrimitives(p)),
      total,
      page: all ? 1 : page,
      limit: all ? Math.max(total, 1) : limit,
    };
  }

  async delete(id: string, userId?: string): Promise<void> {
    const existing = this.items.get(id);
    if (existing && (!userId || existing.userId === userId)) {
      this.items.delete(id);
    }
  }

  async existsByCategory(categoryId: string, userId?: string): Promise<boolean> {
    for (const tx of this.items.values()) {
      const p = tx.toPrimitives();
      if (p.categoryId === categoryId && (!userId || p.userId === userId)) return true;
    }
    return false;
  }

  async totalsByCategory(filter: Pick<TransactionFilter, 'from' | 'to' | 'userId'>): Promise<CategoryTotal[]> {
    const grouped = new Map<string, CategoryTotal>();
    for (const tx of this.items.values()) {
      const p = tx.toPrimitives();
      if (filter.userId && p.userId !== filter.userId) continue;
      if (filter.from && p.date < filter.from) continue;
      if (filter.to && p.date > filter.to) continue;
      const key = `${p.categoryId}:${p.type}`;
      const existing = grouped.get(key) ?? {
        categoryId: p.categoryId,
        type: p.type,
        total: 0,
        count: 0,
      };
      existing.total += p.amount;
      existing.count += 1;
      grouped.set(key, existing);
    }
    return Array.from(grouped.values());
  }

  async findEntriesForTrend(filter: Pick<TransactionFilter, 'from' | 'to' | 'userId'>): Promise<TrendEntry[]> {
    return Array.from(this.items.values())
      .map((t) => t.toPrimitives())
      .filter(
        (p) =>
          (!filter.userId || p.userId === filter.userId) &&
          (!filter.from || p.date >= filter.from) &&
          (!filter.to || p.date <= filter.to),
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((p) => ({ type: p.type, amount: p.amount, date: p.date }));
  }
}
