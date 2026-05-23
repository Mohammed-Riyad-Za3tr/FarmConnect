import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import {
  addProductImage,
  deleteProductImage,
  listProductImages,
  updateProductImage,
} from './product-image.controller';

const productImageRouter: IRouter = Router({ mergeParams: true });

productImageRouter.use(authenticate);

productImageRouter.post('/', addProductImage);
productImageRouter.get('/', listProductImages);
productImageRouter.patch('/:imageId', updateProductImage);
productImageRouter.delete('/:imageId', deleteProductImage);

export { productImageRouter };
