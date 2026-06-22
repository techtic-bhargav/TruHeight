import { create } from 'zustand';

interface NavigationState {
  currentPath: string;
  setCurrentPath: (path: string) => void;
}

export const useNavigationStore = create<NavigationState>(set => ({
  currentPath: '',
  setCurrentPath: (currentPath: string) => set({ currentPath }),
}));


