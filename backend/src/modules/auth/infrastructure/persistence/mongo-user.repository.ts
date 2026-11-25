import { User } from '../../domain/user';
import type { UserRepository } from '../../domain/user-repository';
import { UserModel, type UserDocument } from './user.model';

const UserMapper = {
  toDomain(doc: UserDocument): User {
    const { _id, ...rest } = doc;
    return User.fromPrimitives({ id: _id, ...rest });
  },
  toPersistence(user: User): UserDocument {
    const { id, ...rest } = user.toPrimitives();
    return { _id: id, ...rest };
  },
};

export class MongoUserRepository implements UserRepository {
  async save(user: User): Promise<void> {
    const doc = UserMapper.toPersistence(user);
    await UserModel.replaceOne({ _id: doc._id }, doc, { upsert: true });
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).lean<UserDocument>();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.trim().toLowerCase() }).lean<UserDocument>();
    return doc ? UserMapper.toDomain(doc) : null;
  }
}
