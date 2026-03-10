import { ConflictError, ValidationError } from '../../../types/errors.types';
import { TaskRepository } from './task.repository';
import { TaskModel, TaskStatus } from './task.model';

/**
 * Allowed manual status transitions (state machine).
 *
 * Key = current status, Value = set of statuses the user may request.
 *
 * Rules (TSD §4.3.4 / BR-R-006 / BR-R-008):
 * - COMPLETED is a terminal state; no further changes allowed.
 * - BLOCKED cannot be changed manually; it is only cleared by the dependency service.
 * - COMPLETED requires no active blocking dependencies (checked at runtime).
 */
const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TO_DO: ['IN_PROGRESS'],
  IN_PROGRESS: ['TO_DO', 'COMPLETED'],
  BLOCKED: [],
  COMPLETED: [],
};

/**
 * Manages task status transitions with state-machine validation and history recording.
 */
export class TaskService {
  constructor(private readonly taskRepo: TaskRepository) {}

  /**
   * Transitions a task to a new status.
   *
   * @param taskId      - ID of the task to update
   * @param newStatus   - The requested new status
   * @param requestedBy - ID of the user making the change
   * @returns The updated {@link TaskModel}
   * @throws {NotFoundError}   If the task does not exist
   * @throws {ValidationError} If the transition is not permitted by the state machine
   * @throws {ConflictError}   If trying to mark Completed with unresolved dependencies
   */
  async updateStatus(
    taskId: string,
    newStatus: TaskStatus,
    requestedBy: string,
  ): Promise<TaskModel> {
    const task = await this.taskRepo.getTaskOrThrow(taskId);

    const allowed = ALLOWED_TRANSITIONS[task.status];

    if (task.status === newStatus) {
      // No-op: already at requested status, return current task
      return task;
    }

    if (!allowed.includes(newStatus)) {
      if (task.status === 'BLOCKED') {
        throw new ValidationError(
          `Cannot manually change status of a Blocked task. Remove all blocking dependencies first.`,
          { currentStatus: task.status, requestedStatus: newStatus },
        );
      }
      if (task.status === 'COMPLETED') {
        throw new ValidationError(
          `Cannot change status from COMPLETED — it is a terminal state.`,
          { currentStatus: task.status, requestedStatus: newStatus },
        );
      }
      throw new ValidationError(
        `Invalid status transition: ${task.status} → ${newStatus}.`,
        { currentStatus: task.status, requestedStatus: newStatus, allowedTransitions: allowed },
      );
    }

    // Extra guard: cannot complete if there are active blocking dependencies
    if (newStatus === 'COMPLETED') {
      const activeDeps = await this.taskRepo.findActiveDependenciesForTask(taskId);
      if (activeDeps.length > 0) {
        throw new ConflictError(
          `Task has ${activeDeps.length} unresolved ${activeDeps.length === 1 ? 'dependency' : 'dependencies'}. Cannot mark as Completed.`,
          'ERR_UNRESOLVED_DEPENDENCIES',
        );
      }
    }

    // Persist and record history
    const updated = await this.taskRepo.updateTaskStatus(taskId, newStatus);

    await this.taskRepo.createHistoryEntry({
      taskId,
      changeType: 'STATUS_CHANGED',
      previousValues: { status: task.status },
      newValues: { status: newStatus },
      modifiedBy: requestedBy,
    });

    return updated;
  }
}
