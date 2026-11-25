import type { MoneyType } from '../../../../shared/domain/money-type';
import { Category } from '../../domain/category';
import type { CategoryRepository } from '../../domain/category-repository';

export class InMemoryCategoryRepository implements CategoryRepository {
  private readonly items = new Map<string, Category>();

  constructor(initial: Category[] = []) {
    for (const category of initial) {
      this.items.set(category.id, category);
    }
  }

  async save(category: Category): Promise<void> {
    this.items.set(category.id, Category.fromPrimitives(category.toPrimitives()));
  }

  async findById(id: string, userId?: string): Promise<Category | null> {
    const found = this.items.get(id);
    if (!found) return null;
    if (userId && found.userId !== userId) return null;
    return Category.fromPrimitives(found.toPrimitives());
  }

  async findByNameAndType(name: string, type: MoneyType, userId?: string): Promise<Category | null> {
    const normalized = name.trim().toLocaleLowerCase('es');
    for (const category of this.items.values()) {
      if (
        (!userId || category.userId === userId) &&
        category.type === type &&
        category.name.trim().toLocaleLowerCase('es') === normalized
      ) {
        return Category.fromPrimitives(category.toPrimitives());
      }
    }
    return null;
  }

  async findAll(filter: { type?: MoneyType; userId?: string } = {}): Promise<Category[]> {
    return Array.from(this.items.values())
      .filter((c) => (!filter.userId || c.userId === filter.userId) && (!filter.type || c.type === filter.type))
      .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name, 'es'))
      .map((c) => Category.fromPrimitives(c.toPrimitives()));
  }

  async delete(id: string, userId?: string): Promise<void> {
    const existing = this.items.get(id);
    if (existing && (!userId || existing.userId === userId)) {
      this.items.delete(id);
    }
  }
}
