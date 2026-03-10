import { Router } from 'express';
import { healthRouter } from './health/health.routes';
import { tasksRouter } from './tasks/task.routes';

/**
 * Aggregates all v1 resource routers.
 * Mounted in app.ts at /api/v1.
 *
 * Add new resource routers here as they are implemented:
 * ```typescript
 * import { usersRouter }   from './users/users.routes';
 * import { authRouter }    from './auth/auth.routes';
 * import { reportsRouter } from './reports/reports.routes';
 *
 * apiV1Router.use('/users',   usersRouter);
 * apiV1Router.use('/auth',    authRouter);
 * apiV1Router.use('/reports', reportsRouter);
 * ```
 */
const apiV1Router = Router();

apiV1Router.use('/health', healthRouter);
apiV1Router.use('/tasks', tasksRouter);

export { apiV1Router };
