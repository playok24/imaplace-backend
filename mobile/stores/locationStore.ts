import { create } from 'zustand';
import { NearbyBusiness, NearbyTouristPoint } from '../types';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  nearbyBusinesses: NearbyBusiness[];
  nearbyTouristPoints: NearbyTouristPoint[];
  isTracking: boolean;
  setLocation: (lat: number, lng: number) => void;
  setNearbyBusinesses: (businesses: NearbyBusiness[]) => void;
  addNearbyBusiness: (business: NearbyBusiness) => void;
  setNearbyTouristPoints: (points: NearbyTouristPoint[]) => void;
  addNearbyTouristPoint: (point: NearbyTouristPoint) => void;
  setTracking: (tracking: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  latitude: null,
  longitude: null,
  nearbyBusinesses: [],
  nearbyTouristPoints: [],
  isTracking: false,

  setLocation: (latitude, longitude) => set({ latitude, longitude }),

  setNearbyBusinesses: (businesses) => set({ nearbyBusinesses: businesses }),

  addNearbyBusiness: (business) =>
    set((state) => ({
      nearbyBusinesses: state.nearbyBusinesses.some((b) => b.id === business.id)
        ? state.nearbyBusinesses
        : [...state.nearbyBusinesses, business],
    })),

  setNearbyTouristPoints: (points) => set({ nearbyTouristPoints: points }),

  addNearbyTouristPoint: (point) =>
    set((state) => ({
      nearbyTouristPoints: state.nearbyTouristPoints.some((p) => p.id === point.id)
        ? state.nearbyTouristPoints
        : [...state.nearbyTouristPoints, point],
    })),

  setTracking: (isTracking) => set({ isTracking }),
}));
