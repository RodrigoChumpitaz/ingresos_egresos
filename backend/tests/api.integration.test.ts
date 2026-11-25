import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

let createApp: typeof import('../src/app').createApp;

beforeAll(async () => {
  process.env.STORAGE_MODE = 'memory';
  ({ createApp } = await import('../src/app'));
});

describe('HTTP API integration (memory mode)', () => {
  it('returns health status with storageMode=memory', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.storageMode).toBe('memory');
  });

  it('enforces category rules: create 201, duplicate 409, delete in-use 422, delete unused 204', async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/login').send({ email: 'demo@finanza.local', password: 'Demo1234!' }).expect(200);

    const created = await agent
      .post('/api/v1/categories')
      .send({ name: 'Bonos', type: 'INCOME' });
    expect(created.status).toBe(201);

    const duplicate = await agent
      .post('/api/v1/categories')
      .send({ name: 'bonos', type: 'INCOME' });
    expect(duplicate.status).toBe(409);

    const unused = await agent
      .post('/api/v1/categories')
      .send({ name: 'Temporal', type: 'EXPENSE' });
    expect(unused.status).toBe(201);

    const deletedUnused = await agent.delete(`/api/v1/categories/${unused.body.id}`);
    expect(deletedUnused.status).toBe(204);

    // Crear movimiento en "Bonos" y verificar bloqueo 422
    const tx = await agent
      .post('/api/v1/transactions')
      .send({ amount: 500, categoryId: created.body.id, description: 'Bono anual' });
    expect(tx.status).toBe(201);

    const blockedDelete = await agent.delete(`/api/v1/categories/${created.body.id}`);
    expect(blockedDelete.status).toBe(422);
  });

  it('handles foreign currency transactions, search ?q=, date validation, and summary/trend', async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent.post('/api/v1/auth/login').send({ email: 'demo@finanza.local', password: 'Demo1234!' }).expect(200);

    const catsRes = await agent.get('/api/v1/categories');
    expect(catsRes.status).toBe(200);
    const incomeCat = catsRes.body.find((c: { type: string }) => c.type === 'INCOME');
    const expenseCat = catsRes.body.find((c: { type: string }) => c.type === 'EXPENSE');

    const createdUsd = await agent.post('/api/v1/transactions').send({
      amount: 100,
      currency: 'USD',
      exchangeRate: 3.5,
      categoryId: incomeCat.id,
      description: 'Pago cliente prueba',
      date: '2026-11-12T12:00:00.000Z',
    });
    expect(createdUsd.status).toBe(201);
    expect(createdUsd.body.amount).toBe(350);
    expect(createdUsd.body.originalAmount).toBe(100);
    expect(createdUsd.body.currency).toBe('USD');

    // Cambiar a categoría de otro tipo falla con 422
    const invalidMove = await agent
      .patch(`/api/v1/transactions/${createdUsd.body.id}`)
      .send({ categoryId: expenseCat.id });
    expect(invalidMove.status).toBe(422);

    // Búsqueda por texto ?q=
    const searched = await agent.get('/api/v1/transactions?q=cliente%20prueba');
    expect(searched.status).toBe(200);
    expect(searched.body.total).toBe(1);
    expect(searched.body.items[0].id).toBe(createdUsd.body.id);

    // Rango invertido from > to falla con 400
    const badRange = await agent.get(
      '/api/v1/transactions?from=2026-11-20&to=2026-11-01',
    );
    expect(badRange.status).toBe(400);

    // Summary con compare=prev y trend
    const summaryRes = await agent.get(
      '/api/v1/summary?from=2026-11-01&to=2026-11-18&compare=prev',
    );
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body).toHaveProperty('netSavings');
    expect(summaryRes.body).toHaveProperty('savingsRate');
    expect(summaryRes.body).toHaveProperty('comparison');

    const trendRes = await agent.get(
      '/api/v1/summary/trend?from=2026-11-01&to=2026-11-18',
    );
    expect(trendRes.status).toBe(200);
    expect(trendRes.body.granularity).toBe('day');
    expect(trendRes.body.points.length).toBe(18);
  });
});
