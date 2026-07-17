import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';
import * as businessController from '../controllers/business.controller';
import { query } from '../config/database';

const router = Router();

router.get('/', businessController.list);
router.get('/:id', businessController.getById);

// Public: active tourist points with priority
router.get('/tourist-points/list', async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, name, description, category, latitude, longitude, address, photos, website,
              importance, estimated_duration_minutes, season, is_free, tips, is_active, priority
       FROM tourist_points
       WHERE is_active = TRUE
       ORDER BY priority ASC NULLS LAST, name ASC`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Rutas protegidas para comerciantes
router.post('/', authenticate, requireRole('business_owner', 'admin'), businessController.create);
router.get('/mine/all', authenticate, requireRole('business_owner', 'admin'), businessController.getMyBusinesses);
router.put('/:id', authenticate, requireRole('business_owner', 'admin'), businessController.update);

export default router;
