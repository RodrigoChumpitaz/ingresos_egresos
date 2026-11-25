import { UnauthorizedError } from '../../../shared/domain/errors';
import type { PublicUser } from '../domain/user';
import type { UserRepository } from '../domain/user-repository';

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError('Sesión inválida o expirada');
    return user.toPublic();
  }
}
