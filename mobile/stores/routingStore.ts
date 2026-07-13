import { create } from 'zustand';

export interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

export interface RouteInfo {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export type RouteProfile = 'driving' | 'walking' | 'cycling';

interface RoutingState {
  origin: RoutePoint | null;
  destination: RoutePoint | null;
  routeGeoJSON: any;
  routeInfo: RouteInfo | null;
  profile: RouteProfile;
  setOrigin: (point: RoutePoint | null) => void;
  setDestination: (point: RoutePoint | null) => void;
  setRoute: (geoJSON: any, info: RouteInfo | null) => void;
  setProfile: (profile: RouteProfile) => void;
  clearRoute: () => void;
}

export const useRoutingStore = create<RoutingState>((set) => ({
  origin: null,
  destination: null,
  routeGeoJSON: null,
  routeInfo: null,
  profile: 'driving',

  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setRoute: (routeGeoJSON, routeInfo) => set({ routeGeoJSON, routeInfo }),
  setProfile: (profile) => set({ profile }),
  clearRoute: () => set({ routeGeoJSON: null, routeInfo: null, origin: null, destination: null }),
}));
