import { Router } from 'express';
import { assignTask, addDependency, removeDependency, updateTaskStatus } from './task.controller';

/** Routes mounted at /api/v1/tasks */
const tasksRouter = Router();

// PATCH /api/v1/tasks/:id/assign
tasksRouter.patch('/:id/assign', assignTask);

// PATCH /api/v1/tasks/:id/status
tasksRouter.patch('/:id/status', updateTaskStatus);

// POST  /api/v1/tasks/:id/dependencies
tasksRouter.post('/:id/dependencies', addDependency);

// DELETE /api/v1/tasks/:id/dependencies/:dependencyId
tasksRouter.delete('/:id/dependencies/:dependencyId', removeDependency);

export { tasksRouter };
