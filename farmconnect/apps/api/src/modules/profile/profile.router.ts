import { Router, type IRouter } from 'express';

import { authenticate } from '../../middleware/authenticate';
import {
  deleteCurrentBuyerProfile,
  deleteCurrentProducerProfile,
  getCurrentBuyerProfile,
  getCurrentProducerProfile,
  getCurrentProducerVerificationStatus,
  getCurrentUserProfile,
  listProducerVerificationRequestsByAdmin,
  reviewProducerVerificationRequestByAdmin,
  submitCurrentProducerVerificationRequest,
  updateCurrentUserProfile,
  upsertCurrentBuyerProfile,
  upsertCurrentProducerProfile,
} from './profile.controller';

const profileRouter: IRouter = Router();

profileRouter.use(authenticate);

// Current user profile
profileRouter.get('/me', getCurrentUserProfile);
profileRouter.patch('/me', updateCurrentUserProfile);

// Buyer profile for current user only
profileRouter.get('/me/buyer', getCurrentBuyerProfile);
profileRouter.put('/me/buyer', upsertCurrentBuyerProfile);
profileRouter.delete('/me/buyer', deleteCurrentBuyerProfile);

// Producer profile for current user only
profileRouter.get('/me/producer', getCurrentProducerProfile);
profileRouter.put('/me/producer', upsertCurrentProducerProfile);
profileRouter.delete('/me/producer', deleteCurrentProducerProfile);

// Producer verification flow
profileRouter.post('/me/producer/verification-requests', submitCurrentProducerVerificationRequest);
profileRouter.get('/me/producer/verification-status', getCurrentProducerVerificationStatus);

// Admin review endpoint
profileRouter.get('/admin/producer-verification-requests', listProducerVerificationRequestsByAdmin);
profileRouter.patch(
  '/admin/producer-verification-requests/:requestId/review',
  reviewProducerVerificationRequestByAdmin,
);

export { profileRouter };
