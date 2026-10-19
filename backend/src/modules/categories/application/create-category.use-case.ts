import { ConflictError } from '../../../shared/domain/errors';
import type { MoneyType } from '../../../shared/domain/money-type';
import { Category, type CategoryPrimitives } from '../domain/category';
import type { CategoryRepository } from '../domain/category-repository';

export interface CreateCategoryInput {
  name: string;
  type: MoneyType;
}

export class CreateCategoryUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<CategoryPrimitives> {
    const category = Category.create(input);

    const duplicated = await this.categories.findByNameAndType(category.name, category.type);
    if (duplicated) {
      throw new ConflictError(`Ya existe una categoría "${category.name}" de tipo ${category.type}`);
    }

    await this.categories.save(category);
    return category.toPrimitives();
  }
}
