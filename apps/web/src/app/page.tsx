"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, Bell, CheckCircle2, CloudLightning, CloudRain, Droplets,
  Gauge, Globe, Heart, Loader2, MapPin, Moon, Navigation, Radar,
  Search, Settings, ShieldAlert, Sparkles, Star, Sun, Thermometer,
  TrendingUp, Users, Wind, X, Zap,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchAqi, fetchWeather, searchCities, type CitySearchResult, type WeatherResponse } from "@/lib/api";
import { useWeatherStore } from "@/store/weather-store";

/* ─── Helper ─── */
function toF(c: number) { return Math.round(c * 9 / 5 + 32); }
function fmt(val: number, unit: "C" | "F") { return unit === "F" ? `${toF(val)}°F` : `${Math.round(val)}°C`; }

/* ─── Demo fallback ─── */
const demoWeather: WeatherResponse = {
  city: "Lahore", country: "PK",
  current: { temp: 31, condition: "Thunderstorms", feelsLike: 34, humidity: 62, wind: 18, pressure: 1008, visibility: 9600, uv: 7, sunrise: "05:02 AM", sunset: "07:12 PM", min: 27, max: 36 },
  hourly: Array.from({ length: 12 }, (_, i) => ({ hour: i + 8, temp: 27 + ((i * 2) % 9), rain: 18 + ((i * 9) % 70), humidity: 55 + ((i * 4) % 30), wind: 9 + ((i * 3) % 18) })),
  daily: ["Today","Fri","Sat","Sun","Mon","Tue","Wed"].map((day, i) => ({ day, high: 32 + (i % 5), low: 23 + (i % 4), condition: i % 2 ? "Partly cloudy" : "Storm risk", rain: i % 2 ? 24 : 68 })),
};

/* ─── World city chips by region ─── */
const worldCities = [
  { name: "Lahore", flag: "🇵🇰" }, { name: "Karachi", flag: "🇵🇰" }, { name: "Islamabad", flag: "🇵🇰" },
  { name: "Dubai", flag: "🇦🇪" }, { name: "London", flag: "🇬🇧" }, { name: "New York", flag: "🇺🇸" },
  { name: "Tokyo", flag: "🇯🇵" }, { name: "Paris", flag: "🇫🇷" }, { name: "Istanbul", flag: "🇹🇷" },
  { name: "Riyadh", flag: "🇸🇦" }, { name: "Mumbai", flag: "🇮🇳" }, { name: "Sydney", flag: "🇦🇺" },
];

/* ─── Weather icon map ─── */
const conditionIcon: Record<string, string> = {
  thunderstorm: "⛈️", drizzle: "🌦️", rain: "🌧️", snow: "❄️",
  mist: "🌫️", fog: "🌫️", haze: "🌫️", smoke: "🌫️", dust: "🌪️",
  tornado: "🌪️", clear: "☀️", clouds: "☁️", "partly cloudy": "⛅",
  "storm risk": "⛈️",
};
function weatherIcon(condition: string): string {
  const lc = condition.toLowerCase();
  for (const [key, emoji] of Object.entries(conditionIcon)) {
    if (lc.includes(key)) return emoji;
  }
  return "🌡️";
}

const navFeatures = ["Forecast", "AQI", "Alerts", "Community", "Admin"];
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

/* ─── Labels ─── */
const labels = {
  en: { title: "Zeeshu Weather Alert", subtitle: "Real-time weather, radar, AQI & severe alerts for every city worldwide.", search: "Search any city or country…", current: "Current Weather", forecast: "Hourly Forecast", week: "7-Day Outlook", alerts: "Severe Weather Alerts", community: "Community Reports", admin: "Operations", feelsLike: "Feels like", humidity: "Humidity", wind: "Wind", pressure: "Pressure", visibility: "Visibility", uv: "UV Index", sunset: "Sunset", minMax: "Min / Max" },
  ur: { title: "زیشو ویدر الرٹ", subtitle: "دنیا کے ہر شہر کے لیے ریئل ٹائم موسم، ریڈار، AQI اور شدید الرٹس۔", search: "کوئی بھی شہر یا ملک تلاش کریں…", current: "موجودہ موسم", forecast: "گھنٹہ وار پیشگوئی", week: "7 دن کا جائزہ", alerts: "شدید موسم الرٹس", community: "کمیونٹی رپورٹس", admin: "آپریشنز", feelsLike: "محسوس درجہ حرارت", humidity: "نمی", wind: "ہوا", pressure: "دباؤ", visibility: "مرئیت", uv: "UV", sunset: "غروب", minMax: "کم / زیادہ" },
};

