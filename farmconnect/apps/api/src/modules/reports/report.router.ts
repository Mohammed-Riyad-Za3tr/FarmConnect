import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { reportWriteRateLimiter } from '../../middleware/rateLimiter';
import { createReport, listAdminReports, updateAdminReport } from './report.controller';

const reportRouter: IRouter = Router();

reportRouter.use(authenticate);
reportRouter.post('/', reportWriteRateLimiter, createReport);
reportRouter.get('/admin', authorize('ADMIN'), listAdminReports);
reportRouter.patch('/admin/:reportId', authorize('ADMIN'), updateAdminReport);

export { reportRouter };
