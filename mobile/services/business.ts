import api from './api';
import { Business, BusinessFormData, TouristPoint } from '../types';

export async function getActiveBusinesses(): Promise<Business[]> {
  const { data } = await api.get('/api/businesses');
  return data;
}

export async function getBusinessById(id: string): Promise<Business> {
  const { data } = await api.get(`/api/businesses/${id}`);
  return data;
}

export async function getMyBusinesses(): Promise<Business[]> {
  const { data } = await api.get('/api/businesses/mine/all');
  return data;
}

export async function createBusiness(input: BusinessFormData): Promise<{ business: Business; initPoint: string }> {
  const { data } = await api.post('/api/businesses', input);
  return data;
}

export async function updateBusiness(id: string, input: Partial<BusinessFormData>): Promise<Business> {
  const { data } = await api.put(`/api/businesses/${id}`, input);
  return data;
}

export async function updateLocation(latitude: number, longitude: number): Promise<{ nearby: Business[]; nearbyTouristPoints: TouristPoint[] }> {
  const { data } = await api.post('/api/location/update', { latitude, longitude });
  return data;
}

export async function getActiveTouristPoints(lat?: number, lng?: number): Promise<TouristPoint[]> {
  let url = '/api/businesses/tourist-points/list';
  if (lat != null && lng != null) {
    url += `?lat=${lat}&lng=${lng}&radius=10000`;
  }
  const { data } = await api.get(url);
  return data;
}
