import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { SavingsGoal } from '../src/modules/savings/domain/savings-goal';
import { InMemorySavingsRepository } from '../src/modules/savings/infrastructure/persistence/in-memory-savings.repository';
import { CreateSavingsGoalUseCase } from '../src/modules/savings/application/create-savings-goal.use-case';
import { DeleteSavingsGoalUseCase } from '../src/modules/savings/application/delete-savings-goal.use-case';
import { RecordSavingsMovementUseCase } from '../src/modules/savings/application/record-savings-movement.use-case';
import { CreateCategoryUseCase } from '../src/modules/categories/application/create-category.use-case';
import { InMemoryCategoryRepository } from '../src/modules/categories/infrastructure/persistence/in-memory-category.repository';
import { CreateTransactionUseCase } from '../src/modules/transactions/application/create-transaction.use-case';
import { GetSummaryUseCase } from '../src/modules/transactions/application/get-summary.use-case';
import { InMemoryTransactionRepository } from '../src/modules/transactions/infrastructure/persistence/in-memory-transaction.repository';
import { BusinessRuleError, ValidationError } from '../src/shared/domain/errors';

describe('SavingsGoal domain', () => {
  it('creates a valid goal and records contributions and withdrawals', () => {
    const goal = SavingsGoal.create({ name: 'Fondo de emergencia', targetAmount: 5000 });
    expect(goal.toPrimitives().currentAmount).toBe(0);

    const contribution = goal.contribute(500, 'Aporte noviembre');
    expect(contribution.type).toBe('CONTRIBUTION');
    expect(goal.toPrimitives().currentAmount).toBe(500);

    const withdrawal = goal.withdraw(200, 'Emergencia menor');
    expect(withdrawal.type).toBe('WITHDRAWAL');
    expect(goal.toPrimitives().currentAmount).toBe(300);
  });

  it('rejects invalid amounts and withdrawals exceeding currentAmount', () => {
    const goal = SavingsGoal.create({ name: 'Laptop', targetAmount: 3000 });
    expect(() => goal.contribute(0)).toThrow(ValidationError);
    expect(() => goal.contribute(10.123)).toThrow(ValidationError);
    goal.contribute(100);
    expect(() => goal.withdraw(150)).toThrow(BusinessRuleError);
  });
});

describe('Savings use cases & Summary integration', () => {
  it('computes allocatedSavings and realAvailable without inflating expenses', async () => {
    const categories = new InMemoryCategoryRepository();
    const transactions = new InMemoryTransactionRepository();
    const savings = new InMemorySavingsRepository();

    const createCat = new CreateCategoryUseCase(categories);
    const createTx = new CreateTransactionUseCase(transactions, categories);
    const createGoal = new CreateSavingsGoalUseCase(savings);
    const recordMove = new RecordSavingsMovementUseCase(savings);
    const deleteGoal = new DeleteSavingsGoalUseCase(savings);
    const getSummary = new GetSummaryUseCase(transactions, categories, savings);

    const sueldo = await createCat.execute({ name: 'Sueldo', type: 'INCOME' });
    const comida = await createCat.execute({ name: 'Comida', type: 'EXPENSE' });

    await createTx.execute({
      amount: 2000,
      categoryId: sueldo.id,
      date: new Date('2026-11-05T12:00:00Z'),
    });
    await createTx.execute({
      amount: 400,
      categoryId: comida.id,
      date: new Date('2026-11-06T12:00:00Z'),
    });

    const goal = await createGoal.execute({ name: 'Emergencia', targetAmount: 5000 });
    await recordMove.execute({
      goalId: goal.id,
      type: 'CONTRIBUTION',
      amount: 500,
      date: new Date('2026-11-10T12:00:00Z'),
    });

    // Intentar borrar meta con saldo > 0 debe fallar con BusinessRuleError
    await expect(deleteGoal.execute(goal.id)).rejects.toThrow(BusinessRuleError);

    const summary = await getSummary.execute({
      from: new Date('2026-11-01T00:00:00.000Z'),
      to: new Date('2026-11-30T23:59:59.999Z'),
    });

    expect(summary.totalIncome).toBe(2000);
    expect(summary.totalExpense).toBe(400);
    expect(summary.netSavings).toBe(1600);
    expect(summary.allocatedSavings).toBe(500);
    expect(summary.realAvailable).toBe(1100);
    expect(summary.totalSavingsBalance).toBe(500);
  });
});

describe('Savings HTTP API integration', () => {
  let createApp: typeof import('../src/app').createApp;

  beforeAll(async () => {
    process.env.STORAGE_MODE = 'memory';
    ({ createApp } = await import('../src/app'));
  });

  it('creates goal, contributes, withdraws, blocks deleting non-empty goal, and deletes when empty', async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/login').send({ email: 'demo@finanza.local', password: 'Demo1234!' }).expect(200);

    const created = await agent
      .post('/api/v1/savings-goals')
      .send({ name: 'Viaje Cusco', targetAmount: 2500 });
    expect(created.status).toBe(201);
    expect(created.body.currentAmount).toBe(0);

    const contrib = await agent
      .post(`/api/v1/savings-goals/${created.body.id}/movements`)
      .send({ type: 'CONTRIBUTION', amount: 400, note: 'Primer aporte' });
    expect(contrib.status).toBe(201);
    expect(contrib.body.goal.currentAmount).toBe(400);

    const blockedDelete = await agent.delete(`/api/v1/savings-goals/${created.body.id}`);
    expect(blockedDelete.status).toBe(422);

    const withdraw = await agent
      .post(`/api/v1/savings-goals/${created.body.id}/movements`)
      .send({ type: 'WITHDRAWAL', amount: 400, note: 'Retiro total' });
    expect(withdraw.status).toBe(201);
    expect(withdraw.body.goal.currentAmount).toBe(0);

    const deleted = await agent.delete(`/api/v1/savings-goals/${created.body.id}`);
    expect(deleted.status).toBe(204);
  });
});
