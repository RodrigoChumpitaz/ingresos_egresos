import { Schema, model, models, type Model } from 'mongoose';
import { MONEY_TYPES, type MoneyType } from '../../../../shared/domain/money-type';

export interface TransactionDocument {
  _id: string;
  type: MoneyType;
  amount: number;
  description: string;
  categoryId: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    _id: { type: String, required: true },
    type: { type: String, required: true, enum: MONEY_TYPES },
    amount: { type: Number, required: true, min: 0.01 },
    description: { type: String, default: '' },
    categoryId: { type: String, required: true, ref: 'Category' },
    date: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false, collection: 'transactions' },
);

transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ categoryId: 1 });

export const TransactionModel: Model<TransactionDocument> =
  (models.Transaction as Model<TransactionDocument>) ??
  model<TransactionDocument>('Transaction', transactionSchema);
