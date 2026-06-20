"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, Bell, CheckCircle2, CloudLightning, CloudRain,
  Droplets, Gauge, Heart, Loader2, MapPin, Moon, Navigation,
  Radar, Search, Settings, ShieldAlert, Sparkles, Star,
  Sun, Thermometer, TrendingUp, Users, Wind, Zap,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { fetchAqi, fetchWeather, type WeatherResponse } from "@/lib/api";
import { useWeatherStore } from "@/store/weather-store";

/* ─── Demo / fallback data ─── */
const demoWeather: WeatherResponse = {
  city: "Lahore",
  current: {
    temp: 31, condition: "Thunderstorms", feelsLike: 34, humidity: 62,
    wind: 18, pressure: 1008, visibility: 9600, uv: 7,
    sunrise: "05:02", sunset: "19:12", min: 27, max: 36,
  },
  hourly: Array.from({ length: 12 }, (_, i) => ({
    hour: i + 8,
    temp: 27 + ((i * 2) % 9),
    rain: 18 + ((i * 9) % 70),
    humidity: 55 + ((i * 4) % 30),
    wind: 9 + ((i * 3) % 18),
  })),
  daily: ["Today", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"].map((day, i) => ({
    day,
    high: 32 + (i % 5),
    low: 23 + (i % 4),
    condition: i % 2 ? "Partly cloudy" : "Storm risk",
    rain: i % 2 ? 24 : 68,
  })),
};

const cityChips = ["Lahore", "Karachi", "Islamabad", "Dubai", "London", "New York"];
const navFeatures = ["Radar", "AQI", "Alerts", "Community", "Admin"];

const demoAlerts = [
  { title: "Thunderstorm Warning", body: "High-energy cell approaching the selected region.", severity: "critical" },
  { title: "Flood Watch", body: "Low lying roads may collect water during peak rain.", severity: "warning" },
  { title: "Heat Advisory", body: "Avoid prolonged sun exposure during afternoon hours.", severity: "watch" },
];

const demoPosts = [
  { title: "Rain bands reported near DHA", place: "Lahore", likes: 42 },
  { title: "Dusty wind and low visibility", place: "Multan", likes: 31 },
  { title: "Clear sunset after scattered clouds", place: "Karachi", likes: 55 },
];

const operations = [
  { label: "Provider health", value: "99.98%", detail: "OpenWeather + AQICN ready" },
  { label: "Alert pipeline", value: "Live", detail: "FCM push notification hooks" },
  { label: "Refresh policy", value: "5 min", detail: "Auto refresh dashboard-ready" },
  { label: "Security", value: "RLS", detail: "Supabase policies included" },
];

/* ─── Localisation ─── */
const labels = {
  en: {
    command: "Weather Intelligence Command",
    title: "Zeeshu Weather Alert",
    subtitle:
      "A premium real-time weather, radar, satellite, AQI, lightning and severe alert platform for worldwide cities.",
    search: "Search any city worldwide…",
    current: "Current weather",
    forecast: "Hourly intelligence",
    week: "7-day outlook",
    radar: "Radar, Satellite & Storm Tracking",
    alerts: "Severe Weather Alert Center",
    community: "Community Weather Network",
    admin: "Production Operations",
    ready: "Production-ready platform",
    feelsLike: "Feels like",
    humidity: "Humidity",
    wind: "Wind speed",
    pressure: "Pressure",
    visibility: "Visibility",
    uvIndex: "UV index",
    sunset: "Sunset",
    minMax: "Min / Max",
  },
  ur: {
    command: "موسم انٹیلیجنس کمانڈ",
    title: "زیشو ویدر الرٹ",
    subtitle: "دنیا بھر کے شہروں کے لیے موسم، ریڈار، سیٹلائٹ، AQI، بجلی اور شدید موسم کے الرٹس۔",
    search: "دنیا بھر میں شہر تلاش کریں…",
    current: "موجودہ موسم",
    forecast: "گھنٹہ وار معلومات",
    week: "7 دن کی پیشگوئی",
    radar: "ریڈار، سیٹلائٹ اور طوفان ٹریکنگ",
    alerts: "شدید موسم الرٹ سینٹر",
    community: "کمیونٹی ویدر نیٹ ورک",
    admin: "پروڈکشن آپریشنز",
    ready: "پروڈکشن پلیٹفارم",
    feelsLike: "محسوس درجہ حرارت",
    humidity: "نمی",
    wind: "ہوا کی رفتار",
    pressure: "دباؤ",
    visibility: "مرئیت",
    uvIndex: "UV انڈیکس",
    sunset: "غروب آفتاب",
    minMax: "کم / زیادہ",
  },
};

