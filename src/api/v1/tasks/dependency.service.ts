import { ConflictError, NotFoundError } from '../../../types/errors.types';
import { createLogger } from '../../../utils/logger.util';
import { TaskRepository } from './task.repository';
import { TaskDependencyModel, TaskStatus } from './task.model';

const logger = createLogger('dependency.service');

/**
 * Manages task dependency links and the resulting status side-effects.
 *
 * Responsibilities:
 * - Creates dependency links, guarding against duplicates and circular refs
 * - Auto-sets the dependent task to BLOCKED when the blocker is not Completed
 * - Removes dependency links (soft delete) and re-evaluates blocked status
 */
export class DependencyService {
  constructor(private readonly taskRepo: TaskRepository) {}

  /**
   * Adds a new dependency: `taskId` depends on `dependsOnTaskId`.
   *
   * @param taskId          - The dependent task (the one being blocked)
   * @param dependsOnTaskId - The blocking task (must complete first)
   * @param requestedBy     - ID of the user creating the dependency
   * @returns The created {@link TaskDependencyModel}
   * @throws {NotFoundError}  If either task does not exist
   * @throws {ConflictError}  If the dependency already exists or would create a cycle
   */
  async addDependency(
    taskId: string,
    dependsOnTaskId: string,
    requestedBy: string,
  ): Promise<TaskDependencyModel> {
    if (taskId === dependsOnTaskId) {
      throw new ConflictError(
        'A task cannot depend on itself.',
        'ERR_SELF_DEPENDENCY',
      );
    }

    const [dependentTask, blockingTask] = await Promise.all([
      this.taskRepo.getTaskOrThrow(taskId),
      this.taskRepo.getTaskOrThrow(dependsOnTaskId),
    ]);

    // Guard: duplicate dependency
    const alreadyExists = await this.taskRepo.dependencyExists(dependsOnTaskId, taskId);
    if (alreadyExists) {
      throw new ConflictError(
        `Dependency already exists: task '${taskId}' already depends on '${dependsOnTaskId}'.`,
        'ERR_DUPLICATE_DEPENDENCY',
      );
    }

    // Circular dependency check
    const wouldCycle = await this.wouldCreateCycle(taskId, dependsOnTaskId);
    if (wouldCycle) {
      throw new ConflictError(
        `Creating this dependency would create a circular reference involving tasks '${taskId}' and '${dependsOnTaskId}'.`,
        'ERR_CIRCULAR_DEPENDENCY_DETECTED',
      );
    }

    // Create the link
    const dependency = await this.taskRepo.createDependency({
      blockingTaskId: dependsOnTaskId,
      dependentTaskId: taskId,
      createdBy: requestedBy,
    });

    // Auto-block the dependent task if the blocking task is not yet Completed
    if (blockingTask.status !== 'COMPLETED' && dependentTask.status !== 'BLOCKED') {
      await this.taskRepo.updateTaskStatus(taskId, 'BLOCKED');
      await this.taskRepo.createHistoryEntry({
        taskId,
        changeType: 'STATUS_CHANGED',
        previousValues: { status: dependentTask.status },
        newValues: { status: 'BLOCKED' },
        modifiedBy: requestedBy,
      });

      logger.info('Task auto-blocked due to new dependency', {
        operation: 'dependency.add',
        taskId,
        blockingTaskId: dependsOnTaskId,
      });
    }

    return dependency;
  }

  /**
   * Removes an active dependency link and re-evaluates whether the task is still blocked.
   *
   * @param taskId       - The dependent task owning this dependency
   * @param dependencyId - ID of the dependency record to remove
   * @param requestedBy  - ID of the user removing the dependency
   * @returns An object describing the removal outcome and any status change
   * @throws {NotFoundError}  If the task or dependency does not exist
   * @throws {ConflictError}  If the dependency does not belong to this task
   */
  async removeDependency(
    taskId: string,
    dependencyId: string,
    requestedBy: string,
  ): Promise<{ dependencyId: string; removedAt: string; taskStatusUpdated: boolean; newStatus: TaskStatus }> {
    // Ensure the task exists
    const task = await this.taskRepo.getTaskOrThrow(taskId);

    const dependency = await this.taskRepo.findDependencyById(dependencyId);
    if (!dependency || dependency.deletedAt !== null) {
      throw new NotFoundError('TaskDependency', dependencyId);
    }
    if (dependency.dependentTaskId !== taskId) {
      throw new ConflictError(
        `Dependency '${dependencyId}' does not belong to task '${taskId}'.`,
        'ERR_DEPENDENCY_MISMATCH',
      );
    }

    // Soft-delete the dependency
    const removed = await this.taskRepo.softDeleteDependency(dependencyId);

    // Re-evaluate blocked status: check remaining active dependencies
    const remainingDeps = await this.taskRepo.findActiveDependenciesForTask(taskId);

    let taskStatusUpdated = false;
    let newStatus: TaskStatus = task.status;

    if (task.status === 'BLOCKED' && remainingDeps.length === 0) {
      // No more blockers — move back to TO_DO
      newStatus = 'TO_DO';
      taskStatusUpdated = true;
      await this.taskRepo.updateTaskStatus(taskId, newStatus);
      await this.taskRepo.createHistoryEntry({
        taskId,
        changeType: 'STATUS_CHANGED',
        previousValues: { status: 'BLOCKED' },
        newValues: { status: newStatus },
        modifiedBy: requestedBy,
      });

      logger.info('Task unblocked after dependency removal', {
        operation: 'dependency.remove',
        taskId,
        removedDependencyId: dependencyId,
        newStatus,
      });
    }

    return {
      dependencyId,
      removedAt: removed.deletedAt as string,
      taskStatusUpdated,
      newStatus,
    };
  }

  /**
   * DFS-based circular dependency detection.
   *
   * Returns `true` if making `taskId` depend on `newBlockerId` would create a cycle.
   * A cycle exists if `taskId` is reachable from `newBlockerId` through existing dependencies.
   */
  private async wouldCreateCycle(taskId: string, newBlockerId: string): Promise<boolean> {
    // Walk UP from newBlockerId through its own blockers.
    // If we can reach taskId, adding this edge would close a loop.
    const visited = new Set<string>();
    const stack = [newBlockerId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === taskId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const blockers = await this.taskRepo.findActiveDependenciesForTask(current);
      for (const dep of blockers) {
        stack.push(dep.blockingTaskId);
      }
    }

    return false;
  }
}
