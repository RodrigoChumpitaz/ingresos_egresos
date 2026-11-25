import type { MoneyType } from '../../../shared/domain/money-type';
import type { Category } from './category';

export interface CategoryRepository {
  save(category: Category): Promise<void>;
  findById(id: string, userId?: string): Promise<Category | null>;
  findByNameAndType(name: string, type: MoneyType, userId?: string): Promise<Category | null>;
  findAll(filter?: { type?: MoneyType; userId?: string }): Promise<Category[]>;
  delete(id: string, userId?: string): Promise<void>;
}
