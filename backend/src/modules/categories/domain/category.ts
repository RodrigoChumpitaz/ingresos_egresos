import { randomUUID } from 'node:crypto';
import { ValidationError } from '../../../shared/domain/errors';
import { MONEY_TYPES, type MoneyType } from '../../../shared/domain/money-type';

export interface CategoryPrimitives {
  id: string;
  name: string;
  type: MoneyType;
  createdAt: Date;
  updatedAt: Date;
}

export class Category {
  private constructor(private props: CategoryPrimitives) {}

  static create(input: { name: string; type: MoneyType }): Category {
    const now = new Date();
    return new Category({
      id: randomUUID(),
      name: Category.validateName(input.name),
      type: Category.validateType(input.type),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPrimitives(props: CategoryPrimitives): Category {
    return new Category({ ...props });
  }

  rename(name: string): void {
    this.props.name = Category.validateName(name);
    this.props.updatedAt = new Date();
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get type() { return this.props.type; }

  toPrimitives(): CategoryPrimitives {
    return { ...this.props };
  }

  private static validateName(name: string): string {
    const trimmed = name?.trim() ?? '';
    if (trimmed.length < 2 || trimmed.length > 50) {
      throw new ValidationError('El nombre de la categoría debe tener entre 2 y 50 caracteres');
    }
    return trimmed;
  }

  private static validateType(type: MoneyType): MoneyType {
    if (!MONEY_TYPES.includes(type)) {
      throw new ValidationError(`El tipo debe ser uno de: ${MONEY_TYPES.join(', ')}`);
    }
    return type;
  }
}
