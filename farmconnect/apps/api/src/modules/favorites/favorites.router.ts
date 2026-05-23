import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import {
  listFavoriteProducts,
  listFavoriteProducers,
  toggleFavoriteProduct,
  toggleFavoriteProducer,
} from './favorites.controller';

const favoritesRouter: IRouter = Router();

favoritesRouter.use(authenticate);

favoritesRouter.post('/products/:productId/toggle', toggleFavoriteProduct);
favoritesRouter.post('/producers/:producerId/toggle', toggleFavoriteProducer);
favoritesRouter.get('/products', listFavoriteProducts);
favoritesRouter.get('/producers', listFavoriteProducers);

export { favoritesRouter };
