import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { addDeliveryUpdate, getOrderTracking } from './delivery.controller';

const deliveryRouter: IRouter = Router();

deliveryRouter.use(authenticate);

deliveryRouter.get('/orders/:orderId/tracking', getOrderTracking);
deliveryRouter.post('/orders/:orderId/updates', addDeliveryUpdate);

export { deliveryRouter };
