"use client";
import { useEffect, useState, useActionState, useRef } from "react";
import { loginAction } from "@/app/actions/auth";

type Phase = "logo" | "text" | "init" | "bar" | "ready" | "login";
type Lang  = "en" | "id" | "ja" | "ko" | "zh";

const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png";

const INIT_LINES = [
  { tag: "SYS",  text: "Initializing runtime environment" },
  { tag: "NET",  text: "Establishing secure channel" },
  { tag: "DATA", text: "Loading asset registry" },
  { tag: "AUTH", text: "Generating encrypted session" },
];

const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "EN", native: "English"  },
  { code: "id", label: "ID", native: "Indonesia" },
  { code: "ja", label: "JP", native: "日本語"    },
  { code: "ko", label: "KO", native: "한국어"    },
  { code: "zh", label: "ZH", native: "中文"      },
];

const T: Record<Lang, {
  sub: string; uid: string; uid_ph: string;
  pwd: string; pwd_ph: string; remember: string;
  btn: string; pending: string; footer: string;
}> = {
  en: { sub:"Operator Sign In",    uid:"Operator ID",  uid_ph:"Enter your operator ID",   pwd:"Password",   pwd_ph:"Enter your password",    remember:"Stay signed in", btn:"Sign In",  pending:"Verifying...", footer:"PT Prima Tekindo Tirta Sejahtera" },
  id: { sub:"Masuk Operator",      uid:"ID Operator",  uid_ph:"Masukkan ID operator Anda", pwd:"Kata Sandi", pwd_ph:"Masukkan kata sandi",     remember:"Ingat saya",     btn:"Masuk",    pending:"Memverifikasi...", footer:"PT Prima Tekindo Tirta Sejahtera" },
  ja: { sub:"オペレーターサインイン", uid:"オペレーター ID", uid_ph:"ID を入力してください",    pwd:"パスワード",  pwd_ph:"パスワードを入力してください", remember:"ログイン状態を保持", btn:"サインイン", pending:"確認中...", footer:"PT プリマ テキンド ティルタ セジャテラ" },
  ko: { sub:"운영자 로그인",          uid:"운영자 ID",     uid_ph:"운영자 ID를 입력하세요",   pwd:"비밀번호",   pwd_ph:"비밀번호를 입력하세요",    remember:"로그인 유지",     btn:"로그인",    pending:"확인 중...", footer:"PT 프리마 테킨도 티르타 세자테라" },
  zh: { sub:"操作员登录",             uid:"操作员 ID",     uid_ph:"请输入操作员 ID",          pwd:"密码",       pwd_ph:"请输入密码",               remember:"保持登录",        btn:"登录",      pending:"验证中...", footer:"PT 普里马 特金多 蒂尔塔 塞贾特拉" },
};

/* ── colour tokens — PTTS Blue ─────────────────────────────── */
const C = {
  bg:       "#080b10",
  bgPanel:  "#0a0f18",
  bgInput:  "#060911",
  bgCard:   "#0d1220",
  border:   "#182030",
  borderHi: "#00A3B4",
  cream:    "#d4e8f0",
  muted:    "#5a8090",
  faint:    "#1a2d3a",
  gold:     "#00A3B4",
  goldDim:  "#005F8E",
};

/* ── Subtle grid background ────────────────────────────────── */
function Grid() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      {Array.from({ length: 18 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={`${i * 5.88}%`} x2="100%" y2={`${i * 5.88}%`}
          stroke={C.gold} strokeOpacity="0.025" strokeWidth="1" />
      ))}
      {Array.from({ length: 24 }).map((_, i) => (
        <line key={`v${i}`} x1={`${i * 4.17}%`} y1="0" x2={`${i * 4.17}%`} y2="100%"
          stroke={C.gold} strokeOpacity="0.025" strokeWidth="1" />
      ))}
      <defs>
        <radialGradient id="glow" cx="35%" cy="50%" r="55%">
          <stop offset="0%"   stopColor={C.gold} stopOpacity="0.06" />
          <stop offset="100%" stopColor={C.bg}   stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#glow)" />
    </svg>
  );
}

