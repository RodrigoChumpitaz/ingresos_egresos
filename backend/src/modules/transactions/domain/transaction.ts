import { randomUUID } from 'node:crypto';
import { BusinessRuleError, ValidationError } from '../../../shared/domain/errors';
import type { MoneyType } from '../../../shared/domain/money-type';

export interface TransactionPrimitives {
  id: string;
  type: MoneyType;
  amount: number;
  description: string;
  categoryId: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryRef {
  id: string;
  type: MoneyType;
}

export class Transaction {
  private constructor(private props: TransactionPrimitives) {}

  static create(input: {
    amount: number;
    description?: string;
    date?: Date;
    category: CategoryRef;
  }): Transaction {
    const now = new Date();
    return new Transaction({
      id: randomUUID(),
      type: input.category.type,
      amount: Transaction.validateAmount(input.amount),
      description: Transaction.validateDescription(input.description ?? ''),
      categoryId: input.category.id,
      date: input.date ?? now,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPrimitives(props: TransactionPrimitives): Transaction {
    return new Transaction({ ...props });
  }

  update(changes: { amount?: number; description?: string; date?: Date; category?: CategoryRef }): void {
    if (changes.amount !== undefined) this.props.amount = Transaction.validateAmount(changes.amount);
    if (changes.description !== undefined) {
      this.props.description = Transaction.validateDescription(changes.description);
    }
    if (changes.date !== undefined) this.props.date = changes.date;
    if (changes.category !== undefined) {
      if (changes.category.type !== this.props.type) {
        throw new BusinessRuleError(
          `La categoría es de tipo ${changes.category.type} y la transacción es ${this.props.type}`,
        );
      }
      this.props.categoryId = changes.category.id;
    }
    this.props.updatedAt = new Date();
  }

  get id() { return this.props.id; }

  toPrimitives(): TransactionPrimitives {
    return { ...this.props };
  }

  private static validateAmount(amount: number): number {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ValidationError('El monto debe ser un número mayor a 0');
    }
    const cents = amount * 100;
    if (Math.abs(cents - Math.round(cents)) > 1e-9) {
      throw new ValidationError('El monto puede tener como máximo 2 decimales');
    }
    return Math.round(cents) / 100;
  }

  private static validateDescription(description: string): string {
    const trimmed = description.trim();
    if (trimmed.length > 200) {
      throw new ValidationError('La descripción no puede superar los 200 caracteres');
    }
    return trimmed;
  }
}
