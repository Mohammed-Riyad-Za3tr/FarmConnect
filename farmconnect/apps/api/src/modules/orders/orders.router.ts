import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { idempotencyMiddleware } from '../../middleware/idempotency';
import {
  checkoutFromCart,
  generateDeliveryVerificationToken,
  getBuyerOrderDetail,
  getProducerOrderDetail,
  listBuyerOrders,
  listProducerOrders,
  transitionProducerOrderStatus,
  verifyDeliveryToken,
} from './orders.controller';

const ordersRouter: IRouter = Router();

ordersRouter.use(authenticate);

// Phase 6B: checkout from buyer cart
ordersRouter.post('/checkout', idempotencyMiddleware, checkoutFromCart);

// Phase 6C: buyer orders
ordersRouter.get('/buyer', listBuyerOrders);
ordersRouter.get('/buyer/:orderId', getBuyerOrderDetail);

// Phase 6C: producer related orders
ordersRouter.get('/producer', listProducerOrders);
ordersRouter.get('/producer/:orderId', getProducerOrderDetail);
ordersRouter.patch('/producer/:orderId/status', transitionProducerOrderStatus);
ordersRouter.post('/producer/:orderId/delivery-verification-token', generateDeliveryVerificationToken);
ordersRouter.post('/delivery/verify', verifyDeliveryToken);

export { ordersRouter };
