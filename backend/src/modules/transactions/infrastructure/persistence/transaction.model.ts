import { Schema, model, models, type Model } from 'mongoose';
import { CURRENCY_CODES, type CurrencyCode } from '../../../../shared/domain/currency';
import { MONEY_TYPES, type MoneyType } from '../../../../shared/domain/money-type';

export interface TransactionDocument {
  _id: string;
  userId: string;
  type: MoneyType;
  amount: number;
  currency?: CurrencyCode;
  originalAmount?: number;
  exchangeRate?: number;
  description: string;
  categoryId: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: MONEY_TYPES },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, enum: CURRENCY_CODES, default: 'PEN' },
    originalAmount: { type: Number, min: 0.01 },
    exchangeRate: { type: Number, min: 0.0001 },
    description: { type: String, default: '' },
    categoryId: { type: String, required: true, ref: 'Category' },
    date: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false, collection: 'transactions' },
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1 });

export const TransactionModel: Model<TransactionDocument> =
  (models.Transaction as Model<TransactionDocument>) ??
  model<TransactionDocument>('Transaction', transactionSchema);
