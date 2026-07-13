import { create } from 'zustand';
import { startBackgroundTracking, stopBackgroundTracking } from '../services/backgroundLocation';

interface DrivingState {
  isDriving: boolean;
  setDriving: (on: boolean) => void;
  toggleDriving: () => void;
}

export const useDrivingStore = create<DrivingState>((set, get) => ({
  isDriving: false,
  setDriving: async (on) => {
    set({ isDriving: on });
    if (on) {
      await startBackgroundTracking().catch(() => {});
    } else {
      await stopBackgroundTracking().catch(() => {});
    }
  },
  toggleDriving: async () => {
    const next = !get().isDriving;
    set({ isDriving: next });
    if (next) {
      await startBackgroundTracking().catch(() => {});
    } else {
      await stopBackgroundTracking().catch(() => {});
    }
  },
}));
