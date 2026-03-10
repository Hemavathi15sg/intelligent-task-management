import { ConflictError } from '../types/errors.types';
import { NotFoundError } from '../types/errors.types';

/**
 * Thread-safe singleton in-memory data store.
 * Each "table" is a `Map<id, record>` keyed by string ID.
 *
 * @example
 * ```typescript
 * const store = InMemoryStore.getInstance();
 * await store.create('users', 'usr_1', { id: 'usr_1', email: 'a@b.com' });
 * const user = await store.findById('users', 'usr_1');
 * ```
 */
export class InMemoryStore {
  private static instance: InMemoryStore;
  private data: Map<string, Map<string, unknown>> = new Map();

  private constructor() {
    this.initializeTables();
  }

  /**
   * Returns the singleton store instance, creating it on first call.
   */
  static getInstance(): InMemoryStore {
    if (!InMemoryStore.instance) {
      InMemoryStore.instance = new InMemoryStore();
    }
    return InMemoryStore.instance;
  }

  private initializeTables(): void {
    this.data.set('users', new Map());
    this.data.set('tasks', new Map());
    this.data.set('task_dependencies', new Map());
    this.data.set('task_history', new Map());
    this.data.set('assignment_history', new Map());
  }

  /**
   * Returns a typed reference to the named table.
   *
   * @param tableName - The name of the table to retrieve
   * @throws {Error} If the table does not exist
   */
  getTable<T>(tableName: string): Map<string, T> {
    const table = this.data.get(tableName);
    if (!table) {
      throw new Error(`Table '${tableName}' not found`);
    }
    return table as Map<string, T>;
  }

  /**
   * Returns all records in a table, optionally filtered by a predicate.
   *
   * @param tableName - The table to query
   * @param predicate - Optional filter function
   */
  async find<T>(tableName: string, predicate?: (item: T) => boolean): Promise<T[]> {
    const table = this.getTable<T>(tableName);
    const items = Array.from(table.values());
    return predicate ? items.filter(predicate) : items;
  }

  /**
   * Returns a single record by ID, or `null` if not found.
   *
   * @param tableName - The table to query
   * @param id - The record's unique identifier
   */
  async findById<T>(tableName: string, id: string): Promise<T | null> {
    const table = this.getTable<T>(tableName);
    return table.get(id) ?? null;
  }

  /**
   * Inserts a new record into a table.
   *
   * @param tableName - Target table
   * @param id - Unique identifier for the new record
   * @param data - The record to store
   * @throws {ConflictError} If a record with the same ID already exists
   */
  async create<T>(tableName: string, id: string, data: T): Promise<T> {
    const table = this.getTable<T>(tableName);
    if (table.has(id)) {
      throw new ConflictError(`${tableName} with ID '${id}' already exists`);
    }
    table.set(id, data);
    return data;
  }

  /**
   * Merges partial data into an existing record.
   *
   * @param tableName - Target table
   * @param id - ID of the record to update
   * @param data - Partial fields to merge
   * @throws {NotFoundError} If no record with the given ID exists
   */
  async update<T>(tableName: string, id: string, data: Partial<T>): Promise<T> {
    const table = this.getTable<T>(tableName);
    const existing = table.get(id);
    if (!existing) {
      throw new NotFoundError(tableName, id);
    }
    const updated = { ...existing, ...data } as T;
    table.set(id, updated);
    return updated;
  }

  /**
   * Removes a record from a table.
   *
   * @param tableName - Target table
   * @param id - ID of the record to delete
   * @returns `true` if the record was deleted, `false` if it did not exist
   */
  async delete(tableName: string, id: string): Promise<boolean> {
    const table = this.getTable(tableName);
    return table.delete(id);
  }

  /**
   * Returns the number of records in a table.
   *
   * @param tableName - The table to count
   */
  async count(tableName: string): Promise<number> {
    return this.data.get(tableName)?.size ?? 0;
  }

  /**
   * Clears all data and re-initializes tables.
   * Intended for use in tests only.
   */
  clear(): void {
    this.data.clear();
    this.initializeTables();
  }
}

export const store = InMemoryStore.getInstance();
