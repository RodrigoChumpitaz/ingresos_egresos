import type { MoneyType } from '../../../shared/domain/money-type';
import type { CategoryPrimitives } from '../domain/category';
import type { CategoryRepository } from '../domain/category-repository';

export class ListCategoriesUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(filter: { type?: MoneyType } = {}): Promise<CategoryPrimitives[]> {
    const categories = await this.categories.findAll(filter);
    return categories.map((category) => category.toPrimitives());
  }
}