/* ─── Sub-components ─── */
function ShellCard({
  children, className = "", id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`glass shine rounded-3xl p-5 ${className}`}>
      {children}
    </section>
  );
}

function Metric({
  icon: Icon, label, value, tone = "text-sky-100",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/6 p-4 transition hover:-translate-y-1 hover:bg-white/10">
      <div className="mb-3 flex items-center justify-between">
        <div className="grid size-10 place-items-center rounded-xl bg-white/10">
          <Icon className={tone} size={20} />
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-300/10 px-2 py-1 text-xs text-emerald-200">
          <span className="status-dot" />
          Live
        </span>
      </div>
      <p className="text-xs text-sky-100/55">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-skyglow to-aurora transition-all duration-500 group-hover:w-5/6" />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="skeleton mb-3 h-6 w-1/3" />
      <div className="skeleton mb-2 h-16 w-full" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  );
}

/* ─── Main page ─── */
export default function Home() {
  const { city, setCity, theme, toggleTheme, language, toggleLanguage, addFavorite, removeFavorite, isFavorite } =
    useWeatherStore();
  const [query, setQuery] = useState(city);
  const [weather, setWeather] = useState<WeatherResponse>(demoWeather);
  const [aqi, setAqi] = useState<{
    score: number; category: string; pm25: number; pm10: number;
    co: number; no2: number; o3: number; recommendation: string;
  }>({
    score: 86, category: "Moderate", pm25: 31, pm10: 74,
    co: 0.8, no2: 24, o3: 42,
    recommendation: "Sensitive groups should reduce prolonged outdoor activity.",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Demo data active — add API keys for live weather");
  const t = labels[language];

  async function loadWeather(nextCity = query) {
    setIsLoading(true);
    setStatus("Syncing live weather providers…");
    try {
      const [weatherData, aqiData] = await Promise.all([
        fetchWeather(nextCity),
        fetchAqi(nextCity),
      ]);
      setWeather({
        ...demoWeather,
        ...weatherData,
        hourly: weatherData.hourly ?? demoWeather.hourly,
        daily: weatherData.daily ?? demoWeather.daily,
      });
      setAqi(aqiData);
      const resolvedCity = weatherData.city || nextCity;
      setCity(resolvedCity);
      setQuery(resolvedCity);
      setStatus("Live provider sync complete");
    } catch {
      setWeather({ ...demoWeather, city: nextCity });
      setStatus("Using resilient demo fallback — API keys not configured");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadWeather(city); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hourly = useMemo(
    () =>
      (weather.hourly ?? demoWeather.hourly ?? []).map((item) => ({
        ...item,
        label: `${String(item.hour).padStart(2, "0")}:00`,
      })),
    [weather],
  );
  const daily = weather.daily ?? demoWeather.daily ?? [];
  const c = weather.current;
  const visibilityKm = `${Math.round((c.visibility || 0) / 100) / 10} km`;
  const cityFavorited = isFavorite(weather.city || city);

  function handleFavoriteToggle() {
    const currentCity = weather.city || city;
    if (cityFavorited) removeFavorite(currentCity);
    else addFavorite({ city: currentCity });
  }


  return (
    <main className={theme === "light" ? "light min-h-screen bg-sky-50 text-ink" : "min-h-screen bg-ink text-white"}>
      <div className="premium-shell min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_10%,rgba(57,194,255,.28),transparent_34%),radial-gradient(circle_at_86%_4%,rgba(69,240,194,.16),transparent_32%),linear-gradient(145deg,#061225_0%,#0b2b4f_46%,#07111f_100%)] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8">

        {/* ── Top navigation ── */}
        <nav className="sticky top-4 z-40 mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-white/10 bg-white/8 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-skyglow text-ink shadow-glow">
              <CloudLightning size={22} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-[.28em] text-sky-100/50">{t.command}</p>
              <h1 className="truncate font-semibold">{t.title}</h1>
            </div>
          </div>
          <div className="hidden items-center gap-1 lg:flex">
            {navFeatures.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="rounded-full px-4 py-2 text-sm text-sky-100/70 transition hover:bg-white/10 hover:text-white"
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="rounded-full border border-white/15 px-3 py-2 text-sm transition hover:bg-white/10"
              aria-label="Toggle language"
            >
              {language === "en" ? "اردو" : "EN"}
            </button>
            <button
              onClick={toggleTheme}
              className="grid size-10 place-items-center rounded-full border border-white/15 transition hover:bg-white/10"
              aria-label="Toggle theme"
            >
              <Sun size={18} />
            </button>
            <a
              href="/auth"
              className="hidden rounded-full border border-skyglow/40 bg-skyglow/15 px-4 py-2 text-sm text-skyglow transition hover:bg-skyglow/25 sm:block"
            >
              Sign in
            </a>
          </div>
        </nav>

        {/* ── Mobile dock ── */}
        <div className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 gap-1 rounded-3xl border border-white/10 bg-[#07182d]/90 p-2 shadow-2xl backdrop-blur-xl lg:hidden mobile-dock">
          {navFeatures.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-2xl px-2 py-3 text-center text-xs text-sky-100/70 transition hover:bg-white/10 hover:text-white"
            >
              {item}
            </a>
          ))}
        </div>

        {/* ── Hero + current weather ── */}
        <div className="mx-auto mt-7 grid max-w-7xl gap-5 xl:grid-cols-[1.45fr_.55fr]">
          {/* Hero search card */}
          <ShellCard className="relative overflow-hidden p-7 sm:p-8">
            <div className="absolute -right-8 top-8 hidden animate-float text-skyglow/15 md:block">
              <CloudRain size={220} />
            </div>
            <div className="relative z-10 max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-3 py-1.5 text-sm text-cyan-100">
                <Sparkles size={15} /> {t.ready}
              </p>
              <h2 className="text-4xl font-semibold leading-tight sm:text-6xl">{t.title}</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-sky-100/72">{t.subtitle}</p>

              {/* Search form */}
              <form
                onSubmit={(e) => { e.preventDefault(); void loadWeather(query); }}
                className="mt-7 flex max-w-2xl flex-col items-stretch gap-2 rounded-2xl border border-white/15 bg-white/8 p-2 transition focus-within:border-skyglow/40 sm:flex-row sm:items-center"
              >
                <Search className="ml-3 shrink-0 text-sky-100/60" size={20} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.search}
                  aria-label="Search city"
                  className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-sky-100/40"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-skyglow px-5 py-3 text-sm font-semibold text-ink transition hover:bg-[#5dceff] disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />}
                  Search
                </button>
              </form>

              {/* City chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {cityChips.map((item) => (
                  <button
                    key={item}
                    onClick={() => { setQuery(item); void loadWeather(item); }}
                    className="rounded-full border border-white/12 bg-white/6 px-3 py-2 text-xs text-sky-100/70 transition hover:-translate-y-0.5 hover:bg-white/12 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Quick stats */}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Coverage", value: "Global" },
                  { label: "Refresh", value: "5 min" },
                  { label: "Alerts", value: "Push" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-widest text-sky-100/45">{label}</p>
                    <p className="mt-1 text-2xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </ShellCard>

          {/* Current weather card */}
          <ShellCard>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-sky-100/55">{t.current}</p>
                <h3 className="mt-1 flex items-center gap-2 text-xl font-semibold">
                  <MapPin size={18} className="text-skyglow" />
                  {weather.city || city}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFavoriteToggle}
                  aria-label={cityFavorited ? "Remove from favorites" : "Add to favorites"}
                  className={`grid size-9 place-items-center rounded-full border transition ${cityFavorited ? "border-amber-400/40 bg-amber-400/15 text-amber-300" : "border-white/15 text-sky-100/50 hover:border-white/30 hover:text-amber-300"}`}
                >
                  <Star size={16} fill={cityFavorited ? "currentColor" : "none"} />
                </button>
                <Bell className="text-amber-300" size={20} />
              </div>
            </div>

            <div className="mt-7 flex items-end justify-between">
              <div>
                <p className="text-7xl font-semibold">
                  {Math.round(c.temp)}<span className="text-3xl">°</span>
                </p>
                <p className="capitalize text-xl text-sky-100/70">{c.condition}</p>
              </div>
              <CloudLightning className="text-amber-300" size={80} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-white/6 px-3 py-2.5">
                <p className="text-sky-100/50">High</p>
                <p className="font-semibold">{Math.round(c.max)}°</p>
              </div>
              <div className="rounded-2xl bg-white/6 px-3 py-2.5">
                <p className="text-sky-100/50">Low</p>
                <p className="font-semibold">{Math.round(c.min)}°</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm text-sky-100/65">
                <CheckCircle2 className="shrink-0 text-aurora" size={16} />
                {status}
              </p>
            </div>
          </ShellCard>
        </div>

        {/* ── 8 metric cards ── */}
        <div className="mx-auto mt-5 grid max-w-7xl gap-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="col-span-1">
                <SkeletonCard />
              </div>
            ))
          ) : (
            <>
              <div className="sm:col-span-1 md:col-span-2 xl:col-span-2"><Metric icon={Thermometer} label={t.feelsLike} value={`${Math.round(c.feelsLike)}°C`} tone="text-amber-200" /></div>
              <div className="sm:col-span-1 md:col-span-2 xl:col-span-2"><Metric icon={Droplets} label={t.humidity} value={`${c.humidity}%`} tone="text-skyglow" /></div>
              <div className="sm:col-span-1 md:col-span-2 xl:col-span-2"><Metric icon={Wind} label={t.wind} value={`${c.wind} km/h`} tone="text-aurora" /></div>
              <div className="sm:col-span-1 md:col-span-2 xl:col-span-2"><Metric icon={Gauge} label={t.pressure} value={`${c.pressure} hPa`} tone="text-violet-200" /></div>
              <div className="sm:col-span-1 md:col-span-2 xl:col-span-2"><Metric icon={Navigation} label={t.visibility} value={visibilityKm} /></div>
              <div className="sm:col-span-1 md:col-span-2 xl:col-span-2"><Metric icon={Sun} label={t.uvIndex} value={c.uv ? `${c.uv} — High` : "Live only"} tone="text-yellow-200" /></div>
              <div className="sm:col-span-1 md:col-span-2 xl:col-span-2"><Metric icon={Moon} label={t.sunset} value={String(c.sunset).slice(0, 8)} /></div>
              <div className="sm:col-span-1 md:col-span-2 xl:col-span-2"><Metric icon={TrendingUp} label={t.minMax} value={`${Math.round(c.min)}° / ${Math.round(c.max)}°`} /></div>
            </>
          )}
        </div>

        {/* ── Hourly chart + 7-day ── */}
        <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-[1fr_.9fr]">
          <ShellCard id="radar">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{t.forecast}</h3>
              <Activity className="text-aurora" size={20} />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourly}>
                  <defs>
                    <linearGradient id="tempFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#39c2ff" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#39c2ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="humidFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#45f0c2" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#45f0c2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,.07)" vertical={false} />
                  <XAxis dataKey="label" stroke="rgba(189,232,255,.5)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="rgba(189,232,255,.5)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#071a31",
                      border: "1px solid rgba(255,255,255,.14)",
                      borderRadius: 14,
                      fontSize: 13,
                    }}
                  />
                  <Area type="monotone" dataKey="temp" stroke="#39c2ff" fill="url(#tempFill)" strokeWidth={2.5} name="Temp °C" />
                  <Area type="monotone" dataKey="humidity" stroke="#45f0c2" fill="url(#humidFill)" strokeWidth={2} name="Humidity %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ShellCard>

          <ShellCard>
            <h3 className="mb-4 text-xl font-semibold">{t.week}</h3>
            <div className="space-y-2">
              {daily.map((day) => (
                <div
                  key={day.day}
                  className="grid grid-cols-[.7fr_1.1fr_.4fr_.4fr_.5fr] items-center gap-2 rounded-2xl bg-white/6 px-3 py-2.5 text-sm transition hover:bg-white/10"
                >
                  <span className="font-semibold">{day.day}</span>
                  <span className="flex items-center gap-1.5 truncate text-sky-100/70">
                    <CloudRain size={15} className="shrink-0" />
                    <span className="truncate">{day.condition}</span>
                  </span>
                  <span className="text-right">{day.high}°</span>
                  <span className="text-right text-sky-100/50">{day.low}°</span>
                  <span className="text-right text-aurora">{day.rain}%</span>
                </div>
              ))}
            </div>
          </ShellCard>
        </div>

        {/* ── Radar shell + Lightning ── */}
        <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-3">
          <ShellCard className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{t.radar}</h3>
              <Radar className="text-skyglow" size={20} />
            </div>
            <div className="relative min-h-[380px] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_34%_44%,rgba(57,194,255,.50),transparent_12%),radial-gradient(circle_at_62%_52%,rgba(255,207,77,.34),transparent_11%),radial-gradient(circle_at_52%_36%,rgba(69,240,194,.32),transparent_18%),linear-gradient(135deg,#0a2445,#07172b)]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:46px_46px]" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {["Rain", "Clouds", "Temp", "Wind", "Satellite"].map((x) => (
                  <button
                    key={x}
                    className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur transition hover:bg-white/20"
                  >
                    {x}
                  </button>
                ))}
              </div>
              <div className="absolute bottom-4 left-4 max-w-sm rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur">
                <p className="font-semibold text-sm">Mapbox / OpenWeather layer-ready</p>
                <p className="mt-1 text-xs text-sky-100/65">
                  Interactive radar shell with rainfall, storm tracking, satellite, temperature and wind layer contracts.
                </p>
              </div>
            </div>
          </ShellCard>

          <ShellCard id="lightning">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Zap className="text-amber-300" size={20} /> Lightning Detection
            </h3>
            <div className="space-y-3">
              {[
                { label: "Strike rate", value: "21 strikes / 10 min" },
                { label: "Heatmap density", value: "High" },
                { label: "Nearest strike", value: "18.4 km away" },
                { label: "Module status", value: "WebSocket-ready" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl bg-white/6 px-4 py-3">
                  <p className="text-xs text-sky-100/50">{label}</p>
                  <p className="mt-0.5 font-semibold text-sm">{value}</p>
                </div>
              ))}
            </div>
          </ShellCard>
        </div>

        {/* ── AQI + Alerts ── */}
        <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-[.75fr_1.25fr]">
          <ShellCard id="aqi">
            <h3 className="mb-5 text-xl font-semibold">Air Quality Index</h3>
            <div className="flex items-center gap-5">
              <div
                className="grid size-28 shrink-0 place-items-center rounded-full text-3xl font-bold text-ink"
                style={{
                  background:
                    aqi.score <= 50
                      ? "linear-gradient(135deg,#6ee7b7,#34d399)"
                      : aqi.score <= 100
                      ? "linear-gradient(135deg,#fde68a,#fbbf24)"
                      : "linear-gradient(135deg,#fca5a5,#ef4444)",
                }}
              >
                {aqi.score}
              </div>
              <div>
                <p className="text-2xl font-semibold">{aqi.category}</p>
                <p className="mt-2 text-sm text-sky-100/65 leading-relaxed">{aqi.recommendation}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
              {[
                [`PM2.5`, aqi.pm25],
                [`PM10`, aqi.pm10],
                [`O₃`, aqi.o3],
                [`CO`, aqi.co],
                [`NO₂`, aqi.no2],
                ["Guide", "↗"],
              ].map(([label, val]) => (
                <div key={String(label)} className="rounded-2xl bg-white/6 py-2.5">
                  <p className="text-sky-100/50">{label}</p>
                  <p className="font-semibold">{val}</p>
                </div>
              ))}
            </div>
          </ShellCard>

          <ShellCard id="alerts">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <ShieldAlert className="text-amber-300" size={20} /> {t.alerts}
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {demoAlerts.map(({ title, body, severity }) => (
                <article
                  key={title}
                  className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
                    severity === "critical"
                      ? "border-red-400/25 bg-red-400/8"
                      : severity === "warning"
                      ? "border-amber-400/25 bg-amber-400/8"
                      : "border-sky-400/20 bg-sky-400/8"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      severity === "critical" ? "text-red-200" : severity === "warning" ? "text-amber-200" : "text-sky-200"
                    }`}
                  >
                    {title}
                  </p>
                  <p className="mt-2 text-xs text-sky-100/62 leading-relaxed">{body}</p>
                  <span
                    className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs uppercase tracking-wider ${
                      severity === "critical"
                        ? "bg-red-400/20 text-red-300"
                        : severity === "warning"
                        ? "bg-amber-400/20 text-amber-300"
                        : "bg-sky-400/20 text-sky-300"
                    }`}
                  >
                    {severity}
                  </span>
                </article>
              ))}
            </div>
          </ShellCard>
        </div>

        {/* ── Community + Admin ── */}
        <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-3">
          <ShellCard id="community" className="lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Users size={20} /> {t.community}
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {demoPosts.map(({ title, place, likes }) => (
                <article
                  key={title}
                  className="group cursor-pointer rounded-2xl bg-white/6 p-4 transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <div className="mb-3 h-24 overflow-hidden rounded-xl bg-gradient-to-br from-sky-400/35 via-cyan-200/12 to-emerald-300/22">
                    <div className="h-full w-full" />
                  </div>
                  <p className="text-sm font-semibold leading-snug">{title}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-sky-100/50">
                    <MapPin size={12} className="shrink-0" /> {place}
                  </p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-rose-300">
                    <Heart size={14} fill="currentColor" /> {likes} likes
                  </p>
                </article>
              ))}
            </div>
          </ShellCard>

          <ShellCard id="admin">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Settings size={20} /> {t.admin}
            </h3>
            <div className="mb-4">
              <a
                href="/admin"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-skyglow/15 border border-skyglow/25 px-4 py-3 text-sm font-semibold text-skyglow transition hover:bg-skyglow/25"
              >
                Open Admin Panel →
              </a>
            </div>
            <div className="space-y-3">
              {operations.map(({ label, value, detail }) => (
                <div key={label} className="rounded-2xl bg-white/6 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{label}</p>
                    <span className="text-sm text-aurora font-medium">{value}</span>
                  </div>
                  <p className="mt-1 text-xs text-sky-100/55">{detail}</p>
                </div>
              ))}
            </div>
          </ShellCard>
        </div>

        {/* ── Footer ── */}
        <footer className="mx-auto mt-10 max-w-7xl border-t border-white/8 pt-6 pb-2 text-center text-xs text-sky-100/35">
          <p>© {new Date().getFullYear()} Zeeshu Weather Alert — Powered by OpenWeather · AQICN · Mapbox · Firebase · Supabase</p>
        </footer>
      </div>
    </main>
  );
}
