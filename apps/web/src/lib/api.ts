/* ─────────────────────────────────────────────────────────────
   Zeeshu Weather Alert — API layer
   Uses Open-Meteo (100% free, no key) for real worldwide weather
   Falls back to local Express API when available
   ───────────────────────────────────────────────────────────── */

export type WeatherResponse = {
  city: string;
  country?: string;
  coordinates?: { lat: number; lon: number };
  current: {
    temp: number; condition: string; feelsLike: number; humidity: number;
    wind: number; pressure: number; visibility: number; uv: number | null;
    sunrise: string; sunset: string; min: number; max: number; icon?: string;
    windDir?: number; dewpoint?: number;
  };
  hourly?: Array<{ hour: number; temp: number; rain: number; humidity: number; wind: number; condition?: string }>;
  daily?:  Array<{ day: string; high: number; low: number; condition: string; rain: number; wind?: number }>;
  provider?: { source: string; live: boolean; cached: boolean; refreshedAt: string; error?: string };
};

export type AqiResponse = {
  score: number; category: string; pm25: number; pm10: number;
  co: number; no2: number; o3: number; recommendation: string;
  provider?: { source: string; live: boolean; refreshedAt: string };
};

export type CitySearchResult = {
  name: string; country: string; state?: string;
  lat: number; lon: number; displayName: string;
};

/* ── WMO weather code → description ── */
const WMO: Record<number, string> = {
  0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",
  45:"Foggy",48:"Icy fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",
  61:"Light rain",63:"Rain",65:"Heavy rain",71:"Light snow",73:"Snow",75:"Heavy snow",
  77:"Snow grains",80:"Light showers",81:"Showers",82:"Heavy showers",
  85:"Snow showers",86:"Heavy snow showers",95:"Thunderstorm",
  96:"Thunderstorm with hail",99:"Thunderstorm with heavy hail",
};
function wmoDesc(code: number) { return WMO[code] ?? "Unknown"; }

/* ── Format unix seconds to HH:MM AM/PM ── */
function fmtTime(iso: string) {
  const d = new Date(iso + "Z");
  return d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/* ── Day name from date string ── */
function dayName(dateStr: string, index: number) {
  if (index === 0) return "Today";
  return new Date(dateStr).toLocaleDateString("en", { weekday: "short" });
}

/* ────────────────────────────────────────
   CITY SEARCH — Open-Meteo Geocoding (free)
   ──────────────────────────────────────── */
export async function searchCities(query: string): Promise<CitySearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];
    return (data.results as Array<{ name: string; country: string; admin1?: string; latitude: number; longitude: number }>).map((r) => ({
      name: r.name, country: r.country, state: r.admin1,
      lat: r.latitude, lon: r.longitude,
      displayName: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
    }));
  } catch { return []; }
}

/* ────────────────────────────────────────
   GEOCODE a city name → coordinates
   ──────────────────────────────────────── */
async function geocode(city: string): Promise<{ lat: number; lon: number; name: string; country: string } | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const r = data.results?.[0];
    if (!r) return null;
    return { lat: r.latitude, lon: r.longitude, name: r.name, country: r.country ?? "" };
  } catch { return null; }
}

/* ────────────────────────────────────────
   WEATHER — Open-Meteo (free, no key)
   ──────────────────────────────────────── */
