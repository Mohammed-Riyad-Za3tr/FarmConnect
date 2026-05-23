import { Router, type IRouter } from 'express';

import { authenticate, optionalAuthenticate } from '../../middleware/authenticate';
import { productImageRouter } from '../product-images/product-image.router';
import {
  createOwnProductLog,
  createOwnProduct,
  deleteOwnProduct,
  getPublicProduct,
  getOwnProduct,
  listCategories,
  listOwnProductLogs,
  listPublicProducts,
  listOwnProducts,
  updateOwnProduct,
} from './product.controller';

const productRouter: IRouter = Router();

// Public catalog (Phase 5C)
productRouter.get('/', optionalAuthenticate, listPublicProducts);
productRouter.get('/categories', listCategories);

// Producer-only own product management (no public browse in this phase)
productRouter.post('/me', authenticate, createOwnProduct);
productRouter.get('/me', authenticate, listOwnProducts);
productRouter.get('/me/:productId', authenticate, getOwnProduct);
productRouter.patch('/me/:productId', authenticate, updateOwnProduct);
productRouter.delete('/me/:productId', authenticate, deleteOwnProduct);
productRouter.get('/me/:productId/logs', authenticate, listOwnProductLogs);
productRouter.post('/me/:productId/logs', authenticate, createOwnProductLog);

// Product images for own products
productRouter.use('/me/:productId/images', productImageRouter);

// Public product details by slug
productRouter.get('/:slug', optionalAuthenticate, getPublicProduct);

export { productRouter };
