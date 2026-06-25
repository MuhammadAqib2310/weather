"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, Bell, CheckCircle2, CloudLightning, CloudRain, Droplets,
  Gauge, Globe, Heart, Loader2, MapPin, Moon, Navigation, Radar,
  Search, Settings, ShieldAlert, Sparkles, Star, Sun, Thermometer,
  TrendingUp, Users, Wind, X, Zap,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  fetchAqi, fetchWeather, searchCities,
  type CitySearchResult, type WeatherResponse,
} from "@/lib/api";
import { useWeatherStore } from "@/store/weather-store";

/* ── helpers ── */
function toF(c: number) { return Math.round(c * 9 / 5 + 32); }
function fmt(v: number, u: "C" | "F") { return u === "F" ? `${toF(v)}°F` : `${Math.round(v)}°C`; }

/* ── weather emoji map ── */
const WX: Record<string, string> = {
  "clear": "☀️", "mainly clear": "🌤️", "partly cloudy": "⛅", "overcast": "☁️",
  "fog": "🌫️", "drizzle": "🌦️", "rain": "🌧️", "snow": "❄️", "shower": "🌧️",
  "thunderstorm": "⛈️", "hail": "🌨️", "storm": "⛈️", "icy": "🌫️", "grains": "🌨️",
};
function wxEmoji(cond: string): string {
  const lc = cond.toLowerCase();
  for (const [k, v] of Object.entries(WX)) if (lc.includes(k)) return v;
  return "🌡️";
}

/* ── demo fallback ── */
const DEMO: WeatherResponse = {
  city: "Lahore", country: "PK",
  current: {
    temp: 31, condition: "Clear sky", feelsLike: 34, humidity: 58,
    wind: 14, pressure: 1010, visibility: 12000, uv: 6,
    sunrise: "05:12 AM", sunset: "07:08 PM", min: 26, max: 36,
  },
  hourly: Array.from({ length: 12 }, (_, i) => ({
    hour: i + 8, temp: 27 + ((i * 2) % 9), rain: 12 + ((i * 7) % 55),
    humidity: 50 + ((i * 4) % 28), wind: 8 + ((i * 3) % 16),
  })),
  daily: ["Today","Fri","Sat","Sun","Mon","Tue","Wed"].map((day, i) => ({
    day, high: 32 + (i % 5), low: 22 + (i % 4),
    condition: ["Clear sky","Partly cloudy","Rain","Thunderstorm","Clear sky","Overcast","Rain"][i],
    rain: [5, 22, 70, 85, 8, 35, 60][i],
  })),
};

/* ── world cities ── */
const CITIES = [
  { name: "Lahore",    flag: "🇵🇰" }, { name: "Karachi",   flag: "🇵🇰" },
  { name: "Islamabad", flag: "🇵🇰" }, { name: "Dubai",     flag: "🇦🇪" },
  { name: "London",    flag: "🇬🇧" }, { name: "New York",  flag: "🇺🇸" },
  { name: "Tokyo",     flag: "🇯🇵" }, { name: "Paris",     flag: "🇫🇷" },
  { name: "Istanbul",  flag: "🇹🇷" }, { name: "Sydney",    flag: "🇦🇺" },
  { name: "Riyadh",    flag: "🇸🇦" }, { name: "Mumbai",    flag: "🇮🇳" },
];

const NAV = ["Forecast", "AQI", "Alerts", "Community", "Admin"];

const L = {
  en: {
    title: "Zeeshu Weather Alert", sub: "Real-time weather for every city worldwide — powered by Open-Meteo.",
    search: "Search any city or country…", current: "Current Weather", forecast: "Hourly Forecast",
    week: "7-Day Outlook", alerts: "Severe Alerts", community: "Community", admin: "Operations",
    feelsLike: "Feels like", humidity: "Humidity", wind: "Wind", pressure: "Pressure",
    visibility: "Visibility", uv: "UV Index", sunset: "Sunset", minMax: "Min / Max",
  },
  ur: {
    title: "زیشو ویدر الرٹ", sub: "دنیا کے ہر شہر کے لیے ریئل ٹائم موسم۔",
    search: "شہر یا ملک تلاش کریں…", current: "موجودہ موسم", forecast: "گھنٹہ وار",
    week: "7 دن", alerts: "شدید الرٹس", community: "کمیونٹی", admin: "آپریشنز",
    feelsLike: "محسوس", humidity: "نمی", wind: "ہوا", pressure: "دباؤ",
    visibility: "مرئیت", uv: "UV", sunset: "غروب", minMax: "کم/زیادہ",
  },
};

