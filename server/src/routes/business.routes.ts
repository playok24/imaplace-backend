import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import * as businessController from '../controllers/business.controller';

const router = Router();

router.get('/', businessController.list);
router.get('/:id', businessController.getById);

// Rutas protegidas para comerciantes
router.post('/', authenticate, requireRole('business_owner', 'admin'), businessController.create);
router.get('/mine/all', authenticate, requireRole('business_owner', 'admin'), businessController.getMyBusinesses);
router.put('/:id', authenticate, requireRole('business_owner', 'admin'), businessController.update);

export default router;
