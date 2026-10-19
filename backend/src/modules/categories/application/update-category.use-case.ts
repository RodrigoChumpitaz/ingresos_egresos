import { ConflictError, NotFoundError } from '../../../shared/domain/errors';
import type { CategoryPrimitives } from '../domain/category';
import type { CategoryRepository } from '../domain/category-repository';

export class UpdateCategoryUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(id: string, input: { name: string }): Promise<CategoryPrimitives> {
    const category = await this.categories.findById(id);
    if (!category) throw new NotFoundError(`Categoría ${id} no encontrada`);

    category.rename(input.name);

    const duplicated = await this.categories.findByNameAndType(category.name, category.type);
    if (duplicated && duplicated.id !== category.id) {
      throw new ConflictError(`Ya existe una categoría "${category.name}" de tipo ${category.type}`);
    }

    await this.categories.save(category);
    return category.toPrimitives();
  }
}
