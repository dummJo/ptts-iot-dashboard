"use client";
import { useEffect, useState, useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

type Phase = "logo" | "text" | "init" | "bar" | "ready" | "login";

const INIT_LINES = [
  { label: "INIT ", text: "Establishing secure connection" },
  { label: "LOAD ", text: "Fetching asset registry" },
  { label: "CHECK", text: "Verifying sensor feeds" },
  { label: "AUTH ", text: "Preparing encrypted session" },
];

function Splash({ phase, visibleLines, progress }: {
  phase: Phase;
  visibleLines: number;
  progress: number;
}) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "var(--sidebar-bg)" }}>
      {/* Logo area */}
      <div className={`flex flex-col items-center transition-all duration-700
        ${phase === "login" ? "opacity-0 -translate-y-4" : "opacity-100"}`}>

        {/* Spinning rings + logo */}
        <div className="relative w-28 h-28 mb-8">
          {/* outer ring */}
          <div className="absolute inset-0 rounded-full border border-[#005F8E]/40 animate-spin-cw" />
          {/* middle dashed ring */}
          <div className="absolute inset-2 rounded-full border border-dashed border-[#00A3B4]/50 animate-spin-ccw" />
          {/* inner glow */}
          <div className="absolute inset-4 rounded-full animate-pulse-ring" />
          {/* logo */}
          <div className="absolute inset-5 rounded-full overflow-hidden bg-[#003F5C]">
            <img
              src="https://media.licdn.com/dms/image/v2/C560BAQEHIaGsptj-6A/company-logo_200_200/company-logo_200_200/0/1630647930854?e=2147483647&v=beta&t=2t_XIZrMUC3hEWzA62Ar3lfts2ZS30oBt4petkGOmLE"
              alt="PTTS"
              className={`w-full h-full object-cover transition-opacity duration-500
                ${phase === "logo" ? "opacity-0 animate-fade-in" : "opacity-100"}`}
            />
          </div>
        </div>

        {/* Title */}
        <div className={`text-center mb-8 transition-all duration-500
          ${phase === "logo" ? "opacity-0" : "opacity-100 animate-fade-up"}`}>
          <p className="text-xs tracking-[0.35em] text-[#00A3B4] font-semibold mb-1">
            PT PRIMA TEKINDO TIRTA SEJAHTERA
          </p>
          <h1 className="text-2xl font-bold tracking-[0.12em] text-white">
            SMARTSENSOR
          </h1>
          <p className="text-xs text-[#6a99ad] mt-1 tracking-wider">
            Industrial IoT Monitoring System
          </p>
        </div>

        {/* Terminal init lines */}
        {(phase === "init" || phase === "bar" || phase === "ready") && (
          <div className="font-mono text-xs space-y-1.5 mb-6 w-80">
            {INIT_LINES.slice(0, visibleLines).map((line, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-up"
                style={{ animationDelay: `${i * 0}ms` }}>
                <span className="text-[#005F8E] bg-[#005F8E]/10 px-1.5 py-0.5 rounded text-[10px]">
                  {line.label}
                </span>
                <span className="text-[#6a99ad] flex-1">{line.text}</span>
                {i < visibleLines - 1 || phase !== "init" ? (
                  <span className="text-[#22c55e]">✓</span>
                ) : (
                  <span className="text-[#6a99ad] animate-blink">_</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {(phase === "bar" || phase === "ready") && (
          <div className="w-80 animate-fade-up">
            <div className="h-px bg-[#1e3048] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #005F8E, #00A3B4)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-[#6a99ad] font-mono">
                {phase === "ready" ? "SYSTEM READY" : "Initializing..."}
              </span>
              <span className="text-[10px] text-[#00A3B4] font-mono font-semibold">
                {progress}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginForm({ state, formAction, isPending }: {
  state: { error: string } | null;
  formAction: (payload: FormData) => void;
  isPending: boolean;
}) {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center animate-slide-in"
      style={{ background: "var(--sidebar-bg)" }}>

      {/* Top bar accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: "linear-gradient(90deg, #005F8E, #00A3B4, #005F8E)" }} />

      {/* Logo + brand */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-[#005F8E]/40 mb-4">
          <img
            src="https://media.licdn.com/dms/image/v2/C560BAQEHIaGsptj-6A/company-logo_200_200/company-logo_200_200/0/1630647930854?e=2147483647&v=beta&t=2t_XIZrMUC3hEWzA62Ar3lfts2ZS30oBt4petkGOmLE"
            alt="PTTS"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-[10px] tracking-[0.3em] text-[#00A3B4] font-semibold mb-0.5">PTTS</p>
        <h1 className="text-lg font-bold text-white tracking-wide">SmartSensor Dashboard</h1>
        <p className="text-xs text-[#6a99ad] mt-0.5">Sign in to continue</p>
      </div>

      {/* Form card */}
      <form action={formAction} className="w-full max-w-sm px-6">
        <div className="bg-[#0c1626] border border-[#1e3048] rounded-2xl p-6 space-y-4">

          {/* Error */}
          {state?.error && (
            <div className="flex items-center gap-2 text-[#CC0000] bg-[#CC0000]/10 border border-[#CC0000]/20 rounded-lg px-3 py-2.5 text-xs animate-fade-up">
              <span>⚠</span>
              <span>{state.error}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-[10px] text-[#6a99ad] font-semibold tracking-wider uppercase mb-1.5">
              Username
            </label>
            <input
              type="text"
              name="username"
              autoComplete="username"
              required
              maxLength={64}
              placeholder="Enter username"
              className="w-full bg-[#060d18] border border-[#1e3048] rounded-lg px-3.5 py-2.5 text-sm text-white
                placeholder-[#3a5a70] outline-none transition-all
                focus:border-[#005F8E] focus:ring-1 focus:ring-[#005F8E]/40"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] text-[#6a99ad] font-semibold tracking-wider uppercase mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                maxLength={64}
                placeholder="Enter password"
                className="w-full bg-[#060d18] border border-[#1e3048] rounded-lg px-3.5 py-2.5 text-sm text-white
                  placeholder-[#3a5a70] outline-none transition-all pr-10
                  focus:border-[#005F8E] focus:ring-1 focus:ring-[#005F8E]/40"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3a5a70] hover:text-[#6a99ad] text-xs transition-colors"
              >
                {showPass ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white tracking-wider
              transition-all duration-200 mt-1 disabled:opacity-60"
            style={{
              background: isPending
                ? "#003F5C"
                : "linear-gradient(135deg, #005F8E, #00A3B4)",
            }}
          >
            {isPending ? "Signing in..." : "SIGN IN"}
          </button>
        </div>

        {/* Security note */}
        <p className="text-center text-[10px] text-[#3a5a70] mt-4 font-mono">
          🔒 Secured · JWT HS256 · HTTPS only
        </p>
      </form>

      {/* Bottom */}
      <p className="absolute bottom-4 text-[10px] text-[#3a5a70]">
        PT Prima Tekindo Tirta Sejahtera · v0.1.0
      </p>
    </div>
  );
}

export default function LoginClient() {
  const [phase, setPhase] = useState<Phase>("logo");
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);

  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase("text"), 700));
    timers.push(setTimeout(() => {
      setPhase("init");
      setVisibleLines(1);
    }, 1400));
    timers.push(setTimeout(() => setVisibleLines(2), 1900));
    timers.push(setTimeout(() => setVisibleLines(3), 2400));
    timers.push(setTimeout(() => setVisibleLines(4), 2900));
    timers.push(setTimeout(() => setPhase("bar"), 3300));

    // Progress bar animation
    timers.push(setTimeout(() => {
      let p = 0;
      const interval = setInterval(() => {
        p = Math.min(p + 3, 100);
        setProgress(p);
        if (p >= 100) clearInterval(interval);
      }, 20);
    }, 3400));

    timers.push(setTimeout(() => setPhase("ready"), 4800));
    timers.push(setTimeout(() => setPhase("login"), 5400));

    return () => timers.forEach(clearTimeout);
  }, []);

  if (phase !== "login") {
    return <Splash phase={phase} visibleLines={visibleLines} progress={progress} />;
  }

  return <LoginForm state={state} formAction={formAction} isPending={isPending} />;
}
