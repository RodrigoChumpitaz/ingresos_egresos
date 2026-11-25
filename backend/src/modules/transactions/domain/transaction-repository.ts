import type { MoneyType } from '../../../shared/domain/money-type';
import type { Transaction } from './transaction';

export interface TransactionFilter {
  userId?: string;
  type?: MoneyType;
  categoryId?: string;
  from?: Date;
  to?: Date;
  q?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  all?: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoryTotal {
  categoryId: string;
  type: MoneyType;
  total: number;
  count: number;
}

export interface TrendEntry {
  type: MoneyType;
  amount: number;
  date: Date;
}

export interface TransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findById(id: string, userId?: string): Promise<Transaction | null>;
  findMany(filter: TransactionFilter, pagination: Pagination): Promise<Paginated<Transaction>>;
  delete(id: string, userId?: string): Promise<void>;
  existsByCategory(categoryId: string, userId?: string): Promise<boolean>;
  totalsByCategory(filter: Omit<TransactionFilter, 'categoryId' | 'type' | 'q'>): Promise<CategoryTotal[]>;
  findEntriesForTrend(filter: Pick<TransactionFilter, 'from' | 'to' | 'userId'>): Promise<TrendEntry[]>;
}
