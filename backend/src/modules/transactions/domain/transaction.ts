import { randomUUID } from 'node:crypto';
import { BASE_CURRENCY, CURRENCY_CODES, type CurrencyCode } from '../../../shared/domain/currency';
import { BusinessRuleError, ValidationError } from '../../../shared/domain/errors';
import type { MoneyType } from '../../../shared/domain/money-type';

import { DEFAULT_USER_ID } from '../../categories/domain/category';

export interface TransactionPrimitives {
  id: string;
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

export interface CategoryRef {
  id: string;
  type: MoneyType;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export class Transaction {
  private constructor(private props: TransactionPrimitives) {}

  static create(input: {
    userId?: string;
    amount: number;
    currency?: CurrencyCode;
    exchangeRate?: number;
    description?: string;
    date?: Date;
    category: CategoryRef;
  }): Transaction {
    const now = new Date();
    const monetary = Transaction.resolveMonetary(input.amount, input.currency, input.exchangeRate);
    return new Transaction({
      id: randomUUID(),
      userId: input.userId ?? DEFAULT_USER_ID,
      type: input.category.type,
      ...monetary,
      description: Transaction.validateDescription(input.description ?? ''),
      categoryId: input.category.id,
      date: input.date ?? now,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPrimitives(props: TransactionPrimitives): Transaction {
    return new Transaction({ ...props, userId: props.userId ?? DEFAULT_USER_ID });
  }

  update(changes: {
    amount?: number;
    currency?: CurrencyCode;
    exchangeRate?: number;
    description?: string;
    date?: Date;
    category?: CategoryRef;
  }): void {
    if (
      changes.amount !== undefined ||
      changes.currency !== undefined ||
      changes.exchangeRate !== undefined
    ) {
      const targetCurrency = changes.currency ?? this.props.currency ?? BASE_CURRENCY;
      const baseInputAmount =
        changes.amount ??
        (targetCurrency !== BASE_CURRENCY
          ? (this.props.originalAmount ?? this.props.amount)
          : this.props.amount);
      const targetRate =
        targetCurrency === BASE_CURRENCY
          ? undefined
          : (changes.exchangeRate ?? this.props.exchangeRate);

      const monetary = Transaction.resolveMonetary(baseInputAmount, targetCurrency, targetRate);
      this.props.amount = monetary.amount;
      this.props.currency = monetary.currency;
      this.props.originalAmount = monetary.originalAmount;
      this.props.exchangeRate = monetary.exchangeRate;
    }
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
  get userId() { return this.props.userId; }

  toPrimitives(): TransactionPrimitives {
    return { ...this.props };
  }

  private static resolveMonetary(
    rawAmount: number,
    currency?: CurrencyCode,
    exchangeRate?: number,
  ): Pick<TransactionPrimitives, 'amount' | 'currency' | 'originalAmount' | 'exchangeRate'> {
    const validAmount = Transaction.validateAmount(rawAmount);
    const resolvedCurrency = currency ?? BASE_CURRENCY;
    if (!CURRENCY_CODES.includes(resolvedCurrency)) {
      throw new ValidationError(`La moneda debe ser una de: ${CURRENCY_CODES.join(', ')}`);
    }
    if (resolvedCurrency === BASE_CURRENCY) {
      return { amount: validAmount, currency: BASE_CURRENCY };
    }
    if (exchangeRate === undefined || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      throw new ValidationError('El tipo de cambio debe ser un número mayor a 0 para monedas extranjeras');
    }
    const cleanRate = Math.round(exchangeRate * 10000) / 10000;
    return {
      amount: round2(validAmount * cleanRate),
      currency: resolvedCurrency,
      originalAmount: validAmount,
      exchangeRate: cleanRate,
    };
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
