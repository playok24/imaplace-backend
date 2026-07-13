import { query } from '../config/database';
import { Business, CreateBusinessInput } from '../models/business.model';

export async function createBusiness(ownerId: string, input: CreateBusinessInput): Promise<Business> {
  const result = await query(
    `INSERT INTO businesses (owner_id, name, description, category, latitude, longitude, address, phone, photos, opening_hours, website)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [ownerId, input.name, input.description, input.category, input.latitude, input.longitude,
     input.address, input.phone, input.photos || [], input.opening_hours || null, input.website || null]
  );

  return mapBusiness(result.rows[0]);
}

export async function getActiveBusinesses(): Promise<Business[]> {
  const result = await query(
    'SELECT * FROM businesses WHERE is_active = TRUE'
  );
  return result.rows.map(mapBusiness);
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const result = await query('SELECT * FROM businesses WHERE id = $1', [id]);
  return result.rows.length ? mapBusiness(result.rows[0]) : null;
}

export async function getBusinessesByOwner(ownerId: string): Promise<Business[]> {
  const result = await query('SELECT * FROM businesses WHERE owner_id = $1', [ownerId]);
  return result.rows.map(mapBusiness);
}

export async function updateBusiness(id: string, ownerId: string, input: Partial<CreateBusinessInput>): Promise<Business | null> {
  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (input.name !== undefined) { sets.push(`name = $${idx++}`); values.push(input.name); }
  if (input.description !== undefined) { sets.push(`description = $${idx++}`); values.push(input.description); }
  if (input.category !== undefined) { sets.push(`category = $${idx++}`); values.push(input.category); }
  if (input.latitude !== undefined) { sets.push(`latitude = $${idx++}`); values.push(input.latitude); }
  if (input.longitude !== undefined) { sets.push(`longitude = $${idx++}`); values.push(input.longitude); }
  if (input.address !== undefined) { sets.push(`address = $${idx++}`); values.push(input.address); }
  if (input.phone !== undefined) { sets.push(`phone = $${idx++}`); values.push(input.phone); }
  if (input.photos !== undefined) { sets.push(`photos = $${idx++}`); values.push(input.photos); }
  if (input.opening_hours !== undefined) { sets.push(`opening_hours = $${idx++}`); values.push(input.opening_hours); }
  if (input.website !== undefined) { sets.push(`website = $${idx++}`); values.push(input.website); }

  if (sets.length === 0) return getBusinessById(id);

  sets.push(`updated_at = NOW()`);
  values.push(id, ownerId);

  const result = await query(
    `UPDATE businesses SET ${sets.join(', ')}
     WHERE id = $${idx++} AND owner_id = $${idx}
     RETURNING *`,
    values
  );
  return result.rows.length ? mapBusiness(result.rows[0]) : null;
}

export async function toggleBusinessActive(id: string, isActive: boolean): Promise<void> {
  await query('UPDATE businesses SET is_active = $1, updated_at = NOW() WHERE id = $2', [isActive, id]);
}

function mapBusiness(row: any): Business {
  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    description: row.description,
    category: row.category,
    location: { lat: row.latitude, lng: row.longitude },
    address: row.address,
    phone: row.phone,
    photos: row.photos || [],
    opening_hours: row.opening_hours,
    website: row.website,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
