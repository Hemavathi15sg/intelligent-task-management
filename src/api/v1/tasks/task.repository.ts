import { randomUUID } from 'crypto';
import { InMemoryStore } from '../../../storage/store';
import { NotFoundError } from '../../../types/errors.types';
import {
  AssignmentHistoryModel,
  TaskDependencyModel,
  TaskHistoryModel,
  TaskModel,
  TaskStatus,
} from './task.model';

/**
 * Data-access layer for all task-related tables.
 * All mutations go through `InMemoryStore` — no raw Map access.
 */
export class TaskRepository {
  constructor(private readonly store: InMemoryStore) {}

  // ── Tasks ────────────────────────────────────────────────────────────────

  async findTaskById(id: string): Promise<TaskModel | null> {
    return this.store.findById<TaskModel>('tasks', id);
  }

  async getTaskOrThrow(id: string): Promise<TaskModel> {
    const task = await this.findTaskById(id);
    if (!task) throw new NotFoundError('Task', id);
    return task;
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<TaskModel> {
    return this.store.update<TaskModel>('tasks', id, {
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'COMPLETED' && { actualCompletion: new Date().toISOString().split('T')[0] }),
    });
  }

  async updateTaskAssignee(id: string, assignedTo: string): Promise<TaskModel> {
    return this.store.update<TaskModel>('tasks', id, {
      assignedTo,
      updatedAt: new Date().toISOString(),
    });
  }

  // ── Task History ─────────────────────────────────────────────────────────

  async createHistoryEntry(
    entry: Omit<TaskHistoryModel, 'id' | 'changedAt'>,
  ): Promise<TaskHistoryModel> {
    const record: TaskHistoryModel = {
      id: `hist_${randomUUID().replace(/-/g, '')}`,
      changedAt: new Date().toISOString(),
      ...entry,
    };
    return this.store.create<TaskHistoryModel>('task_history', record.id, record);
  }

  async findHistoryByTaskId(taskId: string): Promise<TaskHistoryModel[]> {
    return this.store.find<TaskHistoryModel>('task_history', (h) => h.taskId === taskId);
  }

  // ── Assignment History ───────────────────────────────────────────────────

  async createAssignmentHistory(
    entry: Omit<AssignmentHistoryModel, 'id' | 'assignedAt'>,
  ): Promise<AssignmentHistoryModel> {
    const record: AssignmentHistoryModel = {
      id: `asgn_${randomUUID().replace(/-/g, '')}`,
      assignedAt: new Date().toISOString(),
      ...entry,
    };
    return this.store.create<AssignmentHistoryModel>(
      'assignment_history',
      record.id,
      record,
    );
  }

  // ── Task Dependencies ────────────────────────────────────────────────────

  async createDependency(
    entry: Omit<TaskDependencyModel, 'id' | 'createdAt' | 'deletedAt'>,
  ): Promise<TaskDependencyModel> {
    const record: TaskDependencyModel = {
      id: `dep_${randomUUID().replace(/-/g, '')}`,
      createdAt: new Date().toISOString(),
      deletedAt: null,
      ...entry,
    };
    return this.store.create<TaskDependencyModel>('task_dependencies', record.id, record);
  }

  /** Returns only active (non-deleted) dependencies where the given task is the dependent. */
  async findActiveDependenciesForTask(taskId: string): Promise<TaskDependencyModel[]> {
    return this.store.find<TaskDependencyModel>(
      'task_dependencies',
      (d) => d.dependentTaskId === taskId && d.deletedAt === null,
    );
  }

  /** Returns only active dependencies where the given task is the blocker. */
  async findActiveBlockedByTask(blockingTaskId: string): Promise<TaskDependencyModel[]> {
    return this.store.find<TaskDependencyModel>(
      'task_dependencies',
      (d) => d.blockingTaskId === blockingTaskId && d.deletedAt === null,
    );
  }

  async findDependencyById(id: string): Promise<TaskDependencyModel | null> {
    return this.store.findById<TaskDependencyModel>('task_dependencies', id);
  }

  /** Soft-deletes a dependency by setting `deletedAt`. */
  async softDeleteDependency(id: string): Promise<TaskDependencyModel> {
    return this.store.update<TaskDependencyModel>('task_dependencies', id, {
      deletedAt: new Date().toISOString(),
    });
  }

  /** Checks whether an active dependency link between these two tasks already exists. */
  async dependencyExists(blockingTaskId: string, dependentTaskId: string): Promise<boolean> {
    const existing = await this.store.find<TaskDependencyModel>(
      'task_dependencies',
      (d) =>
        d.blockingTaskId === blockingTaskId &&
        d.dependentTaskId === dependentTaskId &&
        d.deletedAt === null,
    );
    return existing.length > 0;
  }
}
