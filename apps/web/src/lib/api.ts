export type WeatherResponse = {
  city: string;
  country?: string;
  coordinates?: { lat: number; lon: number };
  current: {
    temp: number;
    condition: string;
    feelsLike: number;
    humidity: number;
    wind: number;
    pressure: number;
    visibility: number;
    uv: number | null;
    sunrise: string;
    sunset: string;
    min: number;
    max: number;
    icon?: string;
  };
  hourly?: Array<{
    hour: number;
    temp: number;
    rain: number;
    humidity: number;
    wind: number;
    condition?: string;
    icon?: string;
  }>;
  daily?: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
    rain: number;
    wind?: number;
    icon?: string;
  }>;
  provider?: {
    source: string;
    live: boolean;
    cached: boolean;
    refreshedAt: string;
    error?: string;
  };
};

export type AqiResponse = {
  score: number;
  category: string;
  pm25: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  recommendation: string;
  provider?: { source: string; live: boolean; refreshedAt: string };
};

export type CitySearchResult = {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  displayName: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// Coordinate cache keyed by normalized city name
const coordCache = new Map<string, { lat: string; lon: string }>();

export async function fetchWeather(city: string): Promise<WeatherResponse> {
  const response = await fetch(
    `${API_URL}/weather/current?city=${encodeURIComponent(city)}`,
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error("Weather service is not responding");
  const data: WeatherResponse = await response.json();
  if (data.coordinates) {
    coordCache.set(city.trim().toLowerCase(), {
      lat: String(data.coordinates.lat),
      lon: String(data.coordinates.lon),
    });
  }
  return data;
}

export async function fetchAqi(city?: string): Promise<AqiResponse> {
  let lat = "31.5204";
  let lon = "74.3587";
  if (city) {
    const key = city.trim().toLowerCase();
    const cached = coordCache.get(key);
    if (cached) { lat = cached.lat; lon = cached.lon; }
  }
  const response = await fetch(`${API_URL}/weather/aqi?lat=${lat}&lon=${lon}`, { cache: "no-store" });
  if (!response.ok) throw new Error("AQI service is not responding");
  return response.json() as Promise<AqiResponse>;
}

// Live city search using Open-Meteo geocoding (free, no key needed)
export async function searchCities(query: string): Promise<CitySearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];
    return (data.results as Array<{
      name: string; country: string; admin1?: string;
      latitude: number; longitude: number; country_code: string;
    }>).map((r) => ({
      name: r.name,
      country: r.country,
      state: r.admin1,
      lat: r.latitude,
      lon: r.longitude,
      displayName: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
    }));
  } catch {
    return [];
  }
}
