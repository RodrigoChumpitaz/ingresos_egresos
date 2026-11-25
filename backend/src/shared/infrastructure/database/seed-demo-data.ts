import { User } from '../../../modules/auth/domain/user';
import { Category, DEFAULT_USER_ID } from '../../../modules/categories/domain/category';
import { SavingsGoal, type SavingsEntryPrimitives } from '../../../modules/savings/domain/savings-goal';
import { Transaction } from '../../../modules/transactions/domain/transaction';

export const DEMO_USER_CONFIG = {
  id: DEFAULT_USER_ID,
  name: 'Usuario Demo',
  email: 'demo@finanza.local',
  password: 'Demo1234!',
} as const;

function daysAgo(days: number): Date {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

export function createDemoSeed(userId: string = DEMO_USER_CONFIG.id): {
  demoUser: User;
  categories: Category[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  savingsEntries: SavingsEntryPrimitives[];
} {
  const demoUser = User.create({
    id: userId,
    name: DEMO_USER_CONFIG.name,
    email: DEMO_USER_CONFIG.email,
    password: DEMO_USER_CONFIG.password,
  });

  const sueldo = Category.create({ name: 'Sueldo', type: 'INCOME', userId });
  const freelance = Category.create({ name: 'Freelance', type: 'INCOME', userId });
  const comida = Category.create({ name: 'Alimentación', type: 'EXPENSE', userId });
  const servicios = Category.create({ name: 'Servicios', type: 'EXPENSE', userId });
  const transporte = Category.create({ name: 'Transporte', type: 'EXPENSE', userId });
  const entretenimiento = Category.create({ name: 'Entretenimiento', type: 'EXPENSE', userId });
  const salud = Category.create({ name: 'Salud', type: 'EXPENSE', userId });

  const categories = [sueldo, freelance, comida, servicios, transporte, entretenimiento, salud];

  const entries: Array<Parameters<typeof Transaction.create>[0]> = [
    { userId, amount: 3200, description: 'Sueldo mensual', date: daysAgo(15), category: { id: sueldo.id, type: sueldo.type } },
    { userId, amount: 250, currency: 'USD', exchangeRate: 3.41, description: 'Consultoría diseño UI (USD)', date: daysAgo(8), category: { id: freelance.id, type: freelance.type } },
    { userId, amount: 420.5, description: 'Supermercado semanal', date: daysAgo(12), category: { id: comida.id, type: comida.type } },
    { userId, amount: 280, description: 'Luz, agua e internet', date: daysAgo(10), category: { id: servicios.id, type: servicios.type } },
    { userId, amount: 145, description: 'Movilidad y combustible', date: daysAgo(6), category: { id: transporte.id, type: transporte.type } },
    { userId, amount: 310, description: 'Entradas concierto', date: daysAgo(4), category: { id: entretenimiento.id, type: entretenimiento.type } },
    { userId, amount: 195.8, description: 'Almuerzos y mercado', date: daysAgo(2), category: { id: comida.id, type: comida.type } },
    { userId, amount: 120, description: 'Farmacia y chequeo', date: daysAgo(1), category: { id: salud.id, type: salud.type } },

    { userId, amount: 3200, description: 'Sueldo mes anterior', date: daysAgo(45), category: { id: sueldo.id, type: sueldo.type } },
    { userId, amount: 650, description: 'Proyecto web freelance', date: daysAgo(38), category: { id: freelance.id, type: freelance.type } },
    { userId, amount: 540, description: 'Compras del mes', date: daysAgo(42), category: { id: comida.id, type: comida.type } },
    { userId, amount: 275, description: 'Recibos del hogar', date: daysAgo(40), category: { id: servicios.id, type: servicios.type } },
    { userId, amount: 210, description: 'Transporte mensual', date: daysAgo(35), category: { id: transporte.id, type: transporte.type } },
    { userId, amount: 480, description: 'Salidas fin de semana', date: daysAgo(32), category: { id: entretenimiento.id, type: entretenimiento.type } },

    { userId, amount: 3000, description: 'Sueldo hace 2 meses', date: daysAgo(75), category: { id: sueldo.id, type: sueldo.type } },
    { userId, amount: 490, description: 'Alimentación general', date: daysAgo(70), category: { id: comida.id, type: comida.type } },
    { userId, amount: 265, description: 'Servicios básicos', date: daysAgo(68), category: { id: servicios.id, type: servicios.type } },
    { userId, amount: 190, description: 'Transporte y taxis', date: daysAgo(63), category: { id: transporte.id, type: transporte.type } },
  ];

  const transactions = entries.map((entry) => Transaction.create(entry));

  const emergencyGoal = SavingsGoal.create({
    userId,
    name: 'Fondo de emergencia',
    targetAmount: 6000,
    color: '#6366f1',
  });
  const laptopGoal = SavingsGoal.create({
    userId,
    name: 'Laptop / Equipo de trabajo',
    targetAmount: 3500,
    color: '#10b981',
  });

  const savingsEntries: SavingsEntryPrimitives[] = [
    emergencyGoal.contribute(1200, 'Reserva inicial', daysAgo(40)),
    emergencyGoal.contribute(650, 'Aporte mensual noviembre', daysAgo(5)),
    laptopGoal.contribute(400, 'Apartado freelance', daysAgo(7)),
  ];

  return {
    demoUser,
    categories,
    transactions,
    savingsGoals: [emergencyGoal, laptopGoal],
    savingsEntries,
  };
}
