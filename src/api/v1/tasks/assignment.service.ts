import { ConflictError, NotFoundError, ValidationError } from '../../../types/errors.types';
import { createLogger } from '../../../utils/logger.util';
import { UserModel } from '../users/user.model';
import { InMemoryStore } from '../../../storage/store';
import { TaskRepository } from './task.repository';
import { AssignmentHistoryModel } from './task.model';

const logger = createLogger('assignment.service');

/**
 * Handles task reassignment business logic.
 *
 * Responsibilities:
 * - Validates the new assignee exists and is active
 * - Prevents self-assignment (no-op guard)
 * - Records the change in `assignment_history` and `task_history`
 * - Emits a notification stub (structured log)
 */
export class AssignmentService {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly store: InMemoryStore,
  ) {}

  /**
   * Reassigns a task to the specified user.
   *
   * @param taskId       - ID of the task to reassign
   * @param assignedUserId - ID of the new assignee
   * @param requestedBy  - ID of the user performing the reassignment (from request context)
   * @returns The new assignment history record
   * @throws {NotFoundError}   If the task or the target user does not exist
   * @throws {ConflictError}   If the task is already assigned to the given user
   * @throws {ValidationError} If the target user is inactive
   */
  async assignTask(
    taskId: string,
    assignedUserId: string,
    requestedBy: string,
  ): Promise<AssignmentHistoryModel> {
    const task = await this.taskRepo.getTaskOrThrow(taskId);

    // Validate assignee exists and is active
    const targetUser = await this.store.findById<UserModel>('users', assignedUserId);
    if (!targetUser) throw new NotFoundError('User', assignedUserId);
    if (!targetUser.isActive) {
      throw new ValidationError(
        `Cannot assign task to inactive user '${assignedUserId}'. User must be active.`,
      );
    }

    // Guard: no-op if already assigned to this user
    if (task.assignedTo === assignedUserId) {
      throw new ConflictError(
        `Task is already assigned to user '${assignedUserId}'. No changes made.`,
        'ERR_ALREADY_ASSIGNED',
      );
    }

    const previousAssignee = task.assignedTo ?? null;

    // Persist the new assignee on the task
    await this.taskRepo.updateTaskAssignee(taskId, assignedUserId);

    // Record task history entry
    await this.taskRepo.createHistoryEntry({
      taskId,
      changeType: 'ASSIGNED',
      previousValues: { assignedTo: previousAssignee },
      newValues: { assignedTo: assignedUserId },
      modifiedBy: requestedBy,
    });

    // Record assignment history
    const assignmentRecord = await this.taskRepo.createAssignmentHistory({
      taskId,
      assignedBy: requestedBy,
      assignedTo: assignedUserId,
      previousAssignee,
      reason: null,
    });

    // Notification stub — in production this would enqueue an async job
    logger.info('NOTIFICATION: Task assignment changed', {
      operation: 'task.assign',
      taskId,
      taskNumber: task.taskNumber,
      newAssignee: assignedUserId,
      previousAssignee,
      assignedBy: requestedBy,
    });

    return assignmentRecord;
  }
}
