import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as proximityService from '../services/proximity.service';

export async function updateLocation(req: AuthRequest, res: Response) {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitud y longitud requeridas' });
    }

    await proximityService.updateUserLocation(req.user!.id, latitude, longitude);

    const nearby = await proximityService.findNearbyBusinesses(req.user!.id);

    // Emit via Socket.IO if any nearby businesses found
    if (nearby.length > 0) {
      const io = req.app.get('io');
      if (io) {
        nearby.forEach((business) => {
          io.to(`user:${req.user!.id}`).emit('business_nearby', business);
        });
      }
    }

    res.json({ saved: true, nearby });
  } catch (err: any) {
    console.error('Location update error:', err.message, err.stack?.substring(0, 200));
    res.status(500).json({ error: err.message });
  }
}
