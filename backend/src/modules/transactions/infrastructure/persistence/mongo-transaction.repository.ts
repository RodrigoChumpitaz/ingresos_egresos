import type { QueryFilter } from 'mongoose';
import { Transaction } from '../../domain/transaction';
import type {
  CategoryTotal,
  Paginated,
  Pagination,
  TransactionFilter,
  TransactionRepository,
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

function toMongoQuery(filter: TransactionFilter): QueryFilter<TransactionDocument> {
  const query: QueryFilter<TransactionDocument> = {};
  if (filter.type) query.type = filter.type;
  if (filter.categoryId) query.categoryId = filter.categoryId;
  if (filter.from || filter.to) {
    query.date = {
      ...(filter.from && { $gte: filter.from }),
      ...(filter.to && { $lte: filter.to }),
    };
  }
  return query;
}

export class MongoTransactionRepository implements TransactionRepository {
  async save(transaction: Transaction): Promise<void> {
    const doc = TransactionMapper.toPersistence(transaction);
    await TransactionModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }

  async findById(id: string): Promise<Transaction | null> {
    const doc = await TransactionModel.findById(id).lean<TransactionDocument>();
    return doc ? TransactionMapper.toDomain(doc) : null;
  }

  async findMany(filter: TransactionFilter, { page, limit }: Pagination): Promise<Paginated<Transaction>> {
    const query = toMongoQuery(filter);
    const [docs, total] = await Promise.all([
      TransactionModel.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<TransactionDocument[]>(),
      TransactionModel.countDocuments(query),
    ]);
    return { items: docs.map(TransactionMapper.toDomain), total, page, limit };
  }

  async delete(id: string): Promise<void> {
    await TransactionModel.deleteOne({ _id: id });
  }

  async existsByCategory(categoryId: string): Promise<boolean> {
    return (await TransactionModel.exists({ categoryId })) !== null;
  }

  async totalsByCategory(filter: Pick<TransactionFilter, 'from' | 'to'>): Promise<CategoryTotal[]> {
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
}
