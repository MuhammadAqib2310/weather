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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// City-to-coordinate cache to avoid repeated lookups
const coordCache = new Map<string, { lat: string; lon: string }>();

// Default coords map for common Pakistani / world cities
const knownCoords: Record<string, { lat: string; lon: string }> = {
  lahore:    { lat: "31.5204", lon: "74.3587" },
  karachi:   { lat: "24.8607", lon: "67.0011" },
  islamabad: { lat: "33.6844", lon: "73.0479" },
  rawalpindi:{ lat: "33.5651", lon: "73.0169" },
  peshawar:  { lat: "34.0151", lon: "71.5249" },
  multan:    { lat: "30.1978", lon: "71.4711" },
  dubai:     { lat: "25.2048", lon: "55.2708" },
  london:    { lat: "51.5074", lon: "-0.1278" },
  "new york":{ lat: "40.7128", lon: "-74.0060" },
  paris:     { lat: "48.8566", lon: "2.3522" },
};

function getCoordsForCity(city: string): { lat: string; lon: string } | null {
  const key = city.trim().toLowerCase();
  if (coordCache.has(key)) return coordCache.get(key)!;
  if (knownCoords[key]) return knownCoords[key];
  return null;
}

export async function fetchWeather(city: string): Promise<WeatherResponse> {
  const response = await fetch(
    `${API_URL}/weather/current?city=${encodeURIComponent(city)}`,
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error("Weather service is not responding");
  const data: WeatherResponse = await response.json();

  // Cache coordinates returned by the API for AQI use
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
    const coords = getCoordsForCity(city);
    if (coords) {
      lat = coords.lat;
      lon = coords.lon;
    }
  }

  const response = await fetch(
    `${API_URL}/weather/aqi?lat=${lat}&lon=${lon}`,
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error("AQI service is not responding");
  return response.json() as Promise<AqiResponse>;
}
