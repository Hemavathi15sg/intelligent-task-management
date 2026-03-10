import { InMemoryStore } from '../../../storage/store';
import { NotFoundError } from '../../../types/errors.types';
import { UserModel } from './user.model';

/**
 * Service layer for user operations.
 * All data access goes through `InMemoryStore` — no raw queries.
 */
export class UserService {
  constructor(private readonly store: InMemoryStore) {}

  /**
   * Retrieves a user's details by their unique ID.
   *
   * @param id - The user's unique identifier (format: `usr_xxxxx`)
   * @returns The matching {@link UserModel} record
   * @throws {NotFoundError} If no user with the given ID exists
   *
   * @example
   * ```typescript
   * const service = new UserService(store);
   * const user = await service.getUserById('usr_abc123');
   * console.log(user.email);
   * ```
   */
  async getUserById(id: string): Promise<UserModel> {
    const user = await this.store.findById<UserModel>('users', id);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    return user;
  }
}
