import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

import { forecastDemand, recommendPrice, relayChatbot } from './ai.controller';

const aiRouter: IRouter = Router();

aiRouter.use(authenticate);

aiRouter.post('/recommend-price', authorize('PRODUCER', 'ADMIN'), recommendPrice);
aiRouter.post('/forecast-demand', authorize('PRODUCER', 'ADMIN'), forecastDemand);
aiRouter.post('/chatbot', authorize('BUYER', 'PRODUCER', 'ADMIN'), relayChatbot);

export { aiRouter };
