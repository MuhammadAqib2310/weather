import { env } from "../config/env.js";

type OpenWeatherCurrent = {
  name: string;
  coord: { lat: number; lon: number };
  main: { temp: number; feels_like: number; humidity: number; pressure: number; temp_min: number; temp_max: number };
  visibility?: number;
  wind: { speed: number; deg?: number };
  weather?: Array<{ description: string; main: string; icon: string }>;
  sys: { sunrise: number; sunset: number; country?: string };
  timezone?: number;
};

type OpenWeatherForecastItem = {
  dt: number;
  main: { temp: number; humidity: number; temp_min: number; temp_max: number };
  weather?: Array<{ description: string; main: string; icon: string }>;
  wind: { speed: number };
  pop?: number;
};

type OpenWeatherForecast = { list: OpenWeatherForecastItem[] };

type CacheEntry = { expiresAt: number; value: unknown };
const cache = new Map<string, CacheEntry>();
const cacheMs = 5 * 60 * 1000;

const fallbackHourly = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  temp: 28 + ((i * 2) % 8),
  rain: 18 + ((i * 7) % 74),
  humidity: 55 + ((i * 3) % 30),
  wind: 8 + ((i * 2) % 18)
}));

const fallback = {
  city: "Lahore",
  country: "PK",
  coordinates: { lat: 31.5204, lon: 74.3587 },
  provider: { source: "demo", live: false, cached: false, refreshedAt: new Date().toISOString() },
  current: { temp: 31, condition: "Thunderstorms", feelsLike: 34, humidity: 62, wind: 18, pressure: 1008, visibility: 9600, uv: 7, sunrise: "05:02", sunset: "19:12", min: 27, max: 36, icon: "11d" },
  hourly: fallbackHourly,
  daily: ["Today", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"].map((day, i) => ({ day, high: 31 + (i % 6), low: 23 + (i % 5), condition: i % 2 ? "Partly cloudy" : "Storm risk", rain: i % 2 ? 22 : 68, wind: 10 + i }))
};

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached(key: string, value: unknown) {
  cache.set(key, { expiresAt: Date.now() + cacheMs, value });
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Provider request failed with ${response.status}: ${body.slice(0, 160)}`);
  }
  return response.json() as Promise<T>;
}

function dayName(timestamp: number, timezoneOffset = 0) {
  return new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(new Date((timestamp + timezoneOffset) * 1000));
}

function formatClock(timestamp: number, timezoneOffset = 0) {
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC" }).format(new Date((timestamp + timezoneOffset) * 1000));
}

function mapHourly(items: OpenWeatherForecastItem[], timezoneOffset = 0) {
  return items.slice(0, 24).map((item) => ({
    hour: Number(new Intl.DateTimeFormat("en", { hour: "2-digit", hour12: false, timeZone: "UTC" }).format(new Date((item.dt + timezoneOffset) * 1000))),
    temp: Math.round(item.main.temp),
    rain: Math.round((item.pop || 0) * 100),
    humidity: item.main.humidity,
    wind: Math.round(item.wind.speed * 3.6),
    condition: item.weather?.[0]?.description || "Forecast",
    icon: item.weather?.[0]?.icon || "02d"
  }));
}

function mapDaily(items: OpenWeatherForecastItem[], timezoneOffset = 0) {
  const grouped = new Map<string, OpenWeatherForecastItem[]>();
  for (const item of items) {
    const key = new Date((item.dt + timezoneOffset) * 1000).toISOString().slice(0, 10);
    grouped.set(key, [...(grouped.get(key) || []), item]);
  }

  return Array.from(grouped.values()).slice(0, 7).map((group, index) => {
    const rain = Math.round(Math.max(...group.map((item) => item.pop || 0)) * 100);
    const high = Math.round(Math.max(...group.map((item) => item.main.temp_max)));
    const low = Math.round(Math.min(...group.map((item) => item.main.temp_min)));
    const midday = group[Math.floor(group.length / 2)];
    return {
      day: index === 0 ? "Today" : dayName(midday.dt, timezoneOffset),
      high,
      low,
      rain,
      wind: Math.round(midday.wind.speed * 3.6),
      condition: midday.weather?.[0]?.description || "Forecast",
      icon: midday.weather?.[0]?.icon || "02d"
    };
  });
}

async function getOpenWeather(city: string) {
  const currentUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
  currentUrl.searchParams.set("q", city);
  currentUrl.searchParams.set("units", "metric");
  currentUrl.searchParams.set("appid", env.OPENWEATHER_API_KEY || "");

  const current = await fetchJson<OpenWeatherCurrent>(currentUrl);

  const forecastUrl = new URL("https://api.openweathermap.org/data/2.5/forecast");
  forecastUrl.searchParams.set("lat", String(current.coord.lat));
  forecastUrl.searchParams.set("lon", String(current.coord.lon));
  forecastUrl.searchParams.set("units", "metric");
  forecastUrl.searchParams.set("appid", env.OPENWEATHER_API_KEY || "");

  const forecast = await fetchJson<OpenWeatherForecast>(forecastUrl);
  const timezone = current.timezone || 0;

  return {
    city: current.name,
    country: current.sys.country,
    coordinates: current.coord,
    provider: { source: "openweathermap", live: true, cached: false, refreshedAt: new Date().toISOString() },
    current: {
      temp: Math.round(current.main.temp),
      condition: current.weather?.[0]?.description || "Unknown",
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      wind: Math.round(current.wind.speed * 3.6),
      pressure: current.main.pressure,
      visibility: current.visibility || 0,
      uv: null,
      sunrise: formatClock(current.sys.sunrise, timezone),
      sunset: formatClock(current.sys.sunset, timezone),
      min: Math.round(current.main.temp_min),
      max: Math.round(current.main.temp_max),
      icon: current.weather?.[0]?.icon || "02d"
    },
    hourly: mapHourly(forecast.list, timezone),
    daily: mapDaily(forecast.list, timezone)
  };
}

export async function getWeatherByCity(city: string) {
  const normalizedCity = city.trim() || "Lahore";
  const key = `weather:${normalizedCity.toLowerCase()}`;
  const cached = getCached<typeof fallback>(key);
  if (cached) return { ...cached, provider: { ...cached.provider, cached: true } };

  if (!env.OPENWEATHER_API_KEY) {
    const value = { ...fallback, city: normalizedCity, provider: { ...fallback.provider, refreshedAt: new Date().toISOString() } };
    setCached(key, value);
    return value;
  }

  try {
    const value = await getOpenWeather(normalizedCity);
    setCached(key, value);
    return value;
  } catch (error) {
    const value = {
      ...fallback,
      city: normalizedCity,
      provider: {
        source: "fallback",
        live: false,
        cached: false,
        refreshedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Weather provider failed"
      }
    };
    setCached(key, value);
    return value;
  }
}

function normalizeAqicn(data: any) {
  const iaqi = data?.data?.iaqi || {};
  const score = Number(data?.data?.aqi) || 0;
  const category = score <= 50 ? "Good" : score <= 100 ? "Moderate" : score <= 150 ? "Unhealthy for sensitive groups" : score <= 200 ? "Unhealthy" : "Hazardous";
  return {
    score,
    category,
    pm25: iaqi.pm25?.v,
    pm10: iaqi.pm10?.v,
    co: iaqi.co?.v,
    no2: iaqi.no2?.v,
    o3: iaqi.o3?.v,
    recommendation: score <= 100 ? "Air quality is acceptable for most people." : "Reduce outdoor activity and keep sensitive groups indoors.",
    provider: { source: "aqicn", live: true, refreshedAt: new Date().toISOString() }
  };
}

export async function getAqi(lat: string, lon: string) {
  const key = `aqi:${lat}:${lon}`;
  const cached = getCached<object>(key);
  if (cached) return { ...cached, provider: { ...(cached as any).provider, cached: true } };

  if (!env.AQICN_TOKEN) {
    const value = { score: 86, category: "Moderate", pm25: 31, pm10: 74, co: 0.8, no2: 24, o3: 42, recommendation: "Sensitive groups should reduce prolonged outdoor activity.", provider: { source: "demo", live: false, refreshedAt: new Date().toISOString() } };
    setCached(key, value);
    return value;
  }

  try {
    const response = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${env.AQICN_TOKEN}`);
    if (!response.ok) throw new Error("AQICN request failed");
    const value = normalizeAqicn(await response.json());
    setCached(key, value);
    return value;
  } catch (error) {
    const value = { score: 86, category: "Moderate", pm25: 31, pm10: 74, co: 0.8, no2: 24, o3: 42, recommendation: "AQI fallback active until provider responds.", provider: { source: "fallback", live: false, refreshedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "AQI provider failed" } };
    setCached(key, value);
    return value;
  }
}
