export interface Business {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  category?: string;
  location: { lat: number; lng: number };
  address?: string;
  phone?: string;
  photos: string[];
  opening_hours?: Record<string, any>;
  website?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBusinessInput {
  name: string;
  description?: string;
  category?: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  photos?: string[];
  opening_hours?: Record<string, any>;
  website?: string;
}
