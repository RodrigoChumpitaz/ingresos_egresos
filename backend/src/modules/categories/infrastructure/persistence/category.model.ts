import { Schema, model, models, type Model } from 'mongoose';
import { MONEY_TYPES, type MoneyType } from '../../../../shared/domain/money-type';

export interface CategoryDocument {
  _id: string;
  name: string;
  type: MoneyType;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: MONEY_TYPES },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false, collection: 'categories' },
);

categorySchema.index({ name: 1, type: 1 }, { unique: true, collation: { locale: 'es', strength: 2 } });

export const CategoryModel: Model<CategoryDocument> =
  (models.Category as Model<CategoryDocument>) ?? model<CategoryDocument>('Category', categorySchema);
