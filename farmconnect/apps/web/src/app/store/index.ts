import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth slice will be implemented in Phase 3.
// This file exports the root store creator — each feature adds its own slice.

export interface RootState {
  _version: number;
}

export const useRootStore = create<RootState>()(
  persist(
    () => ({
      _version: 1,
    }),
    {
      name: 'fc-root',
      partialize: (state) => ({ _version: state._version }),
    },
  ),
);
