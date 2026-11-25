import type { MoneyType } from '../../../../shared/domain/money-type';
import { Category } from '../../domain/category';
import type { CategoryRepository } from '../../domain/category-repository';
import { CategoryModel, type CategoryDocument } from './category.model';

const CategoryMapper = {
  toDomain(doc: CategoryDocument): Category {
    return Category.fromPrimitives({
      id: doc._id,
      userId: doc.userId,
      name: doc.name,
      type: doc.type,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  },
  toPersistence(category: Category): CategoryDocument {
    const { id, ...rest } = category.toPrimitives();
    return { _id: id, ...rest };
  },
};

export class MongoCategoryRepository implements CategoryRepository {
  async save(category: Category): Promise<void> {
    const doc = CategoryMapper.toPersistence(category);
    await CategoryModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }

  async findById(id: string, userId?: string): Promise<Category | null> {
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await CategoryModel.findOne(query).lean<CategoryDocument>();
    return doc ? CategoryMapper.toDomain(doc) : null;
  }

  async findByNameAndType(name: string, type: MoneyType, userId?: string): Promise<Category | null> {
    const query = userId ? { name, type, userId } : { name, type };
    const doc = await CategoryModel.findOne(query)
      .collation({ locale: 'es', strength: 2 })
      .lean<CategoryDocument>();
    return doc ? CategoryMapper.toDomain(doc) : null;
  }

  async findAll(filter: { type?: MoneyType; userId?: string } = {}): Promise<Category[]> {
    const query: Record<string, unknown> = {};
    if (filter.type) query.type = filter.type;
    if (filter.userId) query.userId = filter.userId;
    const docs = await CategoryModel.find(query).sort({ type: 1, name: 1 }).lean<CategoryDocument[]>();
    return docs.map(CategoryMapper.toDomain);
  }

  async delete(id: string, userId?: string): Promise<void> {
    const query = userId ? { _id: id, userId } : { _id: id };
    await CategoryModel.deleteOne(query);
  }
}
