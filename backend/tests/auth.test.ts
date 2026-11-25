import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/modules/auth/domain/password';

describe('Password hashing (scrypt)', () => {
  it('hashes with random salt and verifies matching vs non-matching passwords', () => {
    const hash1 = hashPassword('Secret123!');
    const hash2 = hashPassword('Secret123!');

    expect(hash1).not.toBe(hash2);
    expect(verifyPassword('Secret123!', hash1)).toBe(true);
    expect(verifyPassword('WrongPass!', hash1)).toBe(false);
  });
});

describe('Auth & Multi-user isolation (IDOR protection)', () => {
  let createApp: typeof import('../src/app').createApp;

  beforeAll(async () => {
    process.env.STORAGE_MODE = 'memory';
    process.env.AUTH_SECRET = 'test-auth-secret-minimum-32-chars-ok';
    ({ createApp } = await import('../src/app'));
  });

  it('rejects unauthenticated access to protected endpoints with 401', async () => {
    const app = createApp();

    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/categories')).status).toBe(401);
    expect((await request(app).get('/api/v1/transactions')).status).toBe(401);
    expect((await request(app).get('/api/v1/summary')).status).toBe(401);
    expect((await request(app).get('/api/v1/savings-goals')).status).toBe(401);
  });

  it('logs in pre-seeded demo user via httpOnly cookie and logs out cleanly', async () => {
    const app = createApp();
    const agent = request.agent(app);

    const loginRes = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'demo@finanza.local', password: 'Demo1234!' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.email).toBe('demo@finanza.local');
    expect(loginRes.body.user).not.toHaveProperty('passwordHash');
    expect(loginRes.headers['set-cookie']?.[0]).toContain('HttpOnly');

    const meRes = await agent.get('/api/v1/auth/me');
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe('demo@finanza.local');

    const catsRes = await agent.get('/api/v1/categories');
    expect(catsRes.status).toBe(200);
    expect(catsRes.body.length).toBeGreaterThan(0);

    await agent.post('/api/v1/auth/logout').expect(204);
    expect((await agent.get('/api/v1/auth/me')).status).toBe(401);
  });

  it('isolates categories, transactions, savings goals, and summary strictly by userId', async () => {
    const app = createApp();
    const userA = request.agent(app);
    const userB = request.agent(app);

    const regA = await userA
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ana@example.com', password: 'Password1!' });
    expect(regA.status).toBe(201);

    const regB = await userB
      .post('/api/v1/auth/register')
      .send({ name: 'Beto', email: 'beto@example.com', password: 'Password1!' });
    expect(regB.status).toBe(201);

    // Registro duplicado falla con 409
    const dup = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana 2', email: 'ANA@example.com', password: 'Password1!' });
    expect(dup.status).toBe(409);

    // Ana crea categoría, transacción y meta de ahorro
    const catA = await userA.post('/api/v1/categories').send({ name: 'Salario', type: 'INCOME' });
    expect(catA.status).toBe(201);

    const txA = await userA
      .post('/api/v1/transactions')
      .send({ amount: 1500, categoryId: catA.body.id, description: 'Sueldo Ana' });
    expect(txA.status).toBe(201);

    const goalA = await userA
      .post('/api/v1/savings-goals')
      .send({ name: 'Meta Ana', targetAmount: 2000 });
    expect(goalA.status).toBe(201);

    // Beto NO ve ni puede acceder o modificar los recursos de Ana (IDOR)
    expect((await userB.get('/api/v1/categories')).body).toEqual([]);
    expect((await userB.get('/api/v1/transactions')).body.total).toBe(0);
    expect((await userB.get('/api/v1/savings-goals')).body).toEqual([]);
    expect((await userB.get('/api/v1/summary')).body.totalIncome).toBe(0);

    expect((await userB.get(`/api/v1/transactions/${txA.body.id}`)).status).toBe(404);
    expect(
      (await userB.patch(`/api/v1/categories/${catA.body.id}`).send({ name: 'Hack' })).status,
    ).toBe(404);
    expect((await userB.delete(`/api/v1/savings-goals/${goalA.body.id}`)).status).toBe(404);
    expect(
      (
        await userB
          .post(`/api/v1/savings-goals/${goalA.body.id}/movements`)
          .send({ type: 'CONTRIBUTION', amount: 100 })
      ).status,
    ).toBe(404);
  });
});
