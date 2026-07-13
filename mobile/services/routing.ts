import { OSRM_URL } from '../constants/Api';
import type { RouteProfile, RouteStep } from '../stores/routingStore';

const PROFILE_MAP: Record<RouteProfile, string> = {
  driving: 'driving',
  walking: 'walking',
  cycling: 'cycling',
};

interface Step {
  name: string;
  distance: number;
  duration: number;
  maneuver: { instruction: string };
}

interface Leg {
  steps: Step[];
  distance: number;
  duration: number;
}

interface RouteGeometry {
  coordinates: [number, number][];
  type: string;
}

interface RouteObject {
  geometry: RouteGeometry;
  legs: Leg[];
  distance: number;
  duration: number;
}

interface RouteResponse {
  code: string;
  routes: RouteObject[];
}

export interface RouteResult {
  geometry: string;
  distance: number;
  duration: number;
  steps: RouteStep[];
}

function parseInstruction(step: Step): string {
  const type = step.maneuver?.instruction || '';
  const name = step.name || '';
  if (type) return `${type} hacia ${name}`;
  return `Continuar por ${name || 'la vía'}`;
}

export async function getRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  profile: RouteProfile = 'driving'
): Promise<RouteResult | null> {
  try {
    const p = PROFILE_MAP[profile];
    const url = `${OSRM_URL}/route/v1/${p}/${originLng},${originLat};${destLng},${destLat}?geometries=geojson&overview=full&steps=true&alternatives=false`;
    const res = await fetch(url);
    const data: RouteResponse = await res.json();

    if (data.code === 'Ok' && data.routes.length > 0) {
      const route = data.routes[0];
      const steps: RouteStep[] = [];
      for (const leg of route.legs) {
        for (const step of leg.steps) {
          steps.push({
            instruction: parseInstruction(step),
            distance: step.distance,
            duration: step.duration,
          });
        }
      }
      return {
        geometry: JSON.stringify(route.geometry),
        distance: route.distance,
        duration: route.duration,
        steps,
      };
    }
    return null;
  } catch {
    return null;
  }
}
