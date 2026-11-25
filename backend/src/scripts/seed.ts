import { MongoUserRepository } from '../modules/auth/infrastructure/persistence/mongo-user.repository';
import { CategoryModel } from '../modules/categories/infrastructure/persistence/category.model';
import { MongoCategoryRepository } from '../modules/categories/infrastructure/persistence/mongo-category.repository';
import { MongoSavingsRepository } from '../modules/savings/infrastructure/persistence/mongo-savings.repository';
import { SavingsEntryModel, SavingsGoalModel } from '../modules/savings/infrastructure/persistence/savings.model';
import { MongoTransactionRepository } from '../modules/transactions/infrastructure/persistence/mongo-transaction.repository';
import { TransactionModel } from '../modules/transactions/infrastructure/persistence/transaction.model';
import { MongoConnection } from '../shared/infrastructure/database/mongo-connection';
import { createDemoSeed, DEMO_USER_CONFIG } from '../shared/infrastructure/database/seed-demo-data';

async function runSeed() {
  await MongoConnection.connect();

  const userRepo = new MongoUserRepository();
  const categoryRepo = new MongoCategoryRepository();
  const transactionRepo = new MongoTransactionRepository();
  const savingsRepo = new MongoSavingsRepository();

  const seed = createDemoSeed(DEMO_USER_CONFIG.id);

  // 1. Asegurar usuario demo
  const existingUser = await userRepo.findByEmail(DEMO_USER_CONFIG.email);
  const demoUserId = existingUser?.id ?? seed.demoUser.id;
  if (!existingUser) {
    await userRepo.save(seed.demoUser);
    console.log(`Usuario demo creado: ${DEMO_USER_CONFIG.email} / ${DEMO_USER_CONFIG.password}`);
  } else {
    console.log(`Usuario demo existente: ${existingUser.email}`);
  }

  // 2. Migrar registros legados sin userId hacia el usuario demo
  await Promise.all([
    CategoryModel.updateMany({ userId: { $exists: false } }, { $set: { userId: demoUserId } }),
    TransactionModel.updateMany({ userId: { $exists: false } }, { $set: { userId: demoUserId } }),
    SavingsGoalModel.updateMany({ userId: { $exists: false } }, { $set: { userId: demoUserId } }),
    SavingsEntryModel.updateMany({ userId: { $exists: false } }, { $set: { userId: demoUserId } }),
  ]);

  // 3. Poblar datos demo si el usuario demo aún no tiene categorías
  const existingCats = await categoryRepo.findAll({ userId: demoUserId });
  if (existingCats.length === 0) {
    const userSeed = createDemoSeed(demoUserId);
    for (const cat of userSeed.categories) await categoryRepo.save(cat);
    for (const tx of userSeed.transactions) await transactionRepo.save(tx);
    for (const goal of userSeed.savingsGoals) await savingsRepo.saveGoal(goal);
    for (const entry of userSeed.savingsEntries) await savingsRepo.saveEntry(entry);
    console.log(
      `Datos demo insertados: ${userSeed.categories.length} categorías, ${userSeed.transactions.length} transacciones, ${userSeed.savingsGoals.length} metas.`,
    );
  } else {
    console.log(`El usuario demo ya tiene ${existingCats.length} categorías; se omitió inserción duplicada.`);
  }

  await MongoConnection.disconnect();
}

runSeed().catch(async (err) => {
  console.error('Error al ejecutar seed:', err);
  await MongoConnection.disconnect().catch(() => {});
  process.exit(1);
});
