import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light";
type Language = "en" | "ur";

export type SavedLocation = {
  city: string;
  country?: string;
  lat?: number;
  lon?: number;
  pinnedAt: string;
};

type WeatherState = {
  city: string;
  theme: Theme;
  language: Language;
  recentSearches: string[];
  favorites: SavedLocation[];
  setCity: (city: string) => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  addRecentSearch: (city: string) => void;
  addFavorite: (location: Omit<SavedLocation, "pinnedAt">) => void;
  removeFavorite: (city: string) => void;
  isFavorite: (city: string) => boolean;
  clearRecentSearches: () => void;
};

const normalizeCity = (city: string) => city.trim().replace(/\s+/g, " ");

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      city: "Lahore",
      theme: "dark",
      language: "en",
      recentSearches: ["Lahore", "Karachi", "Islamabad"],
      favorites: [],
      setCity: (city) => set({ city: normalizeCity(city) || "Lahore" }),
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      toggleLanguage: () => set((state) => ({ language: state.language === "en" ? "ur" : "en" })),
      addRecentSearch: (city) => {
        const normalized = normalizeCity(city);
        if (!normalized) return;
        set((state) => ({
          recentSearches: [normalized, ...state.recentSearches.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 8)
        }));
      },
      addFavorite: (location) => {
        const normalized = normalizeCity(location.city);
        if (!normalized) return;
        set((state) => ({
          favorites: [
            { ...location, city: normalized, pinnedAt: new Date().toISOString() },
            ...state.favorites.filter((item) => item.city.toLowerCase() !== normalized.toLowerCase())
          ].slice(0, 12)
        }));
      },
      removeFavorite: (city) => {
        const normalized = normalizeCity(city).toLowerCase();
        set((state) => ({ favorites: state.favorites.filter((item) => item.city.toLowerCase() !== normalized) }));
      },
      isFavorite: (city) => get().favorites.some((item) => item.city.toLowerCase() === normalizeCity(city).toLowerCase()),
      clearRecentSearches: () => set({ recentSearches: [] })
    }),
    { name: "zeeshu-weather-alert-store" }
  )
);
