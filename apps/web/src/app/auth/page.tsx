"use client";

import { CloudLightning, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";

type Mode = "signin" | "signup" | "reset";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function supabaseAuth(
  action: "signin" | "signup" | "reset",
  email: string,
  password?: string
) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Demo mode — no Supabase keys configured
    await new Promise((r) => setTimeout(r, 800));
    if (action === "reset") return { message: "Password reset email sent (demo mode)." };
    return { user: { email }, session: { access_token: "demo" } };
  }

  const endpoints: Record<string, string> = {
    signin: `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    signup: `${SUPABASE_URL}/auth/v1/signup`,
    reset: `${SUPABASE_URL}/auth/v1/recover`,
  };

  const body: Record<string, string> = { email };
  if (password && action !== "reset") body.password = password;

  const response = await fetch(endpoints[action], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.msg || "Authentication failed");
  return data;
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const titles: Record<Mode, string> = {
    signin: "Welcome back",
    signup: "Create account",
    reset: "Reset password",
  };

  const subtitles: Record<Mode, string> = {
    signin: "Sign in to Zeeshu Weather Alert",
    signup: "Start monitoring weather worldwide",
    reset: "Enter your email to receive a reset link",
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) return setError("Please enter your email address.");
    if (mode !== "reset" && password.length < 6)
      return setError("Password must be at least 6 characters.");

    setIsLoading(true);
    try {
      const data = await supabaseAuth(mode, email.trim(), password);
      if (mode === "reset") {
        setSuccess("Password reset link sent — check your inbox.");
        setEmail("");
      } else if (mode === "signup") {
        setSuccess("Account created. Please check your email to verify.");
        setPassword("");
      } else {
        // Successful sign-in
        setSuccess("Signed in successfully. Redirecting…");
        setTimeout(() => (window.location.href = "/"), 1000);
      }
      void data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setSuccess("");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(145deg,#061225_0%,#0b3a67_55%,#061225_100%)] px-4 text-white">
      {/* Background decoration */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(57,194,255,0.18),transparent_55%),radial-gradient(ellipse_at_75%_80%,rgba(69,240,194,0.12),transparent_50%)]"
      />

      <section className="relative w-full max-w-md">
        {/* Logo header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-skyglow text-ink shadow-glow">
            <CloudLightning size={30} />
          </div>
          <h1 className="text-3xl font-semibold">{titles[mode]}</h1>
          <p className="mt-1 text-sky-100/65">{subtitles[mode]}</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-7">
          {/* Status messages */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              className="mb-5 rounded-2xl border border-aurora/20 bg-aurora/10 px-4 py-3 text-sm text-aurora"
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm text-sky-100/70">
                Email address
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 transition focus-within:border-skyglow/50 focus-within:bg-white/12">
                <Mail size={17} className="shrink-0 text-sky-100/50" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full bg-transparent text-sm outline-none placeholder:text-sky-100/35"
                />
              </div>
            </div>

            {/* Password */}
            {mode !== "reset" && (
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm text-sky-100/70">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 transition focus-within:border-skyglow/50 focus-within:bg-white/12">
                  <Lock size={17} className="shrink-0 text-sky-100/50" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    required
                    className="w-full bg-transparent text-sm outline-none placeholder:text-sky-100/35"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="shrink-0 text-sky-100/45 transition hover:text-sky-100/80"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot password link */}
            {mode === "signin" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="text-sm text-skyglow/80 hover:text-skyglow transition"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-skyglow py-3.5 font-semibold text-ink transition hover:bg-[#5dceff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {mode === "signin" && "Sign in"}
              {mode === "signup" && "Create account"}
              {mode === "reset" && "Send reset link"}
            </button>
          </form>

          {/* Mode switchers */}
          <div className="mt-5 border-t border-white/8 pt-5 text-center text-sm text-sky-100/60">
            {mode === "signin" && (
              <p>
                No account?{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="font-medium text-skyglow hover:underline"
                >
                  Sign up free
                </button>
              </p>
            )}
            {mode === "signup" && (
              <p>
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("signin")}
                  className="font-medium text-skyglow hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === "reset" && (
              <p>
                Back to{" "}
                <button
                  onClick={() => switchMode("signin")}
                  className="font-medium text-skyglow hover:underline"
                >
                  sign in
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-sky-100/35">
          {SUPABASE_URL
            ? "Secured by Supabase Authentication"
            : "Demo mode — add Supabase keys to enable real auth"}
        </p>
      </section>
    </main>
  );
}
