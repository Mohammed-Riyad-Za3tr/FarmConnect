import { Router, type IRouter } from 'express';

import { handleStripeWebhook } from './payments.controller';

const stripeWebhookRouter: IRouter = Router();

stripeWebhookRouter.post('/', handleStripeWebhook);

export { stripeWebhookRouter };
