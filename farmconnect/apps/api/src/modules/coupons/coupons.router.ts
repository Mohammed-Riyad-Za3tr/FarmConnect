import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import {
  createProducerCoupon,
  deleteProducerCoupon,
  listProducerCoupons,
  updateProducerCoupon,
} from './coupons.controller';

const couponsRouter: IRouter = Router();

couponsRouter.use(authenticate);

couponsRouter.post('/producer', createProducerCoupon);
couponsRouter.get('/producer', listProducerCoupons);
couponsRouter.patch('/producer/:couponId', updateProducerCoupon);
couponsRouter.delete('/producer/:couponId', deleteProducerCoupon);

export { couponsRouter };
