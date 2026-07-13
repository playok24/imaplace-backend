import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as locationController from '../controllers/location.controller';

const router = Router();

router.post('/update', authenticate, locationController.updateLocation);

export default router;
