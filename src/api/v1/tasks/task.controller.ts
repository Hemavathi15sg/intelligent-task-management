import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../../types/errors.types';
import { successResponse } from '../../../utils/response.util';
import { store } from '../../../storage/store';
import { TaskRepository } from './task.repository';
import { AssignmentService } from './assignment.service';
import { DependencyService } from './dependency.service';
import { TaskService } from './task.service';
import { TaskStatus } from './task.model';

// Lazy-initialise service singletons (no DI framework needed for this project)
function makeServices() {
  const repo = new TaskRepository(store);
  return {
    repo,
    assignment: new AssignmentService(repo, store),
    dependency: new DependencyService(repo),
    task: new TaskService(repo),
  };
}

const VALID_STATUSES: TaskStatus[] = ['TO_DO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];

// ── PATCH /api/v1/tasks/:id/assign ──────────────────────────────────────────

/**
 * Reassigns a task to the specified user.
 *
 * Request body: `{ assignedUserId: string }`
 *
 * @example
 * PATCH /api/v1/tasks/tsk_abc/assign
 * { "assignedUserId": "usr_xyz" }
 */
export async function assignTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { assignedUserId } = req.body as { assignedUserId?: unknown };

    if (!assignedUserId || typeof assignedUserId !== 'string') {
      throw new ValidationError('assignedUserId is required and must be a string.');
    }

    const requestedBy = req.user?.id ?? 'anonymous';
    const { assignment } = makeServices();
    const result = await assignment.assignTask(id, assignedUserId, requestedBy);

    res.status(200).json(
      successResponse(result, { requestId: req.id, path: req.path, method: req.method }),
    );
  } catch (err) {
    next(err);
  }
}

// ── POST /api/v1/tasks/:id/dependencies ─────────────────────────────────────

/**
 * Adds a dependency link: the task at `:id` depends on `dependsOnTaskId`.
 *
 * Request body: `{ dependsOnTaskId: string }`
 */
export async function addDependency(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const { dependsOnTaskId } = req.body as { dependsOnTaskId?: unknown };

    if (!dependsOnTaskId || typeof dependsOnTaskId !== 'string') {
      throw new ValidationError('dependsOnTaskId is required and must be a string.');
    }

    const requestedBy = req.user?.id ?? 'anonymous';
    const { dependency } = makeServices();
    const result = await dependency.addDependency(id, dependsOnTaskId, requestedBy);

    res.status(201).json(
      successResponse(result, { requestId: req.id, path: req.path, method: req.method }),
    );
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/v1/tasks/:id/dependencies/:dependencyId ──────────────────────

/**
 * Removes a dependency link and re-evaluates the task's blocked status.
 */
export async function removeDependency(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, dependencyId } = req.params;
    const requestedBy = req.user?.id ?? 'anonymous';
    const { dependency } = makeServices();
    const result = await dependency.removeDependency(id, dependencyId, requestedBy);

    res.status(200).json(
      successResponse(result, { requestId: req.id, path: req.path, method: req.method }),
    );
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/v1/tasks/:id/status ──────────────────────────────────────────

/**
 * Updates the task's status following state-machine rules.
 *
 * Request body: `{ status: TaskStatus }`
 */
export async function updateTaskStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: unknown };

    if (!status || typeof status !== 'string') {
      throw new ValidationError('status is required and must be a string.');
    }
    if (!VALID_STATUSES.includes(status as TaskStatus)) {
      throw new ValidationError(
        `Invalid status value '${status}'. Allowed values: ${VALID_STATUSES.join(', ')}.`,
        { allowedValues: VALID_STATUSES },
      );
    }

    const requestedBy = req.user?.id ?? 'anonymous';
    const { task } = makeServices();
    const updated = await task.updateStatus(id, status as TaskStatus, requestedBy);

    res.status(200).json(
      successResponse(updated, { requestId: req.id, path: req.path, method: req.method }),
    );
  } catch (err) {
    next(err);
  }
}
