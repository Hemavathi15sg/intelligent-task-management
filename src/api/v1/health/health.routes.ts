import { Router } from 'express';
import { healthCheck } from './health.controller';

/** Routes mounted at /api/v1/health */
const healthRouter = Router();

healthRouter.get('/', healthCheck);

export { healthRouter };
