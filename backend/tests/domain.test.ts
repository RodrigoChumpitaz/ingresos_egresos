import { describe, expect, it } from 'vitest';
import { Category } from '../src/modules/categories/domain/category';
import { Transaction } from '../src/modules/transactions/domain/transaction';
import { BusinessRuleError, ValidationError } from '../src/shared/domain/errors';

describe('Category domain entity', () => {
  it('creates a valid category trimming whitespace from name', () => {
    const category = Category.create({ name: '  Alimentación  ', type: 'EXPENSE' });

    expect(category.id).toBeTruthy();
    expect(category.name).toBe('Alimentación');
    expect(category.type).toBe('EXPENSE');
  });

  it('rejects names shorter than 2 characters or longer than 50', () => {
    expect(() => Category.create({ name: 'A', type: 'INCOME' })).toThrow(ValidationError);
    expect(() => Category.create({ name: 'x'.repeat(51), type: 'INCOME' })).toThrow(ValidationError);
  });

  it('renames a category and rejects invalid names', () => {
    const category = Category.create({ name: 'Sueldo', type: 'INCOME' });
    category.rename('  Salario neto ');
    expect(category.name).toBe('Salario neto');
    expect(() => category.rename(' ')).toThrow(ValidationError);
  });
});

describe('Transaction domain entity', () => {
  const incomeCategory = { id: 'cat-income', type: 'INCOME' as const };
  const expenseCategory = { id: 'cat-expense', type: 'EXPENSE' as const };

  it('inherits type from category and defaults currency to PEN', () => {
    const tx = Transaction.create({
      amount: 125.5,
      description: '  Supermercado  ',
      category: expenseCategory,
    }).toPrimitives();

    expect(tx.type).toBe('EXPENSE');
    expect(tx.amount).toBe(125.5);
    expect(tx.currency).toBe('PEN');
    expect(tx.description).toBe('Supermercado');
  });

  it('rejects non-positive amounts, >2 decimals, and descriptions >200 chars', () => {
    expect(() => Transaction.create({ amount: 0, category: expenseCategory })).toThrow(ValidationError);
    expect(() => Transaction.create({ amount: -10, category: expenseCategory })).toThrow(ValidationError);
    expect(() => Transaction.create({ amount: 10.123, category: expenseCategory })).toThrow(ValidationError);
    expect(() =>
      Transaction.create({ amount: 10, description: 'a'.repeat(201), category: expenseCategory }),
    ).toThrow(ValidationError);
  });

  it('computes base PEN amount and freezes originalAmount/exchangeRate for foreign currency', () => {
    const tx = Transaction.create({
      amount: 100,
      currency: 'USD',
      exchangeRate: 3.41,
      description: 'Consultoría USD',
      category: incomeCategory,
    }).toPrimitives();

    expect(tx.amount).toBe(341);
    expect(tx.currency).toBe('USD');
    expect(tx.originalAmount).toBe(100);
    expect(tx.exchangeRate).toBe(3.41);
  });

  it('requires a positive exchangeRate when currency is not PEN', () => {
    expect(() =>
      Transaction.create({ amount: 100, currency: 'USD', category: incomeCategory }),
    ).toThrow(ValidationError);
    expect(() =>
      Transaction.create({ amount: 100, currency: 'USD', exchangeRate: 0, category: incomeCategory }),
    ).toThrow(ValidationError);
  });

  it('throws BusinessRuleError when changing category to opposite MoneyType', () => {
    const tx = Transaction.create({ amount: 50, category: expenseCategory });
    expect(() => tx.update({ category: incomeCategory })).toThrow(BusinessRuleError);
  });

  it('clears originalAmount and exchangeRate when updating currency back to PEN', () => {
    const tx = Transaction.create({
      amount: 100,
      currency: 'USD',
      exchangeRate: 3.41,
      category: incomeCategory,
    });

    tx.update({ currency: 'PEN', amount: 350 });
    const updated = tx.toPrimitives();

    expect(updated.currency).toBe('PEN');
    expect(updated.amount).toBe(350);
    expect(updated.originalAmount).toBeUndefined();
    expect(updated.exchangeRate).toBeUndefined();
  });
});
