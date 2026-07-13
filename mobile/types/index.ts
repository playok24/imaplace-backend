export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin' | 'business_owner';
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

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
  created_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  mp_preapproval_id?: string;
  status: 'pending' | 'authorized' | 'cancelled' | 'expired';
  amount: number;
  current_period_start?: string;
  current_period_end?: string;
}

export interface NearbyBusiness extends Business {
  distance: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface BusinessFormData {
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  website: string;
}
