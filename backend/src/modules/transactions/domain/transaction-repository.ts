import type { MoneyType } from '../../../shared/domain/money-type';
import type { Transaction } from './transaction';

export interface TransactionFilter {
  type?: MoneyType;
  categoryId?: string;
  from?: Date;
  to?: Date;
}

export interface Pagination {
  page: number;
  limit: number;
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

export interface TransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findMany(filter: TransactionFilter, pagination: Pagination): Promise<Paginated<Transaction>>;
  delete(id: string): Promise<void>;
  existsByCategory(categoryId: string): Promise<boolean>;
  totalsByCategory(filter: Omit<TransactionFilter, 'categoryId' | 'type'>): Promise<CategoryTotal[]>;
}
