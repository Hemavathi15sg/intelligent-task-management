import { randomUUID } from 'crypto';
import { InMemoryStore } from '../../../storage/store';
import { ConflictError, NotFoundError, ValidationError } from '../../../types/errors.types';
import { UserModel } from '../users/user.model';
import { TaskModel } from './task.model';
import { TaskRepository } from './task.repository';
import { AssignmentService } from './assignment.service';
import { DependencyService } from './dependency.service';
import { TaskService } from './task.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<TaskModel> = {}): TaskModel {
  return {
    id: `tsk_${randomUUID().replace(/-/g, '')}`,
    taskNumber: 'T-001',
    title: 'Test Task',
    description: 'A task for testing',
    priority: 'MEDIUM',
    status: 'TO_DO',
    assignedTo: 'usr_alice',
    estimatedCompletion: '2026-12-31',
    actualCompletion: null,
    createdAt: new Date().toISOString(),
    createdBy: 'usr_alice',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeUser(id: string, isActive = true): UserModel {
  return {
    id,
    email: `${id}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    password: 'hashed',
    role: 'user',
    isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('Task Assignment & Dependency Workflow', () => {
  let store: InMemoryStore;
  let repo: TaskRepository;
  let assignmentService: AssignmentService;
  let dependencyService: DependencyService;
  let taskService: TaskService;

  let taskA: TaskModel;
  let taskB: TaskModel;

  beforeEach(async () => {
    store = InMemoryStore.getInstance();
    store.clear();

    repo = new TaskRepository(store);
    assignmentService = new AssignmentService(repo, store);
    dependencyService = new DependencyService(repo);
    taskService = new TaskService(repo);

    // Seed users
    await store.create<UserModel>('users', 'usr_alice', makeUser('usr_alice'));
    await store.create<UserModel>('users', 'usr_bob', makeUser('usr_bob'));
    await store.create<UserModel>('users', 'usr_inactive', makeUser('usr_inactive', false));

    // Seed tasks
    taskA = makeTask({ id: 'tsk_a', taskNumber: 'T-001', assignedTo: 'usr_alice' });
    taskB = makeTask({ id: 'tsk_b', taskNumber: 'T-002', assignedTo: 'usr_alice' });
    await store.create<TaskModel>('tasks', taskA.id, taskA);
    await store.create<TaskModel>('tasks', taskB.id, taskB);
  });

  // ── AssignmentService ──────────────────────────────────────────────────────

  describe('AssignmentService.assignTask', () => {
    it('reassigns the task and returns an assignment history record', async () => {
      const result = await assignmentService.assignTask(taskA.id, 'usr_bob', 'usr_alice');

      expect(result.taskId).toBe(taskA.id);
      expect(result.assignedTo).toBe('usr_bob');
      expect(result.previousAssignee).toBe('usr_alice');
      expect(result.assignedBy).toBe('usr_alice');
    });

    it('updates the task assignedTo field in the store', async () => {
      await assignmentService.assignTask(taskA.id, 'usr_bob', 'usr_alice');
      const updated = await repo.findTaskById(taskA.id);
      expect(updated?.assignedTo).toBe('usr_bob');
    });

    it('creates a task history entry for the assignment', async () => {
      await assignmentService.assignTask(taskA.id, 'usr_bob', 'usr_alice');
      const history = await repo.findHistoryByTaskId(taskA.id);
      const assignEntry = history.find((h) => h.changeType === 'ASSIGNED');
      expect(assignEntry).toBeDefined();
      expect(assignEntry?.newValues).toEqual({ assignedTo: 'usr_bob' });
    });

    it('throws NotFoundError when the task does not exist', async () => {
      await expect(
        assignmentService.assignTask('tsk_missing', 'usr_bob', 'usr_alice'),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when the target user does not exist', async () => {
      await expect(
        assignmentService.assignTask(taskA.id, 'usr_ghost', 'usr_alice'),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ValidationError when the target user is inactive', async () => {
      await expect(
        assignmentService.assignTask(taskA.id, 'usr_inactive', 'usr_alice'),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ConflictError when the task is already assigned to the same user', async () => {
      await expect(
        assignmentService.assignTask(taskA.id, 'usr_alice', 'usr_alice'),
      ).rejects.toThrow(ConflictError);
    });
  });

  // ── DependencyService ──────────────────────────────────────────────────────

  describe('DependencyService.addDependency', () => {
    it('creates a dependency and marks the dependent task as BLOCKED', async () => {
      const dep = await dependencyService.addDependency(taskB.id, taskA.id, 'usr_alice');

      expect(dep.blockingTaskId).toBe(taskA.id);
      expect(dep.dependentTaskId).toBe(taskB.id);
      expect(dep.deletedAt).toBeNull();

      const updated = await repo.findTaskById(taskB.id);
      expect(updated?.status).toBe('BLOCKED');
    });

    it('does NOT block the task if the blocking task is already Completed', async () => {
      const completedA = makeTask({ id: 'tsk_done', status: 'COMPLETED', assignedTo: 'usr_alice' });
      await store.create<TaskModel>('tasks', completedA.id, completedA);

      await dependencyService.addDependency(taskB.id, completedA.id, 'usr_alice');

      const updated = await repo.findTaskById(taskB.id);
      expect(updated?.status).toBe('TO_DO');
    });

    it('throws ConflictError for a self-dependency', async () => {
      await expect(
        dependencyService.addDependency(taskA.id, taskA.id, 'usr_alice'),
      ).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError for a duplicate dependency', async () => {
      await dependencyService.addDependency(taskB.id, taskA.id, 'usr_alice');
      await expect(
        dependencyService.addDependency(taskB.id, taskA.id, 'usr_alice'),
      ).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError for a circular dependency', async () => {
      // A ← B (B depends on A)
      await dependencyService.addDependency(taskB.id, taskA.id, 'usr_alice');
      // Trying to make A depend on B would create a cycle
      await expect(
        dependencyService.addDependency(taskA.id, taskB.id, 'usr_alice'),
      ).rejects.toThrow(ConflictError);
    });

    it('throws NotFoundError when the task does not exist', async () => {
      await expect(
        dependencyService.addDependency('tsk_missing', taskA.id, 'usr_alice'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('DependencyService.removeDependency', () => {
    it('soft-deletes the dependency and unblocks the task when no remaining deps', async () => {
      const dep = await dependencyService.addDependency(taskB.id, taskA.id, 'usr_alice');

      const result = await dependencyService.removeDependency(taskB.id, dep.id, 'usr_alice');

      expect(result.taskStatusUpdated).toBe(true);
      expect(result.newStatus).toBe('TO_DO');

      const updated = await repo.findTaskById(taskB.id);
      expect(updated?.status).toBe('TO_DO');
    });

    it('leaves the task BLOCKED when other active dependencies remain', async () => {
      const taskC = makeTask({ id: 'tsk_c', assignedTo: 'usr_alice' });
      await store.create<TaskModel>('tasks', taskC.id, taskC);

      const dep1 = await dependencyService.addDependency(taskB.id, taskA.id, 'usr_alice');
      await dependencyService.addDependency(taskB.id, taskC.id, 'usr_alice');

      const result = await dependencyService.removeDependency(taskB.id, dep1.id, 'usr_alice');

      expect(result.taskStatusUpdated).toBe(false);

      const updated = await repo.findTaskById(taskB.id);
      expect(updated?.status).toBe('BLOCKED');
    });

    it('throws NotFoundError when the dependency does not exist', async () => {
      await expect(
        dependencyService.removeDependency(taskB.id, 'dep_missing', 'usr_alice'),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError when the dependency belongs to a different task', async () => {
      const dep = await dependencyService.addDependency(taskB.id, taskA.id, 'usr_alice');
      await expect(
        dependencyService.removeDependency(taskA.id, dep.id, 'usr_alice'),
      ).rejects.toThrow(ConflictError);
    });
  });

  // ── TaskService ────────────────────────────────────────────────────────────

  describe('TaskService.updateStatus', () => {
    it('transitions TO_DO → IN_PROGRESS', async () => {
      const updated = await taskService.updateStatus(taskA.id, 'IN_PROGRESS', 'usr_alice');
      expect(updated.status).toBe('IN_PROGRESS');
    });

    it('transitions IN_PROGRESS → TO_DO (rollback)', async () => {
      await taskService.updateStatus(taskA.id, 'IN_PROGRESS', 'usr_alice');
      const updated = await taskService.updateStatus(taskA.id, 'TO_DO', 'usr_alice');
      expect(updated.status).toBe('TO_DO');
    });

    it('transitions IN_PROGRESS → COMPLETED when there are no dependencies', async () => {
      await taskService.updateStatus(taskA.id, 'IN_PROGRESS', 'usr_alice');
      const updated = await taskService.updateStatus(taskA.id, 'COMPLETED', 'usr_alice');
      expect(updated.status).toBe('COMPLETED');
    });

    it('records a STATUS_CHANGED history entry', async () => {
      await taskService.updateStatus(taskA.id, 'IN_PROGRESS', 'usr_alice');
      const history = await repo.findHistoryByTaskId(taskA.id);
      const entry = history.find((h) => h.changeType === 'STATUS_CHANGED');
      expect(entry).toBeDefined();
      expect(entry?.previousValues).toEqual({ status: 'TO_DO' });
      expect(entry?.newValues).toEqual({ status: 'IN_PROGRESS' });
    });

    it('throws ValidationError for invalid transition TO_DO → COMPLETED', async () => {
      await expect(
        taskService.updateStatus(taskA.id, 'COMPLETED', 'usr_alice'),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when trying to manually change a BLOCKED task', async () => {
      await dependencyService.addDependency(taskA.id, taskB.id, 'usr_alice');

      await expect(
        taskService.updateStatus(taskA.id, 'IN_PROGRESS', 'usr_alice'),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError when trying to change a COMPLETED task', async () => {
      await taskService.updateStatus(taskA.id, 'IN_PROGRESS', 'usr_alice');
      await taskService.updateStatus(taskA.id, 'COMPLETED', 'usr_alice');
      await expect(
        taskService.updateStatus(taskA.id, 'IN_PROGRESS', 'usr_alice'),
      ).rejects.toThrow(ValidationError);
    });

    it('throws ConflictError when marking COMPLETED with unresolved dependencies', async () => {
      await taskService.updateStatus(taskA.id, 'IN_PROGRESS', 'usr_alice');
      // Force status to IN_PROGRESS without removing the dep guard by seeding directly
      const taskWithDep = makeTask({ id: 'tsk_dep_test', status: 'IN_PROGRESS', assignedTo: 'usr_alice' });
      await store.create<TaskModel>('tasks', taskWithDep.id, taskWithDep);
      const blocker = makeTask({ id: 'tsk_blocker', status: 'IN_PROGRESS', assignedTo: 'usr_alice' });
      await store.create<TaskModel>('tasks', blocker.id, blocker);
      await repo.createDependency({ blockingTaskId: blocker.id, dependentTaskId: taskWithDep.id, createdBy: 'usr_alice' });

      await expect(
        taskService.updateStatus(taskWithDep.id, 'COMPLETED', 'usr_alice'),
      ).rejects.toThrow(ConflictError);
    });

    it('throws NotFoundError when the task does not exist', async () => {
      await expect(
        taskService.updateStatus('tsk_missing', 'IN_PROGRESS', 'usr_alice'),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
