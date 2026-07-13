import { create } from 'zustand';
import { NearbyBusiness } from '../types';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  nearbyBusinesses: NearbyBusiness[];
  isTracking: boolean;
  setLocation: (lat: number, lng: number) => void;
  setNearbyBusinesses: (businesses: NearbyBusiness[]) => void;
  addNearbyBusiness: (business: NearbyBusiness) => void;
  setTracking: (tracking: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  latitude: null,
  longitude: null,
  nearbyBusinesses: [],
  isTracking: false,

  setLocation: (latitude, longitude) => set({ latitude, longitude }),

  setNearbyBusinesses: (businesses) => set({ nearbyBusinesses: businesses }),

  addNearbyBusiness: (business) =>
    set((state) => ({
      nearbyBusinesses: state.nearbyBusinesses.some((b) => b.id === business.id)
        ? state.nearbyBusinesses
        : [...state.nearbyBusinesses, business],
    })),

  setTracking: (isTracking) => set({ isTracking }),
}));
