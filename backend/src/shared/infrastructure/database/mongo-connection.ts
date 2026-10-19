import mongoose from 'mongoose';
import { env } from '../../../config/env';

export class MongoConnection {
  private static connection: Promise<typeof mongoose> | null = null;

  static connect(): Promise<typeof mongoose> {
    if (!env.mongodbUri) {
      throw new Error('Falta la variable de entorno MONGODB_URI');
    }

    if (!MongoConnection.connection) {
      MongoConnection.connection = mongoose
        .connect(env.mongodbUri, { dbName: env.mongodbDbName, serverSelectionTimeoutMS: 10_000 })
        .catch((error) => {
          MongoConnection.connection = null;
          throw error;
        });
    }

    return MongoConnection.connection;
  }

  static async disconnect(): Promise<void> {
    await mongoose.disconnect();
    MongoConnection.connection = null;
  }
}
