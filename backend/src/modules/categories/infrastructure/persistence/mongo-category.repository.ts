import type { MoneyType } from '../../../../shared/domain/money-type';
import { Category } from '../../domain/category';
import type { CategoryRepository } from '../../domain/category-repository';
import { CategoryModel, type CategoryDocument } from './category.model';

const CategoryMapper = {
  toDomain(doc: CategoryDocument): Category {
    return Category.fromPrimitives({
      id: doc._id,
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

  async findById(id: string): Promise<Category | null> {
    const doc = await CategoryModel.findById(id).lean<CategoryDocument>();
    return doc ? CategoryMapper.toDomain(doc) : null;
  }

  async findByNameAndType(name: string, type: MoneyType): Promise<Category | null> {
    const doc = await CategoryModel.findOne({ name, type })
      .collation({ locale: 'es', strength: 2 })
      .lean<CategoryDocument>();
    return doc ? CategoryMapper.toDomain(doc) : null;
  }

  async findAll(filter: { type?: MoneyType } = {}): Promise<Category[]> {
    const query = filter.type ? { type: filter.type } : {};
    const docs = await CategoryModel.find(query).sort({ type: 1, name: 1 }).lean<CategoryDocument[]>();
    return docs.map(CategoryMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await CategoryModel.deleteOne({ _id: id });
  }
}
