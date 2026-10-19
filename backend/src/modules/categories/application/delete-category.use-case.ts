import { BusinessRuleError, NotFoundError } from '../../../shared/domain/errors';
import type { CategoryRepository } from '../domain/category-repository';

export interface CategoryUsageChecker {
  existsByCategory(categoryId: string): Promise<boolean>;
}

export class DeleteCategoryUseCase {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly usage: CategoryUsageChecker,
  ) {}

  async execute(id: string): Promise<void> {
    const category = await this.categories.findById(id);
    if (!category) throw new NotFoundError(`Categoría ${id} no encontrada`);

    if (await this.usage.existsByCategory(id)) {
      throw new BusinessRuleError('No se puede eliminar una categoría que tiene transacciones');
    }

    await this.categories.delete(id);
  }
}