/* ── Metric bar widths (0-100) for each stat ── */
function statBarWidth(label: string, value: string): number {
  const n = parseFloat(value);
  if (isNaN(n)) return 50;
  if (label.toLowerCase().includes("humid")) return Math.min(n, 100);
  if (label.toLowerCase().includes("uv")) return Math.min((n / 12) * 100, 100);
  if (label.toLowerCase().includes("wind")) return Math.min((n / 100) * 100, 100);
  if (label.toLowerCase().includes("pressure")) return Math.min(((n - 950) / 100) * 100, 100);
  if (label.toLowerCase().includes("vis")) return Math.min((n / 20) * 100, 100);
  return 55;
}

/* ── Card ── */
function Card({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`glass shine rounded-2xl p-5 ${className}`}>
      {children}
    </section>
  );
}

/* ── Stat card with progress bar ── */
function Stat({
  icon: Icon, label, value, color = "text-violet-400", barWidth,
}: {
  icon: React.ElementType; label: string; value: string;
  color?: string; barWidth?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  const bw = barWidth ?? statBarWidth(label, value);

  return (
    <div className="group rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 transition hover:-translate-y-1 hover:border-violet-400/25 hover:bg-white/[0.06]"
      style={{ borderColor: "rgba(139,92,246,0.12)" }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="grid size-9 place-items-center rounded-lg bg-white/[0.06]">
          <Icon className={color} size={18} />
        </div>
        <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
          <span className="status-dot" />Live
        </span>
      </div>
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 text-lg font-bold animate-[count-up_1.2s_ease-out_both]">{value}</p>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: mounted ? `${bw}%` : "0%", transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </div>
    </div>
  );
}

/* ── AQI Ring ── */
function AqiRing({ score, color }: { score: number; color: string }) {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 300, 1);
  const offset = circ * (1 - pct);

  return (
    <div className="aqi-ring-container">
      <svg className="aqi-ring" width="96" height="96" viewBox="0 0 96 96">
        <circle className="aqi-ring-bg" cx="48" cy="48" r={r} />
        <circle
          className="aqi-ring-fill"
          cx="48" cy="48" r={r}
          stroke={color}
          style={{ strokeDashoffset: offset, transition: "stroke-dashoffset 1.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="aqi-ring-score">
        <span className="text-2xl font-black text-white">{score || "—"}</span>
        <span className="text-[9px] text-white/40 uppercase tracking-wide">AQI</span>
      </div>
    </div>
  );
}

/* ── Live clock ── */
function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-xs tabular-nums text-white/50">{time}</span>;
}

/* ── Last updated counter ── */
function LastUpdated({ isLive }: { isLive: boolean }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    setSecs(0);
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [isLive]);
  if (!isLive) return null;
  const label = secs < 60 ? `${secs}s ago` : `${Math.floor(secs / 60)}m ago`;
  return <span className="text-[10px] text-white/35 tabular-nums">Updated {label}</span>;
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function Home() {
  const {
    city, setCity, theme, toggleTheme, language, toggleLanguage,
    tempUnit, toggleTempUnit, addFavorite, removeFavorite, isFavorite,
    addRecentSearch, recentSearches,
  } = useWeatherStore();

  const [query,    setQuery]    = useState(city);
  const [sugg,     setSugg]     = useState<CitySearchResult[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const [weather,  setWeather]  = useState<WeatherResponse>(DEMO);
  const [aqi,      setAqi]      = useState({
    score: 0, category: "—", pm25: 0, pm10: 0, co: 0, no2: 0, o3: 0,
    recommendation: "Loading air quality data…",
  });
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState("Click a city or search to load live weather");
  const [isLive,   setIsLive]   = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = L[language];

  const onQueryChange = useCallback((val: string) => {
    setQuery(val);
    if (debRef.current) clearTimeout(debRef.current);
    if (val.trim().length < 2) { setSugg([]); setShowSugg(false); return; }
    debRef.current = setTimeout(async () => {
      const r = await searchCities(val);
      setSugg(r); setShowSugg(r.length > 0);
    }, 300);
  }, []);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSugg(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function load(q: string) {
    if (!q.trim()) return;
    setLoading(true); setShowSugg(false);
    setStatus("Fetching live weather…");
    try {
      const [w, a] = await Promise.all([fetchWeather(q), fetchAqi(q)]);
      setWeather({ ...DEMO, ...w, hourly: w.hourly ?? DEMO.hourly, daily: w.daily ?? DEMO.daily });
      setAqi(a as typeof aqi);
      const name = w.city || q;
      setCity(name); setQuery(name); addRecentSearch(name);
      const live = w.provider?.live ?? false;
      setIsLive(live);
      setStatus(live ? "✓ Live — Open-Meteo · updated just now" : "Demo data — weather service unavailable");
    } catch {
      setWeather({ ...DEMO, city: q });
      setIsLive(false);
      setStatus("Could not fetch weather — showing demo data");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(city); }, []); // eslint-disable-line

  const hourly = useMemo(() =>
    (weather.hourly ?? DEMO.hourly ?? []).map(h => ({
      ...h,
      label: `${String(h.hour).padStart(2, "0")}:00`,
      tempF: toF(h.temp),
    })), [weather]);

  const daily = weather.daily ?? DEMO.daily ?? [];
  const c = weather.current;
  const fav = isFavorite(weather.city || city);
  const T = (v: number) => fmt(v, tempUnit);

  /* AQI ring color */
  const aqiColor = aqi.score <= 50 ? "#10b981" : aqi.score <= 100 ? "#f59e0b"
    : aqi.score <= 150 ? "#f97316" : "#ef4444";

  return (
    <main className={theme === "light" ? "light min-h-screen" : "min-h-screen"}>
      {/* Aurora animated background */}
      <div className="aurora-bg" />
      {/* Floating particles */}
      <div className="particles" aria-hidden="true">
        {[...Array(8)].map((_, i) => <div key={i} className="particle" />)}
      </div>

      <div className="premium-shell relative z-10 min-h-screen overflow-x-hidden px-4 pb-28 pt-4 text-white sm:px-6 lg:px-8 lg:pb-6">

        {/* ── NAVBAR ── */}
        <nav className="sticky top-3 z-40 mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border border-violet-500/15 bg-[#0a061e]/80 px-5 py-3 shadow-xl shadow-black/30 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="logo-glow grid size-9 place-items-center rounded-xl shadow-glow"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)" }}>
              <CloudLightning size={18} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] uppercase tracking-[.2em] text-white/30">Global Platform</p>
              <h1 className="text-sm font-bold text-white/90">{t.title}</h1>
            </div>
          </div>
          <div className="hidden items-center gap-0.5 lg:flex">
            {NAV.map(f => (
              <a key={f} href={`#${f.toLowerCase()}`}
                className="rounded-xl px-3 py-2 text-sm text-white/50 transition hover:bg-violet-500/10 hover:text-white">
                {f}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <LiveClock />
            <button onClick={toggleTempUnit}
              className="rounded-xl border border-violet-500/20 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 transition hover:bg-violet-500/15 hover:text-white">
              °{tempUnit === "C" ? "F" : "C"}
            </button>
            <button onClick={toggleLanguage}
              className="rounded-xl border border-violet-500/20 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-violet-500/15 hover:text-white">
              {language === "en" ? "اردو" : "EN"}
            </button>
            <button onClick={toggleTheme}
              className="grid size-8 place-items-center rounded-xl border border-violet-500/20 bg-white/5 transition hover:bg-violet-500/15">
              <Sun size={15} className="text-white/60" />
            </button>
            <a href="/auth"
              className="hidden rounded-xl px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-85 sm:block"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              Sign in
            </a>
          </div>
        </nav>

        {/* ── MOBILE DOCK ── */}
        <div className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 gap-1 rounded-2xl border border-violet-500/12 bg-[#050810]/92 p-1.5 shadow-2xl backdrop-blur-2xl lg:hidden mobile-dock">
          {NAV.map(f => (
            <a key={f} href={`#${f.toLowerCase()}`}
              className="rounded-xl py-2.5 text-center text-[10px] text-white/50 transition hover:bg-violet-500/12 hover:text-white">
              {f}
            </a>
          ))}
        </div>

        {/* ── HERO ── */}
        <div className="mx-auto mt-5 grid max-w-7xl gap-4 xl:grid-cols-[1.55fr_.45fr]">

          {/* Search / hero card */}
          <Card className="relative overflow-hidden !p-7 sm:!p-9"
            style={{ borderColor: "rgba(99,102,241,0.18)", background: "rgba(10,6,30,0.85)" }}>
            <div className="absolute -right-8 top-6 hidden animate-float opacity-[0.05] md:block">
              <CloudRain size={260} className="text-violet-400" />
            </div>
            <div className="relative z-10">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-violet-300"
                style={{ borderColor: "rgba(139,92,246,0.25)", background: "rgba(139,92,246,0.08)" }}>
                <Sparkles size={12} /> Worldwide · 200,000+ Cities · Free Live Data
              </span>

              {/* Animated gradient hero title */}
              <h2 className="gradient-text text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                {t.title}
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/45">{t.sub}</p>

              {/* Search box */}
              <div ref={searchRef} className="relative mt-6 max-w-xl">
                <form
                  onSubmit={e => { e.preventDefault(); void load(query); }}
                  className="flex items-center gap-2 rounded-xl border bg-white/[0.04] p-1.5 transition focus-within:bg-white/[0.07]"
                  style={{ borderColor: "rgba(139,92,246,0.22)" }}>
                  <Search className="ml-2 shrink-0 text-violet-400/60" size={17} />
                  <input
                    value={query} onChange={e => onQueryChange(e.target.value)}
                    onFocus={() => sugg.length > 0 && setShowSugg(true)}
                    placeholder={t.search} aria-label="Search city"
                    className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                  />
                  {query && (
                    <button type="button" onClick={() => { setQuery(""); setSugg([]); }}
                      className="shrink-0 text-white/25 hover:text-white/60">
                      <X size={14} />
                    </button>
                  )}
                  <button type="submit" disabled={loading}
                    className="shrink-0 rounded-lg px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-85 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : "Search"}
                  </button>
                </form>

                {/* Animated dropdown */}
                {showSugg && (
                  <div className="dropdown-enter absolute top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border bg-[#0a061e]/97 shadow-2xl backdrop-blur-2xl"
                    style={{ borderColor: "rgba(139,92,246,0.22)" }}>
                    {sugg.map((s, i) => (
                      <button key={i}
                        onClick={() => { setQuery(s.displayName); setShowSugg(false); void load(s.name); }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-violet-500/10">
                        <Globe size={13} className="shrink-0 text-violet-400" />
                        <div>
                          <p className="font-medium text-white/90">{s.name}</p>
                          <p className="text-[11px] text-white/40">{[s.state, s.country].filter(Boolean).join(", ")}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {recentSearches.slice(0, 5).map(r => (
                    <button key={r} onClick={() => { setQuery(r); void load(r); }}
                      className="city-chip">{r}</button>
                  ))}
                </div>
              )}

              {/* World city chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {CITIES.map(({ name, flag }) => (
                  <button key={name} onClick={() => { setQuery(name); void load(name); }}
                    className="city-chip">
                    {flag} {name}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Current weather card */}
          <Card className="flex flex-col" style={{ borderColor: "rgba(99,102,241,0.18)", background: "rgba(8,5,20,0.88)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/35">{t.current}</p>
                <h3 className="mt-1 flex items-center gap-1.5 font-bold text-white/90">
                  <MapPin size={15} className="text-violet-400" />
                  {weather.city || city}
                  {/* Live badge */}
                  {isLive && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] text-emerald-300"
                      style={{ border: "1px solid rgba(16,185,129,0.2)" }}>
                      <span className="live-pulse" />LIVE
                    </span>
                  )}
                  {weather.country && (
                    <span className="text-xs font-normal text-white/30">, {weather.country}</span>
                  )}
                </h3>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => fav ? removeFavorite(weather.city || city) : addFavorite({ city: weather.city || city })}
                  className={`grid size-8 place-items-center rounded-xl border transition ${fav ? "border-amber-400/30 bg-amber-400/10 text-amber-300" : "border-white/10 text-white/30 hover:text-amber-300"}`}>
                  <Star size={13} fill={fav ? "currentColor" : "none"} />
                </button>
                <Bell size={16} className="mt-1.5 text-amber-300" />
              </div>
            </div>

            <div className="mt-5 flex-1">
              {/* Bouncing weather emoji */}
              <div className="text-6xl leading-none" style={{ animation: "bounce-soft 2s ease-in-out infinite" }}>
                {wxEmoji(c.condition)}
              </div>
              <div className="mt-3">
                {/* Large gradient temperature */}
                <span className="gradient-text text-6xl font-black">{T(c.temp)}</span>
              </div>
              <p className="mt-1 capitalize text-white/55">{c.condition}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-white/35">High</p><p className="font-bold text-red-300">{T(c.max)}</p>
              </div>
              <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-white/35">Low</p><p className="font-bold text-blue-300">{T(c.min)}</p>
              </div>
              <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-white/35">Sunrise</p><p className="font-medium">{c.sunrise}</p>
              </div>
              <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-white/35">Sunset</p><p className="font-medium">{c.sunset}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border px-3 py-2" style={{ borderColor: "rgba(139,92,246,0.12)", background: "rgba(139,92,246,0.04)" }}>
              <p className="flex items-center justify-between gap-2 text-xs text-white/40">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={12} className={isLive ? "text-emerald-400" : "text-amber-400"} />
                  {status}
                </span>
                <LastUpdated isLive={isLive} />
              </p>
            </div>
          </Card>
        </div>

        {/* ── STATS ── */}
        <div className="mx-auto mt-4 max-w-7xl grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <div className="col-span-2">
            <Stat icon={Thermometer} label={t.feelsLike}  value={T(c.feelsLike)}                       color="text-orange-300" />
          </div>
          <div className="col-span-2">
            <Stat icon={Droplets}   label={t.humidity}    value={`${c.humidity}%`}                     color="text-cyan-300" />
          </div>
          <div className="col-span-2">
            <Stat icon={Wind}       label={t.wind}        value={`${c.wind} km/h`}                     color="text-teal-300" />
          </div>
          <div className="col-span-2">
            <Stat icon={Gauge}      label={t.pressure}    value={`${c.pressure} hPa`}                  color="text-violet-300" />
          </div>
          <div className="col-span-2">
            <Stat icon={Navigation} label={t.visibility}  value={`${Math.round((c.visibility||0)/100)/10} km`} color="text-indigo-300" />
          </div>
          <div className="col-span-2">
            <Stat icon={Sun}        label={t.uv}          value={c.uv ? `${c.uv}` : "—"}              color="text-yellow-300" barWidth={c.uv ? (c.uv / 12) * 100 : 0} />
          </div>
          <div className="col-span-2">
            <Stat icon={Moon}       label={t.sunset}      value={c.sunset}                             color="text-indigo-300" barWidth={60} />
          </div>
          <div className="col-span-2">
            <Stat icon={TrendingUp} label={t.minMax}      value={`${T(c.min)} / ${T(c.max)}`}         color="text-rose-300" barWidth={55} />
          </div>
        </div>

        {/* ── CHART + 7 DAY ── */}
        <div className="mx-auto mt-4 grid max-w-7xl gap-4 lg:grid-cols-[1fr_.82fr]">
          <Card id="forecast">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-white/90">{t.forecast}</h3>
              <Activity size={17} className="text-violet-400" />
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tg" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="hg" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(139,92,246,.07)" vertical={false} />
                  <XAxis dataKey="label" stroke="rgba(255,255,255,.2)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="rgba(255,255,255,.2)" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,6,30,0.95)", border: "1px solid rgba(139,92,246,0.3)",
                      borderRadius: 12, fontSize: 12, backdropFilter: "blur(20px)",
                    }}
                  />
                  <Area isAnimationActive animationDuration={1200} animationEasing="ease-out"
                    type="monotone" dataKey={tempUnit === "F" ? "tempF" : "temp"}
                    stroke="#8b5cf6" fill="url(#tg)" strokeWidth={2} name={`Temp °${tempUnit}`} />
                  <Area isAnimationActive animationDuration={1500} animationEasing="ease-out"
                    type="monotone" dataKey="humidity"
                    stroke="#06b6d4" fill="url(#hg)" strokeWidth={1.5} name="Humidity %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 7-day forecast with staggered animation */}
          <Card>
            <h3 className="mb-4 font-bold text-white/90">{t.week}</h3>
            <div className="space-y-1.5">
              {daily.map((d, i) => (
                <div key={d.day}
                  className="stagger-item grid grid-cols-[.55fr_1fr_.38fr_.38fr_.4fr] items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition hover:-translate-y-0.5 hover:bg-violet-500/8"
                  style={{
                    background: "rgba(139,92,246,0.04)",
                    border: "1px solid rgba(139,92,246,0.08)",
                    animationDelay: `${i * 55}ms`,
                  }}>
                  <span className="text-xs font-bold text-white/80">{d.day}</span>
                  <span className="flex items-center gap-1.5 truncate text-xs text-white/50">
                    {wxEmoji(d.condition)} <span className="truncate">{d.condition}</span>
                  </span>
                  <span className="text-right text-xs font-semibold text-red-300">{T(d.high)}</span>
                  <span className="text-right text-xs text-blue-300">{T(d.low)}</span>
                  <span className="text-right text-xs text-cyan-400">{d.rain}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── RADAR + LIGHTNING ── */}
        <div className="mx-auto mt-4 grid max-w-7xl gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-white/90">Radar & Storm Tracking</h3>
              <Radar size={17} className="text-violet-400" />
            </div>
            <div className="relative min-h-[320px] overflow-hidden rounded-xl border"
              style={{
                borderColor: "rgba(139,92,246,0.12)",
                background: "radial-gradient(circle at 35% 45%,rgba(99,102,241,.25),transparent 16%),radial-gradient(circle at 68% 55%,rgba(6,182,212,.18),transparent 14%),linear-gradient(135deg,#0a061e,#050810)",
              }}>
              <div className="absolute inset-0"
                style={{
                  backgroundImage: "linear-gradient(rgba(139,92,246,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.03) 1px,transparent 1px)",
                  backgroundSize: "42px 42px",
                }} />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {["Rain","Clouds","Temp","Wind","Satellite"].map(x => (
                  <button key={x}
                    className="rounded-lg border bg-black/50 px-3 py-1.5 text-xs backdrop-blur transition hover:bg-violet-500/20"
                    style={{ borderColor: "rgba(139,92,246,0.2)" }}>
                    {x}
                  </button>
                ))}
              </div>
              <div className="absolute bottom-4 left-4 max-w-xs rounded-xl border bg-[#050810]/70 p-4 backdrop-blur"
                style={{ borderColor: "rgba(139,92,246,0.15)" }}>
                <p className="text-sm font-semibold">OpenWeather / Mapbox ready</p>
                <p className="mt-1 text-xs text-white/40">Add MAPBOX_TOKEN to enable interactive live radar.</p>
              </div>
            </div>
          </Card>
          <Card id="lightning">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-white/90">
              <Zap size={17} className="text-amber-300" />Lightning
            </h3>
            <div className="space-y-2">
              {[
                { l: "Strike rate", v: "21 / 10 min" }, { l: "Heatmap", v: "High" },
                { l: "Nearest",     v: "18.4 km" },     { l: "Status", v: "WS-ready" },
              ].map(({ l, v }) => (
                <div key={l} className="rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-xs text-white/35">{l}</p>
                  <p className="mt-0.5 text-sm font-semibold text-white/85">{v}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── AQI + ALERTS ── */}
        <div className="mx-auto mt-4 grid max-w-7xl gap-4 lg:grid-cols-[.65fr_1.35fr]">
          <Card id="aqi">
            <h3 className="mb-4 font-bold text-white/90">Air Quality Index</h3>
            <div className="flex items-center gap-4">
              <AqiRing score={aqi.score} color={aqiColor} />
              <div>
                <p className="text-lg font-bold">{aqi.category}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/40">{aqi.recommendation}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              {[
                ["PM2.5", aqi.pm25], ["PM10", aqi.pm10], ["O₃", aqi.o3],
                ["CO",    aqi.co],   ["NO₂", aqi.no2],  ["AQI", aqi.score],
              ].map(([l, v]) => (
                <div key={String(l)} className="rounded-xl py-2.5"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-white/30">{l}</p>
                  <p className="font-bold">{v}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card id="alerts">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-white/90">
              <ShieldAlert size={17} className="text-amber-300" />{t.alerts}
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { title: "Thunderstorm Warning", body: "High-energy cell approaching the region.", s: "critical" },
                { title: "Flood Watch",          body: "Low lying areas may accumulate water.",    s: "warning" },
                { title: "Heat Advisory",        body: "Avoid prolonged sun exposure today.",      s: "watch" },
              ].map(({ title, body, s }) => (
                <article key={title}
                  className={`rounded-xl border p-4 transition hover:-translate-y-0.5 ${s === "critical" ? "border-red-400/20 bg-red-500/6" : s === "warning" ? "border-amber-400/20 bg-amber-500/6" : "border-indigo-400/20 bg-indigo-500/5"}`}>
                  <p className={`text-sm font-bold ${s === "critical" ? "text-red-300" : s === "warning" ? "text-amber-300" : "text-indigo-300"}`}>{title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">{body}</p>
                  <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${s === "critical" ? "bg-red-500/15 text-red-300" : s === "warning" ? "bg-amber-500/15 text-amber-300" : "bg-indigo-500/12 text-indigo-300"}`}>{s}</span>
                </article>
              ))}
            </div>
          </Card>
        </div>

        {/* ── COMMUNITY + ADMIN ── */}
        <div className="mx-auto mt-4 grid max-w-7xl gap-4 lg:grid-cols-3">
          <Card id="community" className="lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-white/90">
              <Users size={17} />{t.community}
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { t: "Rain bands reported near DHA", p: "Lahore",  l: 42 },
                { t: "Dusty wind and low visibility", p: "Multan",  l: 31 },
                { t: "Clear sunset after clouds",    p: "Karachi", l: 55 },
              ].map(({ t: title, p, l }) => (
                <article key={title}
                  className="group cursor-pointer rounded-xl p-4 transition hover:-translate-y-0.5"
                  style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.08)" }}>
                  <div className="mb-3 h-20 rounded-lg"
                    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1), rgba(6,182,212,0.15))" }} />
                  <p className="text-sm font-semibold leading-snug text-white/85">{title}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-white/30">
                    <MapPin size={10} />{p}
                  </p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-rose-400">
                    <Heart size={12} fill="currentColor" />{l} likes
                  </p>
                </article>
              ))}
            </div>
          </Card>

          <Card id="admin">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-white/90">
              <Settings size={17} />{t.admin}
            </h3>
            <a href="/admin"
              className="mb-4 flex items-center justify-center rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-85"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))", border: "1px solid rgba(139,92,246,0.25)" }}>
              Open Admin Panel →
            </a>
            <div className="space-y-2">
              {[
                { l: "Provider", v: "Live",  d: "Open-Meteo · free worldwide" },
                { l: "Alerts",   v: "Ready", d: "FCM push enabled" },
                { l: "Refresh",  v: "Live",  d: "Real-time data" },
                { l: "Security", v: "RLS",   d: "Supabase policies" },
              ].map(({ l, v, d }) => (
                <div key={l} className="rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="flex justify-between">
                    <p className="text-sm font-semibold text-white/80">{l}</p>
                    <span className="text-xs font-bold text-emerald-400">{v}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/30">{d}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── FOOTER ── */}
        <footer className="mx-auto mt-8 max-w-7xl border-t pb-3 pt-5 text-center text-xs text-white/20"
          style={{ borderColor: "rgba(139,92,246,0.1)" }}>
          <p>© {new Date().getFullYear()} Zeeshu Weather Alert — Powered by Open-Meteo · AQICN · Firebase · Supabase</p>
          <p className="mt-1">Worldwide coverage · 200,000+ cities · Real-time live data · No API key required</p>
        </footer>
      </div>
    </main>
  );
}
