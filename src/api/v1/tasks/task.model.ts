/** Task status values — mirrors the state machine defined in TSD §4.3.4. */
export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';

/** Task priority values. */
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Represents a task record stored in the `tasks` table.
 */
export interface TaskModel {
  /** Unique task identifier (format: tsk_xxxxx) */
  id: string;

  /** Human-readable task number (format: T-001) */
  taskNumber: string;

  /** Short task title — max 255 characters */
  title: string;

  /** Full task description — max 2000 characters */
  description: string;

  /** Task priority */
  priority: TaskPriority;

  /** Current task status */
  status: TaskStatus;

  /** ID of the currently assigned user */
  assignedTo: string;

  /** Estimated completion date (YYYY-MM-DD) */
  estimatedCompletion: string;

  /** Actual completion date — null until task is Completed */
  actualCompletion: string | null;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  /** ID of the user who created the task */
  createdBy: string;

  /** ISO 8601 last-updated timestamp */
  updatedAt: string;
}

/**
 * Represents a single entry in the task history audit table.
 * Records status changes and other updates to a task over time.
 */
export interface TaskHistoryModel {
  /** Unique history entry identifier */
  id: string;

  /** ID of the task this entry belongs to */
  taskId: string;

  /** The type of change that was made */
  changeType: 'CREATED' | 'UPDATED' | 'STATUS_CHANGED' | 'ASSIGNED';

  /** Field values before the change (null for CREATED entries) */
  previousValues: Record<string, unknown> | null;

  /** Field values after the change */
  newValues: Record<string, unknown>;

  /** ID of the user who made the change */
  modifiedBy: string;

  /** ISO 8601 timestamp of the change */
  changedAt: string;
}

/**
 * Represents a record in the assignment history table.
 * Created whenever a task's assignee changes.
 */
export interface AssignmentHistoryModel {
  /** Unique assignment history entry identifier */
  id: string;

  /** ID of the task that was assigned */
  taskId: string;

  /** ID of the user who performed the (re)assignment */
  assignedBy: string;

  /** ID of the newly assigned user */
  assignedTo: string;

  /** ID of the previous assignee — null if this is the first assignment */
  previousAssignee: string | null;

  /** ISO 8601 timestamp of the assignment */
  assignedAt: string;

  /** Optional reason for reassignment */
  reason: string | null;
}

/**
 * Represents an active dependency link between two tasks.
 *
 * A dependency means: `dependentTaskId` is blocked by `blockingTaskId`.
 * i.e. "the dependent task depends on the blocking task completing first."
 */
export interface TaskDependencyModel {
  /** Unique dependency identifier */
  id: string;

  /** The task that must be completed first (the blocker) */
  blockingTaskId: string;

  /** The task that is waiting on the blocker (the dependent) */
  dependentTaskId: string;

  /** ISO 8601 creation timestamp */
  createdAt: string;

  /** ID of the user who created this dependency */
  createdBy: string;

  /**
   * ISO 8601 soft-delete timestamp — null while the dependency is active.
   * Set when the dependency is removed (preserves audit trail).
   */
  deletedAt: string | null;
}
