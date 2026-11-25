import type { QueryFilter } from 'mongoose';
import { Transaction } from '../../domain/transaction';
import type {
  CategoryTotal,
  Paginated,
  Pagination,
  TransactionFilter,
  TransactionRepository,
  TrendEntry,
} from '../../domain/transaction-repository';
import { TransactionModel, type TransactionDocument } from './transaction.model';

const TransactionMapper = {
  toDomain(doc: TransactionDocument): Transaction {
    const { _id, ...rest } = doc;
    return Transaction.fromPrimitives({ id: _id, ...rest });
  },
  toPersistence(transaction: Transaction): TransactionDocument {
    const { id, ...rest } = transaction.toPrimitives();
    return { _id: id, ...rest };
  },
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toMongoQuery(filter: TransactionFilter): QueryFilter<TransactionDocument> {
  const query: QueryFilter<TransactionDocument> = {};
  if (filter.userId) query.userId = filter.userId;
  if (filter.type) query.type = filter.type;
  if (filter.categoryId) query.categoryId = filter.categoryId;
  if (filter.from || filter.to) {
    query.date = {
      ...(filter.from && { $gte: filter.from }),
      ...(filter.to && { $lte: filter.to }),
    };
  }
  if (filter.q?.trim()) {
    query.description = { $regex: escapeRegex(filter.q.trim()), $options: 'i' };
  }
  return query;
}

export class MongoTransactionRepository implements TransactionRepository {
  async save(transaction: Transaction): Promise<void> {
    const doc = TransactionMapper.toPersistence(transaction);
    await TransactionModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }

  async findById(id: string, userId?: string): Promise<Transaction | null> {
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await TransactionModel.findOne(query).lean<TransactionDocument>();
    return doc ? TransactionMapper.toDomain(doc) : null;
  }

  async findMany(filter: TransactionFilter, { page, limit, all }: Pagination): Promise<Paginated<Transaction>> {
    const query = toMongoQuery(filter);
    const cursor = TransactionModel.find(query).sort({ date: -1, createdAt: -1 });
    if (!all) {
      cursor.skip((page - 1) * limit).limit(limit);
    }
    const [docs, total] = await Promise.all([
      cursor.lean<TransactionDocument[]>(),
      TransactionModel.countDocuments(query),
    ]);
    return {
      items: docs.map(TransactionMapper.toDomain),
      total,
      page: all ? 1 : page,
      limit: all ? Math.max(total, 1) : limit,
    };
  }

  async delete(id: string, userId?: string): Promise<void> {
    const query = userId ? { _id: id, userId } : { _id: id };
    await TransactionModel.deleteOne(query);
  }

  async existsByCategory(categoryId: string, userId?: string): Promise<boolean> {
    const query = userId ? { categoryId, userId } : { categoryId };
    return (await TransactionModel.exists(query)) !== null;
  }

  async totalsByCategory(filter: Pick<TransactionFilter, 'from' | 'to' | 'userId'>): Promise<CategoryTotal[]> {
    return TransactionModel.aggregate<CategoryTotal>([
      { $match: toMongoQuery(filter) },
      {
        $group: {
          _id: { categoryId: '$categoryId', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, categoryId: '$_id.categoryId', type: '$_id.type', total: 1, count: 1 } },
    ]);
  }

  async findEntriesForTrend(filter: Pick<TransactionFilter, 'from' | 'to' | 'userId'>): Promise<TrendEntry[]> {
    return TransactionModel.find(toMongoQuery(filter))
      .select({ _id: 0, type: 1, amount: 1, date: 1 })
      .sort({ date: 1 })
      .lean<TrendEntry[]>();
  }
}
