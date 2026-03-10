import { InMemoryStore } from '../../../storage/store';
import { NotFoundError } from '../../../types/errors.types';
import { UserModel } from './user.model';
import { UserService } from './user.service';

const SEED_USER: UserModel = {
  id: 'usr_abc123',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: '$2b$10$hashedpassword',
  role: 'user',
  isActive: true,
  createdAt: '2026-03-09T10:00:00Z',
  updatedAt: '2026-03-09T10:00:00Z',
};

describe('UserService', () => {
  let store: InMemoryStore;
  let userService: UserService;

  beforeEach(async () => {
    store = InMemoryStore.getInstance();
    store.clear();
    userService = new UserService(store);

    // Seed one user for look-up tests
    await store.create<UserModel>('users', SEED_USER.id, SEED_USER);
  });

  describe('getUserById', () => {
    it('returns the user when the ID exists', async () => {
      const user = await userService.getUserById('usr_abc123');

      expect(user).toEqual(SEED_USER);
    });

    it('returns the correct user when multiple users are stored', async () => {
      const second: UserModel = {
        ...SEED_USER,
        id: 'usr_xyz789',
        email: 'jane.doe@example.com',
        firstName: 'Jane',
      };
      await store.create<UserModel>('users', second.id, second);

      const user = await userService.getUserById('usr_xyz789');

      expect(user.id).toBe('usr_xyz789');
      expect(user.email).toBe('jane.doe@example.com');
    });

    it('throws NotFoundError when the ID does not exist', async () => {
      await expect(userService.getUserById('usr_nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('throws NotFoundError with the correct message', async () => {
      await expect(userService.getUserById('usr_nonexistent'))
        .rejects
        .toThrow("User with ID 'usr_nonexistent' not found");
    });

    it('throws NotFoundError after the store is cleared', async () => {
      store.clear();

      await expect(userService.getUserById('usr_abc123'))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
