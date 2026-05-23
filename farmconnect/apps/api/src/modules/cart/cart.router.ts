import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from './cart.controller';

const cartRouter: IRouter = Router();

cartRouter.use(authenticate);

cartRouter.get('/', getCart);
cartRouter.post('/items', addCartItem);
cartRouter.patch('/items/:productId', updateCartItem);
cartRouter.delete('/items/:productId', removeCartItem);
cartRouter.delete('/', clearCart);

export { cartRouter };
