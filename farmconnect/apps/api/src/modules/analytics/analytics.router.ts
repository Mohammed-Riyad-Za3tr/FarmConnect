import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { getProducerAnalytics } from './analytics.controller';

const analyticsRouter: IRouter = Router();

analyticsRouter.use(authenticate);
analyticsRouter.use(authorize('PRODUCER'));

analyticsRouter.get('/producer', getProducerAnalytics);

export { analyticsRouter };
