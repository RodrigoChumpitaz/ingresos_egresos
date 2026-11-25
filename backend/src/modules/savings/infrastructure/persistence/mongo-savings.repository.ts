import type { QueryFilter } from 'mongoose';
import { SavingsGoal, type SavingsEntryPrimitives } from '../../domain/savings-goal';
import type { SavingsRepository } from '../../domain/savings-repository';
import {
  SavingsEntryModel,
  SavingsGoalModel,
  type SavingsEntryDocument,
  type SavingsGoalDocument,
} from './savings.model';

const round2 = (n: number) => Math.round(n * 100) / 100;

const GoalMapper = {
  toDomain(doc: SavingsGoalDocument): SavingsGoal {
    const { _id, ...rest } = doc;
    return SavingsGoal.fromPrimitives({ id: _id, ...rest });
  },
  toPersistence(goal: SavingsGoal): SavingsGoalDocument {
    const { id, ...rest } = goal.toPrimitives();
    return { _id: id, ...rest };
  },
};

export class MongoSavingsRepository implements SavingsRepository {
  async saveGoal(goal: SavingsGoal): Promise<void> {
    const doc = GoalMapper.toPersistence(goal);
    await SavingsGoalModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }

  async findGoalById(id: string, userId?: string): Promise<SavingsGoal | null> {
    const query = userId ? { _id: id, userId } : { _id: id };
    const doc = await SavingsGoalModel.findOne(query).lean<SavingsGoalDocument>();
    return doc ? GoalMapper.toDomain(doc) : null;
  }

  async findGoalByName(name: string, userId?: string): Promise<SavingsGoal | null> {
    const query = userId ? { name, userId } : { name };
    const doc = await SavingsGoalModel.findOne(query)
      .collation({ locale: 'es', strength: 2 })
      .lean<SavingsGoalDocument>();
    return doc ? GoalMapper.toDomain(doc) : null;
  }

  async findAllGoals(userId?: string): Promise<SavingsGoal[]> {
    const query = userId ? { userId } : {};
    const docs = await SavingsGoalModel.find(query).sort({ createdAt: -1 }).lean<SavingsGoalDocument[]>();
    return docs.map(GoalMapper.toDomain);
  }

  async deleteGoal(id: string, userId?: string): Promise<void> {
    const goalQuery = userId ? { _id: id, userId } : { _id: id };
    const entryQuery = userId ? { goalId: id, userId } : { goalId: id };
    await Promise.all([
      SavingsGoalModel.deleteOne(goalQuery),
      SavingsEntryModel.deleteMany(entryQuery),
    ]);
  }

  async saveEntry(entry: SavingsEntryPrimitives): Promise<void> {
    const { id, ...rest } = entry;
    await SavingsEntryModel.create({ _id: id, ...rest });
  }

  async findEntriesByGoal(goalId: string, userId?: string): Promise<SavingsEntryPrimitives[]> {
    const query = userId ? { goalId, userId } : { goalId };
    const docs = await SavingsEntryModel.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean<SavingsEntryDocument[]>();
    return docs.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
  }

  async sumNetAllocated(range: { from?: Date; to?: Date; userId?: string }): Promise<number> {
    const match: QueryFilter<SavingsEntryDocument> = {};
    if (range.userId) match.userId = range.userId;
    if (range.from || range.to) {
      match.date = {
        ...(range.from && { $gte: range.from }),
        ...(range.to && { $lte: range.to }),
      };
    }
    const [row] = await SavingsEntryModel.aggregate<{ total: number }>([
      { $match: match },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [{ $eq: ['$type', 'CONTRIBUTION'] }, '$amount', { $multiply: ['$amount', -1] }],
            },
          },
        },
      },
    ]);
    return round2(row?.total ?? 0);
  }

  async totalBalance(userId?: string): Promise<number> {
    const pipeline = [
      ...(userId ? [{ $match: { userId } }] : []),
      { $group: { _id: null, total: { $sum: '$currentAmount' } } },
    ];
    const [row] = await SavingsGoalModel.aggregate<{ total: number }>(pipeline);
    return round2(row?.total ?? 0);
  }
}
