import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';
import { query } from '../config/database';
import { toggleBusinessActive } from '../services/business.service';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', async (_req, res) => {
  try {
    const result = await query('SELECT id, email, name, phone, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const { is_active } = req.body;
    await query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [is_active, req.params.id as string]);
    res.json({ updated: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/businesses', async (_req, res) => {
  try {
    const result = await query(
      `SELECT b.id, b.name, b.owner_id, u.name as owner_name, b.category, b.is_active, s.status as subscription_status, b.created_at
       FROM businesses b
       LEFT JOIN users u ON u.id = b.owner_id
       LEFT JOIN subscriptions s ON s.business_id = b.id AND s.status = 'authorized'
       ORDER BY b.created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/businesses', async (req, res) => {
  try {
    const { name, category, latitude, longitude, address, phone, website, owner_id } = req.body;
    if (!name || !category || !latitude || !longitude || !owner_id) {
      return res.status(400).json({ error: 'Campos requeridos: name, category, latitude, longitude, owner_id' });
    }
    const ownerCheck = await query('SELECT id, role FROM users WHERE id = $1', [owner_id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario dueño no encontrado' });
    }
    if (ownerCheck.rows[0].role !== 'business_owner') {
      return res.status(400).json({ error: 'El dueño debe tener rol business_owner' });
    }
    const result = await query(
      `INSERT INTO businesses (name, category, latitude, longitude, address, phone, website, owner_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
       RETURNING id, name, category, latitude, longitude, address, phone, website, owner_id, is_active, created_at`,
      [name, category, latitude, longitude, address || null, phone || null, website || null, owner_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/businesses/:id/toggle', async (req, res) => {
  try {
    const { is_active } = req.body;
    await toggleBusinessActive(req.params.id as string, is_active);
    res.json({ updated: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/subscriptions', async (_req, res) => {
  try {
    const result = await query(
      `SELECT s.*, b.name as business_name, u.name as owner_name, u.email as owner_email
       FROM subscriptions s
       JOIN businesses b ON b.id = s.business_id
       JOIN users u ON u.id = b.owner_id
       ORDER BY s.created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tourist-points', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM tourist_points ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tourist-points', async (req, res) => {
  try {
    const { name, description, category, latitude, longitude, address, website, importance, estimated_duration_minutes, season, is_free, tips } = req.body;
    if (!name || !category || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Campos requeridos: name, category, latitude, longitude' });
    }
    const result = await query(
      `INSERT INTO tourist_points (name, description, category, latitude, longitude, address, website, importance, estimated_duration_minutes, season, is_free, tips)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [name, description || null, category, latitude, longitude, address || null, website || null, importance || 'medium', estimated_duration_minutes || null, season || null, is_free ?? true, tips || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/tourist-points/:id/toggle', async (req, res) => {
  try {
    const { is_active } = req.body;
    await query('UPDATE tourist_points SET is_active = $1, updated_at = NOW() WHERE id = $2', [is_active, req.params.id]);
    res.json({ updated: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tourist-points/:id', async (req, res) => {
  try {
    await query('DELETE FROM tourist_points WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const [users, businesses, subscriptions, activeBusinesses, touristPoints, activeTouristPoints] = await Promise.all([
      query('SELECT COUNT(*) as total FROM users'),
      query('SELECT COUNT(*) as total FROM businesses'),
      query("SELECT COUNT(*) as total FROM subscriptions WHERE status = 'authorized'"),
      query('SELECT COUNT(*) as total FROM businesses WHERE is_active = TRUE'),
      query('SELECT COUNT(*) as total FROM tourist_points'),
      query('SELECT COUNT(*) as total FROM tourist_points WHERE is_active = TRUE'),
    ]);

    res.json({
      totalUsers: Number(users.rows[0].total),
      totalBusinesses: Number(businesses.rows[0].total),
      activeSubscriptions: Number(subscriptions.rows[0].total),
      activeBusinesses: Number(activeBusinesses.rows[0].total),
      totalTouristPoints: Number(touristPoints.rows[0].total),
      activeTouristPoints: Number(activeTouristPoints.rows[0].total),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