/* ─── ShellCard ─── */
function ShellCard({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`glass shine rounded-3xl p-5 ${className}`}>{children}</section>;
}

/* ─── Metric card ─── */
function Metric({ icon: Icon, label, value, tone = "text-sky-100" }: { icon: React.ElementType; label: string; value: string; tone?: string }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/6 p-4 transition hover:-translate-y-1 hover:bg-white/10">
      <div className="mb-3 flex items-center justify-between">
        <div className="grid size-10 place-items-center rounded-xl bg-white/10"><Icon className={tone} size={20} /></div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-300/10 px-2 py-1 text-xs text-emerald-200"><span className="status-dot" />Live</span>
      </div>
      <p className="text-xs text-sky-100/55">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500 group-hover:w-5/6" />
      </div>
    </div>
  );
}

/* ─── Skeleton ─── */
function Skeleton() {
  return <div className="glass rounded-3xl p-5"><div className="skeleton mb-3 h-6 w-1/3" /><div className="skeleton mb-2 h-16 w-full" /><div className="skeleton h-4 w-2/3" /></div>;
}

/* ─── Main page ─── */
export default function Home() {
  const { city, setCity, theme, toggleTheme, language, toggleLanguage, tempUnit, toggleTempUnit, addFavorite, removeFavorite, isFavorite, addRecentSearch, recentSearches } = useWeatherStore();
  const [query, setQuery] = useState(city);
  const [suggestions, setSuggestions] = useState<CitySearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weather, setWeather] = useState<WeatherResponse>(demoWeather);
  const [aqi, setAqi] = useState({ score: 86, category: "Moderate", pm25: 31, pm10: 74, co: 0.8, no2: 24, o3: 42, recommendation: "Sensitive groups should reduce prolonged outdoor activity." });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("Demo data — add OpenWeather API key for live data");
  const [isLive, setIsLive] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = labels[language];

  // Autocomplete search
  const handleQueryChange = useCallback((val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      const results = await searchCities(val);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 350);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handler(e: MouseEvent) { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function loadWeather(nextCity: string) {
    if (!nextCity.trim()) return;
    setIsLoading(true); setShowSuggestions(false);
    setStatus("Syncing live weather providers…");
    try {
      const [weatherData, aqiData] = await Promise.all([fetchWeather(nextCity), fetchAqi(nextCity)]);
      setWeather({ ...demoWeather, ...weatherData, hourly: weatherData.hourly ?? demoWeather.hourly, daily: weatherData.daily ?? demoWeather.daily });
      setAqi(aqiData as typeof aqi);
      const resolved = weatherData.city || nextCity;
      setCity(resolved); setQuery(resolved);
      addRecentSearch(resolved);
      const live = weatherData.provider?.live ?? false;
      setIsLive(live);
      setStatus(live ? `Live data — ${weatherData.provider?.source ?? "provider"}` : "Demo fallback — add OPENWEATHER_API_KEY for live data");
    } catch {
      setWeather({ ...demoWeather, city: nextCity });
      setIsLive(false);
      setStatus("API unavailable — showing demo data");
    } finally { setIsLoading(false); }
  }

  useEffect(() => { void loadWeather(city); }, []); // eslint-disable-line

  const hourly = useMemo(() => (weather.hourly ?? demoWeather.hourly ?? []).map((h) => ({ ...h, label: `${String(h.hour).padStart(2, "0")}:00`, tempF: toF(h.temp) })), [weather]);
  const daily = weather.daily ?? demoWeather.daily ?? [];
  const c = weather.current;
  const cityFavorited = isFavorite(weather.city || city);
  const visKm = `${Math.round((c.visibility || 0) / 100) / 10} km`;

  function pickSuggestion(s: CitySearchResult) {
    setQuery(s.displayName);
    setShowSuggestions(false);
    void loadWeather(s.name + (s.country ? `, ${s.country}` : ""));
  }

  const tempVal = (v: number) => fmt(v, tempUnit);

  return (
    <main className={theme === "light" ? "light min-h-screen" : "min-h-screen"}>
      <div className="premium-shell min-h-screen overflow-x-hidden bg-[radial-gradient(ellipse_at_10%_0%,rgba(139,92,246,.22),transparent_40%),radial-gradient(ellipse_at_90%_10%,rgba(6,182,212,.18),transparent_38%),linear-gradient(160deg,#0a0a1a_0%,#0f0728_40%,#050d1a_100%)] px-4 pb-28 pt-5 text-white sm:px-6 lg:px-8 lg:pb-8">

        {/* NAV */}
        <nav className="sticky top-3 z-40 mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0a0a1a]/80 px-4 py-3 shadow-2xl backdrop-blur-2xl">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg"><CloudLightning size={20} /></div>
            <div className="min-w-0 hidden sm:block"><p className="text-xs uppercase tracking-widest text-white/40">Global Platform</p><h1 className="truncate text-sm font-bold">{t.title}</h1></div>
          </div>
          <div className="hidden items-center gap-1 lg:flex">
            {navFeatures.map((f) => <a key={f} href={`#${f.toLowerCase()}`} className="rounded-xl px-3 py-2 text-sm text-white/60 transition hover:bg-white/8 hover:text-white">{f}</a>)}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTempUnit} className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs font-bold transition hover:bg-white/12">°{tempUnit === "C" ? "F" : "C"}</button>
            <button onClick={toggleLanguage} className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-xs transition hover:bg-white/12">{language === "en" ? "اردو" : "EN"}</button>
            <button onClick={toggleTheme} className="grid size-9 place-items-center rounded-xl border border-white/12 bg-white/6 transition hover:bg-white/12"><Sun size={16} /></button>
            <a href="/auth" className="hidden rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-xs font-bold transition hover:opacity-90 sm:block">Sign in</a>
          </div>
        </nav>

        {/* MOBILE DOCK */}
        <div className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 gap-1 rounded-2xl border border-white/10 bg-[#0a0a1a]/92 p-1.5 shadow-2xl backdrop-blur-2xl lg:hidden mobile-dock">
          {navFeatures.map((f) => <a key={f} href={`#${f.toLowerCase()}`} className="rounded-xl px-1 py-2.5 text-center text-[10px] text-white/60 transition hover:bg-white/10 hover:text-white">{f}</a>)}
        </div>

        {/* HERO */}
        <div className="mx-auto mt-6 grid max-w-7xl gap-5 xl:grid-cols-[1.5fr_.5fr]">
          <ShellCard className="relative overflow-hidden !bg-gradient-to-br from-[#13062e]/90 to-[#060d1f]/80 p-7 sm:p-9">
            <div className="absolute -right-6 -top-4 hidden animate-float opacity-10 md:block"><CloudRain size={260} className="text-violet-400" /></div>
            <div className="relative z-10">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-300"><Sparkles size={13} /> Worldwide Coverage · 200,000+ Cities</span>
              <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">{t.title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/60">{t.subtitle}</p>

              {/* SEARCH with autocomplete */}
              <div ref={searchRef} className="relative mt-6 max-w-2xl">
                <form onSubmit={(e) => { e.preventDefault(); void loadWeather(query); }} className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/6 p-2 transition focus-within:border-violet-500/50 focus-within:bg-white/10">
                  <Search className="ml-2 shrink-0 text-white/40" size={18} />
                  <input value={query} onChange={(e) => handleQueryChange(e.target.value)} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} placeholder={t.search} aria-label="Search city" className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-white/35" />
                  {query && <button type="button" onClick={() => { setQuery(""); setSuggestions([]); }} className="shrink-0 text-white/30 hover:text-white/70"><X size={15} /></button>}
                  <button type="submit" disabled={isLoading} className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2.5 text-xs font-bold transition hover:opacity-90 disabled:opacity-50">{isLoading ? <Loader2 size={15} className="animate-spin" /> : "Search"}</button>
                </form>

                {/* Autocomplete dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0f0a2a]/95 shadow-2xl backdrop-blur-2xl">
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => pickSuggestion(s)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/8">
                        <Globe size={14} className="shrink-0 text-cyan-400" />
                        <div><p className="font-medium">{s.name}</p><p className="text-xs text-white/45">{[s.state, s.country].filter(Boolean).join(", ")}</p></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {recentSearches.slice(0, 6).map((r) => (
                    <button key={r} onClick={() => { setQuery(r); void loadWeather(r); }} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white">{r}</button>
                  ))}
                </div>
              )}

              {/* World city chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {worldCities.map(({ name, flag }) => (
                  <button key={name} onClick={() => { setQuery(name); void loadWeather(name); }} className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-white/55 transition hover:bg-white/10 hover:text-white">
                    {flag} {name}
                  </button>
                ))}
              </div>
            </div>
          </ShellCard>

          {/* CURRENT WEATHER */}
          <ShellCard className="!bg-gradient-to-br from-[#0d0a2a]/90 to-[#060d20]/80">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/50">{t.current}</p>
                <h3 className="mt-1 flex items-center gap-1.5 text-lg font-bold"><MapPin size={16} className="text-cyan-400" />{weather.city || city}{weather.country && <span className="text-xs text-white/40">, {weather.country}</span>}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => cityFavorited ? removeFavorite(weather.city || city) : addFavorite({ city: weather.city || city })} className={`grid size-8 place-items-center rounded-xl border transition ${cityFavorited ? "border-amber-400/40 bg-amber-400/15 text-amber-300" : "border-white/12 text-white/40 hover:text-amber-300"}`}>
                  <Star size={14} fill={cityFavorited ? "currentColor" : "none"} />
                </button>
                <Bell size={18} className="text-amber-300 mt-1" />
              </div>
            </div>
            <div className="mt-6">
              <div className="text-7xl">{weatherIcon(c.condition)}</div>
              <p className="mt-2 text-6xl font-black">{tempVal(c.temp)}</p>
              <p className="mt-1 capitalize text-lg text-white/65">{c.condition}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-white/6 p-2.5"><p className="text-white/45">High</p><p className="font-bold">{tempVal(c.max)}</p></div>
              <div className="rounded-xl bg-white/6 p-2.5"><p className="text-white/45">Low</p><p className="font-bold">{tempVal(c.min)}</p></div>
            </div>
            <div className="mt-3 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
              <p className="flex items-center gap-2 text-xs text-white/55">
                <CheckCircle2 size={13} className={isLive ? "text-emerald-400" : "text-amber-400"} />{status}
              </p>
            </div>
          </ShellCard>
        </div>

        {/* METRICS */}
        <div className="mx-auto mt-5 max-w-7xl grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
          {isLoading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="col-span-2"><Skeleton /></div>) : <>
            <div className="col-span-2"><Metric icon={Thermometer} label={t.feelsLike} value={tempVal(c.feelsLike)} tone="text-amber-300" /></div>
            <div className="col-span-2"><Metric icon={Droplets} label={t.humidity} value={`${c.humidity}%`} tone="text-cyan-400" /></div>
            <div className="col-span-2"><Metric icon={Wind} label={t.wind} value={`${c.wind} km/h`} tone="text-violet-300" /></div>
            <div className="col-span-2"><Metric icon={Gauge} label={t.pressure} value={`${c.pressure} hPa`} tone="text-pink-300" /></div>
            <div className="col-span-2"><Metric icon={Navigation} label={t.visibility} value={visKm} tone="text-sky-300" /></div>
            <div className="col-span-2"><Metric icon={Sun} label={t.uv} value={c.uv ? `${c.uv} — High` : "Live only"} tone="text-yellow-300" /></div>
            <div className="col-span-2"><Metric icon={Moon} label={t.sunset} value={String(c.sunset).slice(0, 8)} tone="text-indigo-300" /></div>
            <div className="col-span-2"><Metric icon={TrendingUp} label={t.minMax} value={`${tempVal(c.min)} / ${tempVal(c.max)}`} tone="text-emerald-300" /></div>
          </>}
        </div>

        {/* HOURLY CHART + 7 DAY */}
        <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-[1fr_.85fr]">
          <ShellCard id="forecast">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-bold">{t.forecast}</h3><Activity className="text-cyan-400" size={18} /></div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourly}>
                  <defs>
                    <linearGradient id="tg" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.6} /><stop offset="95%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient>
                    <linearGradient id="hg" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                  <XAxis dataKey="label" stroke="rgba(255,255,255,.3)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="rgba(255,255,255,.3)" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#0f0728", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey={tempUnit === "F" ? "tempF" : "temp"} stroke="#a78bfa" fill="url(#tg)" strokeWidth={2.5} name={`Temp °${tempUnit}`} />
                  <Area type="monotone" dataKey="humidity" stroke="#22d3ee" fill="url(#hg)" strokeWidth={2} name="Humidity %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ShellCard>
          <ShellCard>
            <h3 className="mb-4 font-bold">{t.week}</h3>
            <div className="space-y-2">
              {daily.map((d) => (
                <div key={d.day} className="grid grid-cols-[.6fr_1fr_.4fr_.4fr_.45fr] items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-sm transition hover:bg-white/8">
                  <span className="font-semibold text-xs">{d.day}</span>
                  <span className="flex items-center gap-1.5 truncate text-xs text-white/60"><span>{weatherIcon(d.condition)}</span><span className="truncate">{d.condition}</span></span>
                  <span className="text-right text-xs font-medium">{tempVal(d.high)}</span>
                  <span className="text-right text-xs text-white/45">{tempVal(d.low)}</span>
                  <span className="text-right text-xs text-cyan-400">{d.rain}%</span>
                </div>
              ))}
            </div>
          </ShellCard>
        </div>

        {/* RADAR + LIGHTNING */}
        <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-3">
          <ShellCard className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-bold">Radar & Storm Tracking</h3><Radar className="text-violet-400" size={18} /></div>
            <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-white/8 bg-[radial-gradient(circle_at_35%_45%,rgba(139,92,246,.45),transparent_14%),radial-gradient(circle_at_65%_55%,rgba(6,182,212,.35),transparent_14%),linear-gradient(135deg,#0f0728,#060d20)]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">{["Rain","Clouds","Temp","Wind","Satellite"].map((x) => <button key={x} className="rounded-full border border-white/12 bg-black/50 px-3 py-1.5 text-xs backdrop-blur transition hover:bg-white/15">{x}</button>)}</div>
              <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur max-w-xs"><p className="text-sm font-semibold">OpenWeather / Mapbox layer-ready</p><p className="mt-1 text-xs text-white/55">Connect MAPBOX_TOKEN to enable interactive live radar.</p></div>
            </div>
          </ShellCard>
          <ShellCard id="lightning">
            <h3 className="mb-4 flex items-center gap-2 font-bold"><Zap className="text-amber-300" size={18} />Lightning Detection</h3>
            <div className="space-y-3">
              {[{l:"Strike rate",v:"21 / 10 min"},{l:"Heatmap",v:"High density"},{l:"Nearest",v:"18.4 km"},{l:"Status",v:"WS-ready"}].map(({l,v})=>(
                <div key={l} className="rounded-xl bg-white/5 px-4 py-3"><p className="text-xs text-white/45">{l}</p><p className="mt-0.5 text-sm font-semibold">{v}</p></div>
              ))}
            </div>
          </ShellCard>
        </div>

        {/* AQI + ALERTS */}
        <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-[.7fr_1.3fr]">
          <ShellCard id="aqi">
            <h3 className="mb-5 font-bold">Air Quality Index</h3>
            <div className="flex items-center gap-4">
              <div className="grid size-24 shrink-0 place-items-center rounded-full text-2xl font-black text-black" style={{ background: aqi.score <= 50 ? "linear-gradient(135deg,#6ee7b7,#34d399)" : aqi.score <= 100 ? "linear-gradient(135deg,#fde68a,#f59e0b)" : "linear-gradient(135deg,#fca5a5,#ef4444)" }}>{aqi.score}</div>
              <div><p className="text-xl font-bold">{aqi.category}</p><p className="mt-1 text-xs text-white/55 leading-relaxed">{aqi.recommendation}</p></div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
              {[["PM2.5", aqi.pm25],["PM10", aqi.pm10],["O₃", aqi.o3],["CO", aqi.co],["NO₂", aqi.no2],["Guide","↗"]].map(([l,v])=>(
                <div key={String(l)} className="rounded-xl bg-white/5 py-2"><p className="text-white/40">{l}</p><p className="font-semibold">{v}</p></div>
              ))}
            </div>
          </ShellCard>
          <ShellCard id="alerts">
            <h3 className="mb-4 flex items-center gap-2 font-bold"><ShieldAlert className="text-amber-300" size={18} />{t.alerts}</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {demoAlerts.map(({title,body,severity})=>(
                <article key={title} className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${severity==="critical"?"border-red-400/25 bg-red-400/8":severity==="warning"?"border-amber-400/25 bg-amber-400/8":"border-sky-400/20 bg-sky-400/8"}`}>
                  <p className={`text-sm font-bold ${severity==="critical"?"text-red-300":severity==="warning"?"text-amber-300":"text-sky-300"}`}>{title}</p>
                  <p className="mt-2 text-xs text-white/55 leading-relaxed">{body}</p>
                  <span className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs uppercase tracking-wide ${severity==="critical"?"bg-red-400/20 text-red-300":severity==="warning"?"bg-amber-400/20 text-amber-300":"bg-sky-400/20 text-sky-300"}`}>{severity}</span>
                </article>
              ))}
            </div>
          </ShellCard>
        </div>

        {/* COMMUNITY + ADMIN */}
        <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-3">
          <ShellCard id="community" className="lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 font-bold"><Users size={18} />{t.community}</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {demoPosts.map(({title,place,likes})=>(
                <article key={title} className="group cursor-pointer rounded-2xl bg-white/5 p-4 transition hover:-translate-y-0.5 hover:bg-white/8">
                  <div className="mb-3 h-20 rounded-xl bg-gradient-to-br from-violet-500/25 via-cyan-500/10 to-emerald-400/20" />
                  <p className="text-sm font-semibold leading-snug">{title}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-white/45"><MapPin size={11} />{place}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-rose-400"><Heart size={13} fill="currentColor" />{likes} likes</p>
                </article>
              ))}
            </div>
          </ShellCard>
          <ShellCard id="admin">
            <h3 className="mb-4 flex items-center gap-2 font-bold"><Settings size={18} />{t.admin}</h3>
            <a href="/admin" className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-300 transition hover:bg-violet-500/20">Open Admin Panel →</a>
            <div className="space-y-2">
              {[{l:"Provider",v:"99.98%",d:"OpenWeather + AQICN"},{l:"Alerts",v:"Live",d:"FCM push ready"},{l:"Refresh",v:"5 min",d:"Auto cache"},{l:"Security",v:"RLS",d:"Supabase policies"}].map(({l,v,d})=>(
                <div key={l} className="rounded-xl bg-white/5 px-4 py-3"><div className="flex justify-between"><p className="text-sm font-semibold">{l}</p><span className="text-sm text-cyan-400 font-bold">{v}</span></div><p className="mt-0.5 text-xs text-white/45">{d}</p></div>
              ))}
            </div>
          </ShellCard>
        </div>

        {/* FOOTER */}
        <footer className="mx-auto mt-10 max-w-7xl border-t border-white/8 pt-6 pb-4 text-center text-xs text-white/30">
          <p>© {new Date().getFullYear()} Zeeshu Weather Alert — Powered by OpenWeather · Open-Meteo · AQICN · Firebase · Supabase</p>
          <p className="mt-1">Worldwide coverage · 200,000+ cities · Real-time data</p>
        </footer>
      </div>
    </main>
  );
}
