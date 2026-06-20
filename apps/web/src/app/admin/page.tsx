"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  CloudLightning,
  Loader2,
  RefreshCw,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type Analytics = {
  users: number;
  activeAlerts: number;
  communityPosts: number;
  pushDeliveryRate: number;
};

const DEMO_ANALYTICS: Analytics = {
  users: 1240,
  activeAlerts: 8,
  communityPosts: 386,
  pushDeliveryRate: 97.4,
};

const modules = [
  {
    icon: Users,
    title: "User Management",
    description: "Profiles, roles, notification consent, and saved locations.",
    color: "text-skyglow",
    bg: "bg-skyglow/10",
    href: "#",
  },
  {
    icon: Bell,
    title: "Alert Management",
    description: "Create, review, and publish severe weather alerts.",
    color: "text-amber-300",
    bg: "bg-amber-300/10",
    href: "#",
  },
  {
    icon: ShieldCheck,
    title: "Moderation",
    description: "Review community posts, photos, comments, and reports.",
    color: "text-aurora",
    bg: "bg-aurora/10",
    href: "#",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "API usage, active cities, alert delivery, and weather statistics.",
    color: "text-violet-300",
    bg: "bg-violet-300/10",
    href: "#",
  },
];

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  color: string;
  isLoading: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className={`grid size-11 place-items-center rounded-xl ${color.replace("text-", "bg-").replace("-300", "-300/15").replace("-400", "-400/15")}`}>
          <Icon className={color} size={22} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 rounded-full bg-aurora/10 px-2.5 py-1 text-xs text-aurora">
            <TrendingUp size={12} /> {trend}
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="mt-4">
          <div className="skeleton h-8 w-24" />
          <div className="skeleton mt-2 h-4 w-32" />
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-3xl font-semibold">{value}</p>
          <p className="mt-1 text-sm text-sky-100/60">{label}</p>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/admin/analytics`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("API not available");
      const data: Analytics = await response.json();
      setAnalytics(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setAnalytics(DEMO_ANALYTICS);
      setLastUpdated(new Date().toLocaleTimeString() + " (demo)");
      setError("API offline — showing demo data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const stats = analytics ?? DEMO_ANALYTICS;

  return (
    <main className="min-h-screen bg-ink text-white">
      <div className="premium-shell min-h-screen bg-[radial-gradient(circle_at_10%_8%,rgba(57,194,255,0.18),transparent_38%),linear-gradient(145deg,#061225_0%,#0b2b4f_46%,#07111f_100%)] px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pb-10">

        {/* Header */}
        <header className="mx-auto max-w-6xl">
          <nav className="flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-skyglow text-ink">
                <CloudLightning size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-sky-100/50">Admin Panel</p>
                <h1 className="font-semibold">Operations Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadAnalytics()}
                disabled={isLoading}
                aria-label="Refresh analytics"
                className="flex items-center gap-2 rounded-full border border-white/12 px-3 py-2 text-sm text-sky-100/70 transition hover:bg-white/10 disabled:opacity-50"
              >
                <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <a
                href="/"
                className="rounded-full border border-white/12 px-3 py-2 text-sm text-sky-100/70 transition hover:bg-white/10"
              >
                ← Dashboard
              </a>
            </div>
          </nav>
        </header>

        {/* Error banner */}
        {error && (
          <div className="mx-auto mt-4 max-w-6xl">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
              <AlertTriangle size={16} className="shrink-0" />
              {error}
            </div>
          </div>
        )}

        {/* Live stats */}
        <div className="mx-auto mt-6 max-w-6xl grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Registered users"
            value={isLoading ? "—" : stats.users.toLocaleString()}
            trend="+12%"
            color="text-skyglow"
            isLoading={isLoading}
          />
          <StatCard
            icon={Bell}
            label="Active alerts"
            value={isLoading ? "—" : stats.activeAlerts}
            color="text-amber-300"
            isLoading={isLoading}
          />
          <StatCard
            icon={Activity}
            label="Community posts"
            value={isLoading ? "—" : stats.communityPosts.toLocaleString()}
            trend="+24"
            color="text-aurora"
            isLoading={isLoading}
          />
          <StatCard
            icon={CheckCircle2}
            label="Push delivery rate"
            value={isLoading ? "—" : `${stats.pushDeliveryRate}%`}
            color="text-violet-300"
            isLoading={isLoading}
          />
        </div>

        {/* Module cards */}
        <div className="mx-auto mt-6 max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Settings size={20} className="text-skyglow" />
              Admin Modules
            </h2>
            {lastUpdated && (
              <p className="text-xs text-sky-100/45">Last updated: {lastUpdated}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {modules.map(({ icon: Icon, title, description, color, bg }) => (
              <section
                key={title}
                className="glass group cursor-pointer rounded-3xl p-6 transition hover:scale-[1.01]"
              >
                <div className={`mb-4 grid size-12 place-items-center rounded-2xl ${bg}`}>
                  <Icon className={`${color} transition group-hover:scale-110`} size={24} />
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sky-100/65">{description}</p>
                <div className="mt-5 flex items-center gap-2 text-sm text-sky-100/45 transition group-hover:text-sky-100/75">
                  <span>Open module</span>
                  <span className="transition group-hover:translate-x-1">→</span>
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="mx-auto mt-6 max-w-6xl">
          <div className="glass rounded-3xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Activity size={18} className="text-aurora" />
              System Status
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Weather API", status: "Operational", ok: true },
                { label: "Push Notifications", status: "Operational", ok: true },
                { label: "Database", status: "Operational", ok: true },
                { label: "Auth Service", status: "Operational", ok: true },
              ].map(({ label, status, ok }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl bg-white/6 px-4 py-3"
                >
                  <span className="text-sm text-sky-100/70">{label}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${ok ? "text-aurora" : "text-red-300"}`}>
                    <span className={ok ? "status-dot" : "size-2 rounded-full bg-red-400"} />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-sm backdrop-blur-xl">
            <Loader2 size={15} className="animate-spin text-skyglow" />
            Loading analytics…
          </div>
        )}
      </div>
    </main>
  );
}
