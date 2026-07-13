const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'MapsInteractive/1.0';

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  type: string;
}

export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
  if (!query || query.length < 3) return [];
  const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=0`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return [];
  const data: any[] = await res.json();
  return data.map((item) => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    displayName: item.display_name,
    type: item.type || 'unknown',
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lng}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const data = await res.json();
  return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
