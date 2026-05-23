import { Router, type IRouter } from 'express';

import { healthRouter } from '../modules/health/health.router';
import { authRouter } from '../modules/auth/auth.router';
import { profileRouter } from '../modules/profile/profile.router';
import { productRouter } from '../modules/products/product.router';
import { cartRouter } from '../modules/cart/cart.router';
import { ordersRouter } from '../modules/orders/orders.router';
import { paymentsRouter } from '../modules/payments/payments.router';
import { notificationsRouter } from '../modules/notifications/notifications.router';
import { deliveryRouter } from '../modules/delivery/delivery.router';
import { analyticsRouter } from '../modules/analytics/analytics.router';
import { adminRouter } from '../modules/admin/admin.router';
import { aiRouter } from '../modules/ai/ai.router';
import { reviewRouter } from '../modules/reviews/review.router';
import { favoritesRouter } from '../modules/favorites/favorites.router';
import { couponsRouter } from '../modules/coupons/coupons.router';
import { reportRouter } from '../modules/reports/report.router';

const apiV1Router: IRouter = Router();

apiV1Router.use('/health', healthRouter);
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/profile', profileRouter);
apiV1Router.use('/products', productRouter);
apiV1Router.use('/cart', cartRouter);
apiV1Router.use('/orders', ordersRouter);
apiV1Router.use('/payments', paymentsRouter);
apiV1Router.use('/notifications', notificationsRouter);
apiV1Router.use('/delivery', deliveryRouter);
apiV1Router.use('/analytics', analyticsRouter);
apiV1Router.use('/admin', adminRouter);
apiV1Router.use('/ai', aiRouter);
apiV1Router.use('/reviews', reviewRouter);
apiV1Router.use('/favorites', favoritesRouter);
apiV1Router.use('/coupons', couponsRouter);
apiV1Router.use('/reports', reportRouter);

export { apiV1Router };
