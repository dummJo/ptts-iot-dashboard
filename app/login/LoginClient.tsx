"use client";
import { useEffect, useState, useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

type Phase = "logo" | "text" | "init" | "bar" | "ready" | "login";

const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/published/logo-ptts.jpg";

const INIT_LINES = [
  { tag: "SYS ", text: "Initializing runtime environment" },
  { tag: "NET ", text: "Establishing secure connection" },
  { tag: "DATA", text: "Loading asset tag database" },
  { tag: "AUTH", text: "Generating encrypted session" },
];

export default function LoginClient() {
  const [phase, setPhase]           = useState<Phase>("logo");
  const [visibleLines, setVisible]  = useState(0);
  const [progress, setProgress]     = useState(0);
  const [showPass, setShowPass]     = useState(false);
  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setPhase("text"),         700));
    t.push(setTimeout(() => { setPhase("init"); setVisible(1); }, 1400));
    t.push(setTimeout(() => setVisible(2),            2000));
    t.push(setTimeout(() => setVisible(3),            2600));
    t.push(setTimeout(() => setVisible(4),            3200));
    t.push(setTimeout(() => setPhase("bar"),          3600));
    t.push(setTimeout(() => {
      let p = 0;
      const iv = setInterval(() => {
        p = Math.min(p + 2, 100);
        setProgress(p);
        if (p >= 100) clearInterval(iv);
      }, 18);
    }, 3700));
    t.push(setTimeout(() => setPhase("ready"),        5000));
    t.push(setTimeout(() => setPhase("login"),        5600));
    return () => t.forEach(clearTimeout);
  }, []);

  /* ── SPLASH ─────────────────────────────────────────────── */
  if ((phase as string) !== "login") return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#080b10" }}>

      {/* scanline overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)" }} />

      {/* top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-2 border-b"
        style={{ borderColor: "#1a2235", background: "#060810" }}>
        <span className="text-[9px] tracking-[.25em] text-[#2e4560]">PTTS · INDUSTRIAL IOT PLATFORM</span>
        <span className="text-[9px] tracking-[.25em] text-[#2e4560] animate-blink">■ CONNECTING</span>
      </div>

      <div className={`flex flex-col items-center transition-all duration-700
        ${"opacity-100"}`}>

        {/* Logo with rings */}
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 rounded-full border border-[#005F8E]/30 animate-spin-cw" />
          <div className="absolute inset-2 rounded-full border border-dashed border-[#00A3B4]/25 animate-spin-ccw" />
          <div className="absolute inset-4 rounded-full animate-pulse-ring" />
          <div className="absolute inset-5 rounded-full overflow-hidden bg-[#0d1628] flex items-center justify-center">
            <img src={LOGO} alt="PTTS"
              className={`w-full h-full object-contain p-1 transition-opacity duration-700
                ${phase === "logo" ? "opacity-0 animate-fade-in" : "opacity-100"}`} />
          </div>
        </div>

        {/* Title */}
        <div className={`text-center mb-8 transition-all duration-500
          ${phase === "logo" ? "opacity-0" : "opacity-100 animate-fade-up"}`}>
          <p className="text-[9px] tracking-[.4em] text-[#00A3B4] mb-1.5 animate-flicker">
            PT PRIMA TEKINDO TIRTA SEJAHTERA
          </p>
          <h1 className="text-3xl font-bold tracking-[.18em] text-white mb-1">SMARTSENSOR</h1>
          <p className="text-[10px] tracking-[.25em] text-[#3a5a70]">INDUSTRIAL IOT MONITORING SYSTEM</p>
        </div>

        {/* Init lines */}
        {["init","bar","ready"].includes(phase) && (
          <div className="font-mono text-[11px] space-y-1.5 mb-6 w-96">
            {INIT_LINES.slice(0, visibleLines).map((ln, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-up">
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold text-[#005F8E]"
                  style={{ background: "#005F8E15", border: "1px solid #005F8E30" }}>
                  {ln.tag}
                </span>
                <span className="flex-1 text-[#3a5a70]">{ln.text}</span>
                {i < visibleLines - 1 || phase !== "init"
                  ? <span className="text-[#00e676] text-[10px] font-bold">OK</span>
                  : <span className="text-[#3a5a70] animate-blink">_</span>}
              </div>
            ))}
          </div>
        )}

        {/* Progress */}
        {["bar","ready"].includes(phase) && (
          <div className="w-96 animate-fade-up">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1a2235" }}>
              <div className="h-full rounded-full transition-all duration-75"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg,#005F8E,#00A3B4)" }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-[#3a5a70] tracking-widest">
                {phase === "ready" ? "SYSTEM READY" : "LOADING..."}
              </span>
              <span className="text-[9px] text-[#00A3B4] font-bold">{progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2 border-t"
        style={{ borderColor: "#1a2235", background: "#060810" }}>
        <span className="text-[9px] text-[#2e4560] tracking-widest">v0.2.0</span>
        <span className="text-[9px] text-[#2e4560] tracking-widest">SESSION SECURED · JWT HS256</span>
      </div>
    </div>
  );

  /* ── LOGIN FORM ──────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center animate-slide-in"
      style={{ background: "#080b10" }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)" }} />

      {/* top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, transparent, #005F8E, #00A3B4, #005F8E, transparent)" }} />

      <div className="flex flex-col items-center w-full max-w-sm px-6">
        {/* Logo */}
        <div className="w-16 h-16 rounded-full overflow-hidden mb-4"
          style={{ border: "1.5px solid #005F8E50", background: "#0d1628" }}>
          <img src={LOGO} alt="PTTS" className="w-full h-full object-contain p-1" />
        </div>
        <p className="text-[9px] tracking-[.35em] text-[#00A3B4] mb-0.5">PTTS</p>
        <h1 className="text-lg font-bold tracking-[.12em] text-white mb-0.5">SMARTSENSOR</h1>
        <p className="text-[9px] tracking-widest text-[#3a5a70] mb-8">OPERATOR SIGN IN</p>

        {/* Card */}
        <div className="w-full rounded-sm p-6 space-y-4"
          style={{ background: "#111520", border: "1px solid #242d3f", borderTop: "2px solid #005F8E" }}>

          {state?.error && (
            <div className="flex items-center gap-2 text-[10px] px-3 py-2 rounded-sm animate-fade-up"
              style={{ background: "#CC000015", border: "1px solid #CC000040", color: "#CC0000" }}>
              <span className="led led-fault" />
              <span>{state.error}</span>
            </div>
          )}

          <div>
            <label className="scada-label block mb-1.5">Operator ID</label>
            <input type="text" name="username" autoComplete="username"
              required maxLength={64} placeholder="Enter operator ID"
              className="w-full px-3 py-2.5 text-sm rounded-sm outline-none transition-all"
              style={{
                background: "#080b10", border: "1px solid #242d3f",
                color: "#c8d8e8", fontFamily: "inherit",
              }}
              onFocus={e => e.target.style.borderColor = "#005F8E"}
              onBlur={e => e.target.style.borderColor = "#242d3f"}
            />
          </div>

          <div>
            <label className="scada-label block mb-1.5">Password</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} name="password"
                autoComplete="current-password" required maxLength={64}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-sm rounded-sm outline-none transition-all pr-14"
                style={{
                  background: "#080b10", border: "1px solid #242d3f",
                  color: "#c8d8e8", fontFamily: "inherit",
                }}
                onFocus={e => e.target.style.borderColor = "#005F8E"}
                onBlur={e => e.target.style.borderColor = "#242d3f"}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] tracking-widest transition-colors"
                style={{ color: "#3a5a70" }}>
                {showPass ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          <button type="submit" form="login-form" disabled={isPending}
            onClick={() => {}}
            className="w-full py-2.5 text-sm font-bold tracking-[.15em] rounded-sm transition-all disabled:opacity-50"
            style={{ background: isPending ? "#003F5C" : "#005F8E", color: "#fff" }}>
            {isPending ? "AUTHENTICATING..." : "SIGN IN"}
          </button>

          {/* hidden form to use with useActionState */}
          <form id="login-form" action={formAction} className="hidden" />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <span className="led led-online" style={{ width: 6, height: 6 }} />
          <span className="text-[9px] tracking-widest text-[#2e4560]">SECURED · JWT HS256 · 60 MIN SESSION</span>
        </div>
      </div>

      <div className="absolute bottom-4 text-[9px] tracking-widest text-[#1a2235]">
        PT PRIMA TEKINDO TIRTA SEJAHTERA · v0.2.0
      </div>
    </div>
  );
}
