import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { createReview } from './review.controller';

const reviewRouter: IRouter = Router();

reviewRouter.use(authenticate);
reviewRouter.post('/', createReview);

export { reviewRouter };
