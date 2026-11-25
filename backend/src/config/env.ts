import 'dotenv/config';

export type StorageMode = 'memory' | 'mongo';

const rawMode = process.env.STORAGE_MODE?.toLowerCase();
const storageMode: StorageMode =
  rawMode === 'memory' || rawMode === 'mongo'
    ? rawMode
    : process.env.MONGODB_URI
      ? 'mongo'
      : 'memory';

const isProduction = process.env.NODE_ENV === 'production';

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : defaultOrigins;

export const env = {
  mongodbUri: process.env.MONGODB_URI ?? '',
  mongodbDbName: process.env.MONGODB_DB_NAME ?? 'ingreso_egresos',
  port: Number(process.env.PORT ?? 3000),
  storageMode,
  isProduction,
  authSecret:
    process.env.AUTH_SECRET ??
    (isProduction ? '' : 'finanza-local-dev-secret-change-me-32-chars'),
  corsOrigins,
};
