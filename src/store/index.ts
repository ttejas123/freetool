import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark';
  favorites: string[];
  recentTools: string[];
  toggleTheme: () => void;
  toggleFavorite: (toolId: string) => void;
  addRecentTool: (toolId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light', // Default to light mode as requested
      favorites: [],
      recentTools: [],
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      toggleFavorite: (toolId) =>
        set((state) => ({
          favorites: state.favorites.includes(toolId)
            ? state.favorites.filter((id) => id !== toolId)
            : [...state.favorites, toolId],
        })),
      addRecentTool: (toolId) =>
        set((state) => {
          const filtered = state.recentTools.filter((id) => id !== toolId);
          return { recentTools: [toolId, ...filtered].slice(0, 5) }; // Keep last 5 recent
        }),
    }),
    {
      name: 'dev-tools-storage',
    }
  )
);
