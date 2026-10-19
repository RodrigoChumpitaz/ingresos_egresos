import type { MoneyType } from '../../../shared/domain/money-type';
import type { Category } from './category';

export interface CategoryRepository {
  save(category: Category): Promise<void>;
  findById(id: string): Promise<Category | null>;
  findByNameAndType(name: string, type: MoneyType): Promise<Category | null>;
  findAll(filter?: { type?: MoneyType }): Promise<Category[]>;
  delete(id: string): Promise<void>;
}
