import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { idempotencyMiddleware } from '../../middleware/idempotency';
import {
  createPaymentIntent,
  getBuyerPaymentStatus,
} from './payments.controller';

const paymentsRouter: IRouter = Router();

paymentsRouter.use(authenticate);

paymentsRouter.post('/orders/:orderId/intents', idempotencyMiddleware, createPaymentIntent);
paymentsRouter.get('/orders/:orderId/status', getBuyerPaymentStatus);

export { paymentsRouter };