async function fetchOpenMeteo(lat: number, lon: number, cityName: string, country: string): Promise<WeatherResponse> {
  const params = new URLSearchParams({
    latitude: String(lat), longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility,uv_index,dew_point_2m",
    hourly: "temperature_2m,precipitation_probability,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset",
    forecast_days: "7", timezone: "auto", wind_speed_unit: "kmh",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Open-Meteo request failed");
  const d = await res.json();

  const cur = d.current;
  const daily = d.daily;
  const hourly = d.hourly;
  const now = new Date();
  const curHourIdx = now.getHours();

  return {
    city: cityName, country,
    coordinates: { lat, lon },
    provider: { source: "open-meteo", live: true, cached: false, refreshedAt: new Date().toISOString() },
    current: {
      temp: Math.round(cur.temperature_2m),
      condition: wmoDesc(cur.weather_code),
      feelsLike: Math.round(cur.apparent_temperature),
      humidity: cur.relative_humidity_2m,
      wind: Math.round(cur.wind_speed_10m),
      windDir: cur.wind_direction_10m,
      pressure: Math.round(cur.surface_pressure),
      visibility: Math.round((cur.visibility ?? 10000)),
      uv: cur.uv_index ? Math.round(cur.uv_index) : null,
      dewpoint: cur.dew_point_2m ? Math.round(cur.dew_point_2m) : undefined,
      sunrise: fmtTime(daily.sunrise[0]),
      sunset: fmtTime(daily.sunset[0]),
      min: Math.round(daily.temperature_2m_min[0]),
      max: Math.round(daily.temperature_2m_max[0]),
    },
    hourly: hourly.time.slice(curHourIdx, curHourIdx + 24).map((t: string, i: number) => ({
      hour: new Date(t).getHours(),
      temp: Math.round(hourly.temperature_2m[curHourIdx + i]),
      rain: hourly.precipitation_probability[curHourIdx + i] ?? 0,
      humidity: hourly.relative_humidity_2m[curHourIdx + i],
      wind: Math.round(hourly.wind_speed_10m[curHourIdx + i]),
      condition: wmoDesc(hourly.weather_code[curHourIdx + i]),
    })),
    daily: daily.time.map((dt: string, i: number) => ({
      day: dayName(dt, i),
      high: Math.round(daily.temperature_2m_max[i]),
      low: Math.round(daily.temperature_2m_min[i]),
      condition: wmoDesc(daily.weather_code[i]),
      rain: daily.precipitation_probability_max[i] ?? 0,
      wind: Math.round(daily.wind_speed_10m_max[i]),
    })),
  };
}

/* ────────────────────────────────────────
   PUBLIC: fetchWeather
   Tries Open-Meteo first (always works, free)
   Falls back to local Express API
   ──────────────────────────────────────── */
export async function fetchWeather(city: string): Promise<WeatherResponse> {
  // 1. Geocode the city
  const geo = await geocode(city);
  if (geo) {
    // 2. Fetch real weather from Open-Meteo
    return fetchOpenMeteo(geo.lat, geo.lon, geo.name, geo.country);
  }

  // 3. Fallback to Express API (needs OPENWEATHER_API_KEY)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const res = await fetch(`${API_URL}/weather/current?city=${encodeURIComponent(city)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Weather unavailable");
  return res.json();
}

/* ────────────────────────────────────────
   PUBLIC: fetchAqi
   Uses Open-Meteo Air Quality (free)
   ──────────────────────────────────────── */
export async function fetchAqi(cityOrCoords?: string | { lat: number; lon: number }): Promise<AqiResponse> {
  let lat = 31.5204; let lon = 74.3587;

  if (typeof cityOrCoords === "string" && cityOrCoords) {
    const geo = await geocode(cityOrCoords);
    if (geo) { lat = geo.lat; lon = geo.lon; }
  } else if (typeof cityOrCoords === "object" && cityOrCoords) {
    lat = cityOrCoords.lat; lon = cityOrCoords.lon;
  }

  try {
    const params = new URLSearchParams({
      latitude: String(lat), longitude: String(lon),
      current: "us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone",
      timezone: "auto",
    });
    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`, { cache: "no-store" });
    if (!res.ok) throw new Error("AQI unavailable");
    const d = await res.json();
    const cur = d.current;
    const score = Math.round(cur.us_aqi ?? 0);
    const category = score <= 50 ? "Good" : score <= 100 ? "Moderate" : score <= 150 ? "Unhealthy for Sensitive Groups" : score <= 200 ? "Unhealthy" : score <= 300 ? "Very Unhealthy" : "Hazardous";
    const recommendation = score <= 50 ? "Air quality is excellent. Enjoy outdoor activities!" : score <= 100 ? "Air quality is acceptable for most people." : score <= 150 ? "Sensitive groups should limit prolonged outdoor exposure." : "Avoid outdoor activities. Wear a mask if going outside.";
    return {
      score, category,
      pm25: Math.round(cur.pm2_5 ?? 0),
      pm10: Math.round(cur.pm10 ?? 0),
      co: +(cur.carbon_monoxide ?? 0).toFixed(1),
      no2: Math.round(cur.nitrogen_dioxide ?? 0),
      o3: Math.round(cur.ozone ?? 0),
      recommendation,
      provider: { source: "open-meteo-aqi", live: true, refreshedAt: new Date().toISOString() },
    };
  } catch {
    return { score: 0, category: "Unknown", pm25: 0, pm10: 0, co: 0, no2: 0, o3: 0, recommendation: "AQI data unavailable.", provider: { source: "unavailable", live: false, refreshedAt: new Date().toISOString() } };
  }
}