export default function LoginClient() {
  const [phase, setPhase]  = useState<Phase>("logo");
  const [lines, setLines]  = useState(0);
  const [pct,   setPct]    = useState(0);
  const [showPw, setShowPw]= useState(false);
  const [lang,  setLang]   = useState<Lang>("en");
  const [open,  setOpen]   = useState(false);
  const [remember, setRem] = useState(true);
  const [state, action, pending] = useActionState(loginAction, null);
  const dropRef = useRef<HTMLDivElement>(null);
  const t = T[lang];

  const [showInactivityToast, setShowInactivityToast] = useState(false);

  /* splash timing */
  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    ids.push(setTimeout(() => setPhase("text"),                700));
    ids.push(setTimeout(() => { setPhase("init"); setLines(1); }, 1400));
    ids.push(setTimeout(() => setLines(2), 2000));
    ids.push(setTimeout(() => setLines(3), 2600));
    ids.push(setTimeout(() => setLines(4), 3200));
    ids.push(setTimeout(() => setPhase("bar"), 3600));
    ids.push(setTimeout(() => {
      let p = 0;
      const iv = setInterval(() => { p = Math.min(p + 2, 100); setPct(p); if (p >= 100) clearInterval(iv); }, 18);
    }, 3700));
    ids.push(setTimeout(() => setPhase("ready"), 5000));
    ids.push(setTimeout(() => setPhase("login"),  5600));
    return () => ids.forEach(clearTimeout);
  }, []);

  /* close dropdown on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* Check for inactivity parameter */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reason") === "inactivity") {
        setShowInactivityToast(true);
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => setShowInactivityToast(false), 8000);
      }
    }
  }, []);

  /* ── SPLASH ──────────────────────────────────────────────── */
  if (phase !== "login") return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: C.bg }}>
      <Grid />

      {/* scanline */}
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: `repeating-linear-gradient(0deg,${C.gold}08 0,${C.gold}08 1px,transparent 1px,transparent 5px)` }} />

      {/* top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-8 py-2.5 z-10"
        style={{ borderBottom: `1px solid ${C.border}`, background: C.bgPanel + "ee" }}>
        <span className="text-[9px] tracking-[.3em] font-bold" style={{ color: C.muted }}>
          PTTS · INDUSTRIAL IOT PLATFORM
        </span>
        <span className="text-[9px] tracking-[.25em] font-bold animate-blink" style={{ color: C.gold }}>
          ■ CONNECTING
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo rings */}
        <div className="relative w-28 h-28 mb-8">
          <div className="absolute inset-0 rounded-full animate-spin-cw"
            style={{ border: `1px solid ${C.gold}25` }} />
          <div className="absolute inset-2 rounded-full border-dashed animate-spin-ccw"
            style={{ border: `1px dashed ${C.gold}18` }} />
          <div className="absolute inset-5 rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: C.bgPanel }}>
            <img src={LOGO} alt="PTTS"
              className={`w-full h-full object-contain p-1.5 transition-opacity duration-700 ${phase === "logo" ? "opacity-0" : "opacity-100"}`} />
          </div>
        </div>

        {/* Title */}
        <div className={`text-center mb-8 transition-all duration-500 ${phase === "logo" ? "opacity-0" : "opacity-100"}`}>
          <p className="text-[8px] tracking-[.45em] font-bold mb-1.5" style={{ color: C.goldDim }}>
            PT PRIMA TEKINDO TIRTA SEJAHTERA
          </p>
          <h1 className="text-3xl font-bold tracking-[.2em] mb-1" style={{ color: C.cream }}>
            SMARTSENSOR
          </h1>
          <p className="text-[9px] tracking-[.3em] font-bold" style={{ color: C.muted }}>
            INDUSTRIAL IOT MONITORING SYSTEM
          </p>
        </div>

        {/* Init lines */}
        {["init","bar","ready"].includes(phase) && (
          <div className="font-mono text-[11px] space-y-2 mb-6 w-80">
            {INIT_LINES.slice(0, lines).map((ln, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-up">
                <span className="text-[9px] px-1.5 py-0.5 font-bold w-10 text-center"
                  style={{ background: C.faint, border: `1px solid ${C.border}`, color: C.gold }}>
                  {ln.tag}
                </span>
                <span className="flex-1" style={{ color: C.cream }}>{ln.text}</span>
                {i < lines - 1 || phase !== "init"
                  ? <span className="text-[10px] font-bold" style={{ color: C.gold }}>OK</span>
                  : <span style={{ color: C.cream }} className="animate-blink">_</span>}
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        {["bar","ready"].includes(phase) && (
          <div className="w-80 animate-fade-up">
            <div className="h-px overflow-hidden" style={{ background: C.border }}>
              <div className="h-full transition-all duration-75" style={{ width: `${pct}%`, background: C.gold }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] font-bold tracking-widest" style={{ color: C.muted }}>
                {phase === "ready" ? "SYSTEM READY" : "LOADING"}
              </span>
              <span className="text-[9px] font-bold" style={{ color: C.gold }}>{pct}%</span>
            </div>
          </div>
        )}
      </div>

      {/* bottom bar */}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-8 py-2.5 z-10"
        style={{ borderTop: `1px solid ${C.border}`, background: C.bgPanel + "ee" }}>
        <span className="text-[9px] font-bold tracking-widest" style={{ color: C.faint }}>v0.7.0</span>
        <span className="text-[9px] font-bold tracking-widest" style={{ color: C.faint }}>JWT HS256</span>
      </div>
    </div>
  );

  /* ── LOGIN FORM ──────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 flex overflow-hidden animate-slide-in" style={{ background: C.bg }}>

      {/* ── LEFT — branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden p-12"
        style={{ background: C.bgPanel, borderRight: `1px solid ${C.border}` }}>
        <Grid />

        {/* Logo + company */}
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-0.5"
            style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
            <img src={LOGO} alt="PTTS" className="w-full h-full object-contain p-1.5" />
          </div>
          <div>
            <p className="text-[9px] tracking-[.3em] font-bold leading-relaxed" style={{ color: C.muted }}>
              PT PRIMA TEKINDO<br />TIRTA SEJAHTERA
            </p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10">
          {/* Gold rule */}
          <div className="w-8 h-px mb-8" style={{ background: C.gold }} />

          <h1 className="text-[2.6rem] font-bold leading-[1.1] tracking-tight mb-5" style={{ color: C.cream }}>
            SmartSensor™<br />
            <span style={{ color: C.gold }}>Industrial</span><br />
            IoT Platform
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: C.muted }}>
            Real-time condition monitoring for rotating assets — motor, pump, and compressor health at a glance.
          </p>

          {/* Subtle stat row */}
          <div className="flex gap-8 mt-10">
            {[["MQTT", "Realtime"], ["JWT", "Secured"], ["PostgreSQL", "Persistent"]].map(([label, sub]) => (
              <div key={label}>
                <p className="text-xs font-bold tracking-wider" style={{ color: C.gold }}>{label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer left */}
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.gold }} />
            <span className="text-[9px] font-bold tracking-widest" style={{ color: C.muted }}>SYSTEM ONLINE</span>
          </div>
          <p className="text-[9px] font-bold tracking-widest mt-1" style={{ color: C.faint }}>
            v0.7.0 · JWT HS256 · 60 MIN SESSION
          </p>
        </div>
      </div>

      {/* ── RIGHT — form ── */}
      <div className="flex-1 flex flex-col" style={{ background: C.bg }}>

        {/* Top bar: lang picker */}
        <div className="flex items-center justify-end px-10 py-4"
          style={{ borderBottom: `1px solid ${C.border}` }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mr-auto">
            <div className="w-7 h-7 rounded-full overflow-hidden"
              style={{ background: C.bgPanel, border: `1px solid ${C.border}` }}>
              <img src={LOGO} alt="PTTS" className="w-full h-full object-contain p-1" />
            </div>
            <span className="text-[9px] tracking-widest font-bold" style={{ color: C.muted }}>PTTS SMARTSENSOR</span>
          </div>

          {/* Language dropdown */}
          <div className="relative" ref={dropRef}>
            <button onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold tracking-widest transition-colors"
              style={{
                border: `1px solid ${open ? C.borderHi : C.border}`,
                color: open ? C.gold : C.muted,
                background: "transparent",
                borderRadius: 2,
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {LANGS.find(l => l.code === lang)?.label}
              <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1 w-36 z-50 overflow-hidden animate-fade-up"
                style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 2 }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
                    className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-bold tracking-widest transition-colors text-left"
                    style={{
                      color:      lang === l.code ? C.gold  : C.muted,
                      background: lang === l.code ? C.faint : "transparent",
                      borderBottom: `1px solid ${C.border}`,
                    }}>
                    <span>{l.label}</span>
                    <span className="font-normal text-[9px]" style={{ color: C.muted }}>{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-[340px]">

            {/* Heading */}
            <div className="mb-9">
              <div className="w-6 h-px mb-6" style={{ background: C.gold }} />
              <h2 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: C.cream }}>
                SmartSensor™
              </h2>
              <p className="text-sm" style={{ color: C.muted }}>{t.sub}</p>
            </div>

            {/* Error */}
            {state?.error && (
              <div className="flex items-center gap-2 text-xs px-3 py-2.5 mb-5 animate-fade-up"
                style={{ background: "#3a100810", border: `1px solid #7a201830`, color: "#c0705a", borderRadius: 2 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {state.error}
              </div>
            )}

            <form action={action} className="space-y-5">

              {/* Username */}
              <div>
                <label className="block text-[10px] font-bold tracking-widest mb-2" style={{ color: C.muted }}>
                  {t.uid.toUpperCase()}
                </label>
                <div className="relative">
                  <input type="text" name="username" autoComplete="username"
                    required maxLength={64} placeholder={t.uid_ph}
                    className="w-full px-4 py-3 text-sm outline-none transition-all"
                    style={{
                      background: C.bgInput,
                      border: `1px solid ${C.border}`,
                      color: C.cream,
                      fontFamily: "inherit",
                      borderRadius: 2,
                    }}
                    onFocus={e => { e.target.style.borderColor = C.borderHi; e.target.style.boxShadow = `0 0 0 2px ${C.gold}15`; }}
                    onBlur={e  => { e.target.style.borderColor = C.border;   e.target.style.boxShadow = "none"; }}
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: C.faint }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold tracking-widest mb-2" style={{ color: C.muted }}>
                  {t.pwd.toUpperCase()}
                </label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} name="password"
                    autoComplete="current-password" required maxLength={64}
                    placeholder={t.pwd_ph}
                    className="w-full px-4 py-3 text-sm outline-none transition-all pr-16"
                    style={{
                      background: C.bgInput,
                      border: `1px solid ${C.border}`,
                      color: C.cream,
                      fontFamily: "inherit",
                      borderRadius: 2,
                    }}
                    onFocus={e => { e.target.style.borderColor = C.borderHi; e.target.style.boxShadow = `0 0 0 2px ${C.gold}15`; }}
                    onBlur={e  => { e.target.style.borderColor = C.border;   e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold tracking-widest transition-colors"
                    style={{ color: C.muted }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.gold)}
                    onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
                    {showPw ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => setRem(!remember)}
                  className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    background: remember ? C.gold : "transparent",
                    border: `1px solid ${remember ? C.gold : C.border}`,
                    borderRadius: 2,
                  }}>
                  {remember && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24"
                      fill="none" stroke={C.bg} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
                <span className="text-xs" style={{ color: C.muted }}>{t.remember}</span>
              </div>

              {/* Submit */}
              <button type="submit" disabled={pending}
                className="w-full py-3 text-xs font-bold tracking-[.15em] transition-all disabled:opacity-50 mt-1"
                style={{
                  background: pending ? C.faint : C.gold,
                  color: pending ? C.muted : C.bg,
                  border: "none",
                  borderRadius: 2,
                }}
                onMouseEnter={e => { if (!pending) e.currentTarget.style.background = C.goldDim; }}
                onMouseLeave={e => { if (!pending) e.currentTarget.style.background = C.gold; }}>
                {pending ? t.pending : t.btn.toUpperCase()}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-5" style={{ borderTop: `1px solid ${C.border}` }}>
              <p className="text-[9px] text-center font-bold tracking-widest" style={{ color: C.faint }}>
                {t.footer}
              </p>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-10 py-3"
          style={{ borderTop: `1px solid ${C.border}` }}>
          <span className="text-[9px] font-bold tracking-widest" style={{ color: C.faint }}>v0.7.0</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.gold }} />
            <span className="text-[9px] font-bold tracking-widest" style={{ color: C.faint }}>SECURED · JWT HS256</span>
          </div>
        </div>
      </div>

      {/* Auto Logout Toast */}
      {showInactivityToast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in flex shadow-2xl" 
          style={{ background: "#2a4af5", color: "white", padding: "16px 20px 16px 24px", borderRadius: "1px", minWidth: "320px", maxWidth: "400px" }}>
          <div className="flex-1 mr-6">
            <p className="text-base font-semibold" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>You have been logged out</p>
            <p className="text-sm mt-1" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>(inactivity or invalid token detected)</p>
          </div>
          <button onClick={() => setShowInactivityToast(false)} className="self-start text-white opacity-80 hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
