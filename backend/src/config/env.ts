import 'dotenv/config';

export const env = {
  mongodbUri: process.env.MONGODB_URI ?? '',
  mongodbDbName: process.env.MONGODB_DB_NAME ?? 'ingreso_egresos',
  port: Number(process.env.PORT ?? 3000),
};
