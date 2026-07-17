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

    const [nearbyBusinesses, nearbyTouristPoints] = await Promise.all([
      proximityService.findNearbyBusinesses(req.user!.id),
      proximityService.findNearbyTouristPoints(req.user!.id),
    ]);

    const io = req.app.get('io');

    if (nearbyBusinesses.length > 0 && io) {
      nearbyBusinesses.forEach((business) => {
        io.to(`user:${req.user!.id}`).emit('business_nearby', business);
      });
    }

    if (nearbyTouristPoints.length > 0 && io) {
      nearbyTouristPoints.forEach((point) => {
        io.to(`user:${req.user!.id}`).emit('tourist_point_nearby', point);
      });
    }

    res.json({
      saved: true,
      nearby: nearbyBusinesses,
      nearbyTouristPoints,
    });
  } catch (err: any) {
    console.error('Location update error:', err.message, err.stack?.substring(0, 200));
    res.status(500).json({ error: err.message });
  }
}
