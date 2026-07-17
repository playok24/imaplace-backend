import { query } from '../config/database';

const PROXIMITY_RADIUS_METERS = 1000;
const NOTIFICATION_COOLDOWN_HOURS = 2;
const MAX_NOTIFICATIONS_PER_BATCH = 5;

export interface NearbyBusiness {
  id: string;
  name: string;
  description: string;
  category: string;
  photos: string[];
  priority: number;
  distance: number;
  lat: number;
  lng: number;
}

export interface NearbyTouristPoint {
  id: string;
  name: string;
  description: string;
  category: string;
  importance: string;
  priority: number;
  estimated_duration_minutes: number | null;
  tips: string | null;
  distance: number;
  lat: number;
  lng: number;
}

export async function updateUserLocation(userId: string, latitude: number, longitude: number): Promise<void> {
  await query(
    'INSERT INTO user_locations (user_id, latitude, longitude) VALUES ($1, $2, $3)',
    [userId, latitude, longitude]
  );
}

export async function findNearbyBusinesses(userId: string): Promise<NearbyBusiness[]> {
  const result = await query(
    `SELECT DISTINCT b.id, b.name, b.description, b.category, b.photos, b.priority,
            ROUND(haversine_distance(ul.latitude, ul.longitude, b.latitude, b.longitude)) AS distance,
            b.longitude AS lng,
            b.latitude AS lat
     FROM user_locations ul
     CROSS JOIN businesses b
     WHERE ul.user_id = $1
       AND b.is_active = TRUE
       AND haversine_distance(ul.latitude, ul.longitude, b.latitude, b.longitude) <= $2
       AND ul.captured_at = (
         SELECT MAX(captured_at) FROM user_locations WHERE user_id = $1
       )
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.business_id = b.id
           AND n.entity_type = 'business'
           AND n.user_id = $1
           AND n.type = 'proximity'
           AND n.created_at > NOW() - INTERVAL '1 hour' * $3
       )
     ORDER BY distance ASC
     LIMIT $4`,
    [userId, PROXIMITY_RADIUS_METERS, NOTIFICATION_COOLDOWN_HOURS, MAX_NOTIFICATIONS_PER_BATCH]
  );

  const businesses: NearbyBusiness[] = result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    photos: row.photos || [],
    priority: row.priority ?? 5,
    distance: Number(row.distance),
    lat: Number(row.lat),
    lng: Number(row.lng),
  }));

  if (businesses.length > 0) {
    const notificationValues = businesses.map((b) =>
      `('${userId}', '${b.id}', NULL, 'business', 'proximity', '${b.name} está cerca de tu ubicación (a ${b.distance}m)')`
    );
    await query(
      `INSERT INTO notifications (user_id, business_id, tourist_point_id, entity_type, type, message) VALUES ${notificationValues.join(', ')}`
    );
  }

  return businesses;
}

export async function findNearbyTouristPoints(userId: string): Promise<NearbyTouristPoint[]> {
  const result = await query(
    `SELECT DISTINCT t.id, t.name, t.description, t.category, t.importance, t.priority,
            t.estimated_duration_minutes, t.tips,
            ROUND(haversine_distance(ul.latitude, ul.longitude, t.latitude, t.longitude)) AS distance,
            t.longitude AS lng,
            t.latitude AS lat
     FROM user_locations ul
     CROSS JOIN tourist_points t
     WHERE ul.user_id = $1
       AND t.is_active = TRUE
       AND haversine_distance(ul.latitude, ul.longitude, t.latitude, t.longitude) <= $2
       AND ul.captured_at = (
         SELECT MAX(captured_at) FROM user_locations WHERE user_id = $1
       )
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.tourist_point_id = t.id
           AND n.entity_type = 'tourist_point'
           AND n.user_id = $1
           AND n.type = 'proximity'
           AND n.created_at > NOW() - INTERVAL '1 hour' * $3
       )
     ORDER BY distance ASC
     LIMIT $4`,
    [userId, PROXIMITY_RADIUS_METERS, NOTIFICATION_COOLDOWN_HOURS, MAX_NOTIFICATIONS_PER_BATCH]
  );

  const points: NearbyTouristPoint[] = result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    category: row.category,
    importance: row.importance || 'medium',
    priority: row.priority ?? 5,
    estimated_duration_minutes: row.estimated_duration_minutes,
    tips: row.tips,
    distance: Number(row.distance),
    lat: Number(row.lat),
    lng: Number(row.lng),
  }));

  if (points.length > 0) {
    const notificationValues = points.map((p) =>
      `('${userId}', NULL, '${p.id}', 'tourist_point', 'proximity', '${p.name} está cerca de tu ubicación (a ${p.distance}m)')`
    );
    await query(
      `INSERT INTO notifications (user_id, business_id, tourist_point_id, entity_type, type, message) VALUES ${notificationValues.join(', ')}`
    );
  }

  return points;
}
