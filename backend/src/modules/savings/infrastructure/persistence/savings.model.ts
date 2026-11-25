import { Schema, model, models, type Model } from 'mongoose';
import { SAVINGS_MOVEMENT_TYPES, type SavingsMovementType } from '../../domain/savings-goal';

export interface SavingsGoalDocument {
  _id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date | null;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsEntryDocument {
  _id: string;
  userId: string;
  goalId: string;
  type: SavingsMovementType;
  amount: number;
  note: string;
  date: Date;
  createdAt: Date;
}

const savingsGoalSchema = new Schema<SavingsGoalDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 0.01 },
    currentAmount: { type: Number, required: true, min: 0 },
    deadline: { type: Date, default: null },
    color: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false, collection: 'savings_goals' },
);

savingsGoalSchema.index({ userId: 1, name: 1 }, { unique: true, collation: { locale: 'es', strength: 2 } });

const savingsEntrySchema = new Schema<SavingsEntryDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    goalId: { type: String, required: true, ref: 'SavingsGoal' },
    type: { type: String, required: true, enum: SAVINGS_MOVEMENT_TYPES },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, default: '' },
    date: { type: Date, required: true },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false, collection: 'savings_entries' },
);

savingsEntrySchema.index({ userId: 1, goalId: 1, date: -1 });
savingsEntrySchema.index({ userId: 1, date: -1 });

export const SavingsGoalModel: Model<SavingsGoalDocument> =
  (models.SavingsGoal as Model<SavingsGoalDocument>) ??
  model<SavingsGoalDocument>('SavingsGoal', savingsGoalSchema);

export const SavingsEntryModel: Model<SavingsEntryDocument> =
  (models.SavingsEntry as Model<SavingsEntryDocument>) ??
  model<SavingsEntryDocument>('SavingsEntry', savingsEntrySchema);
