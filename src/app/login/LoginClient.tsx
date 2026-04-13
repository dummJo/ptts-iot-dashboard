"use client";
import { useEffect, useState, useActionState, useRef } from "react";
import { loginAction } from "@/app/actions/auth";

type Phase = "logo" | "text" | "init" | "bar" | "ready" | "login";
type Lang = "en" | "id" | "ja" | "ko" | "zh";

const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png";

const INIT_LINES = [
  { tag: "SYS ", text: "Initializing runtime environment" },
  { tag: "NET ", text: "Establishing secure connection" },
  { tag: "DATA", text: "Loading asset tag database" },
  { tag: "AUTH", text: "Generating encrypted session" },
];

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "id", label: "Indonesia",  flag: "🇮🇩" },
  { code: "ja", label: "日本語",      flag: "🇯🇵" },
  { code: "ko", label: "한국어",      flag: "🇰🇷" },
  { code: "zh", label: "中文",        flag: "🇨🇳" },
];

const T: Record<Lang, {
  tagline: string; subtitle: string; signin: string;
  username: string; userplaceholder: string;
  password: string; passplaceholder: string;
  remember: string; signinBtn: string; signingIn: string;
  footer: string; secured: string; error: string;
}> = {
  en: {
    tagline: "Industrial IoT Monitoring Platform",
    subtitle: "Operator Sign In",
    signin: "SIGN IN",
    username: "Operator ID",
    userplaceholder: "Enter your operator ID",
    password: "Password",
    passplaceholder: "Enter your password",
    remember: "Remember me",
    signinBtn: "Sign In",
    signingIn: "Authenticating...",
    footer: "PT Prima Tekindo Tirta Sejahtera",
    secured: "Secured · JWT HS256 · 60 min session",
    error: "Invalid credentials",
  },
  id: {
    tagline: "Platform Monitoring IoT Industrial",
    subtitle: "Masuk Operator",
    signin: "MASUK",
    username: "ID Operator",
    userplaceholder: "Masukkan ID operator Anda",
    password: "Kata Sandi",
    passplaceholder: "Masukkan kata sandi Anda",
    remember: "Ingat saya",
    signinBtn: "Masuk",
    signingIn: "Mengautentikasi...",
    footer: "PT Prima Tekindo Tirta Sejahtera",
    secured: "Aman · JWT HS256 · Sesi 60 menit",
    error: "Kredensial tidak valid",
  },
  ja: {
    tagline: "産業用 IoT モニタリングプラットフォーム",
    subtitle: "オペレーターサインイン",
    signin: "サインイン",
    username: "オペレーター ID",
    userplaceholder: "オペレーター ID を入力",
    password: "パスワード",
    passplaceholder: "パスワードを入力",
    remember: "ログイン状態を保持",
    signinBtn: "サインイン",
    signingIn: "認証中...",
    footer: "PT プリマ テキンド ティルタ セジャテラ",
    secured: "セキュア · JWT HS256 · 60分セッション",
    error: "認証情報が無効です",
  },
  ko: {
    tagline: "산업용 IoT 모니터링 플랫폼",
    subtitle: "운영자 로그인",
    signin: "로그인",
    username: "운영자 ID",
    userplaceholder: "운영자 ID를 입력하세요",
    password: "비밀번호",
    passplaceholder: "비밀번호를 입력하세요",
    remember: "로그인 상태 유지",
    signinBtn: "로그인",
    signingIn: "인증 중...",
    footer: "PT 프리마 테킨도 티르타 세자테라",
    secured: "보안 · JWT HS256 · 60분 세션",
    error: "잘못된 인증 정보",
  },
  zh: {
    tagline: "工业 IoT 监控平台",
    subtitle: "操作员登录",
    signin: "登录",
    username: "操作员 ID",
    userplaceholder: "请输入操作员 ID",
    password: "密码",
    passplaceholder: "请输入密码",
    remember: "记住我",
    signinBtn: "登录",
    signingIn: "正在验证...",
    footer: "PT 普里马 特金多 蒂尔塔 塞贾特拉",
    secured: "安全 · JWT HS256 · 60 分钟会话",
    error: "凭据无效",
  },
};

/* Animated mesh SVG background — mimics ABB wave */
function MeshBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="rg1" cx="30%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#00A3B4" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#080b10" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rg2" cx="80%" cy="70%" r="50%">
          <stop offset="0%" stopColor="#005F8E" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#080b10" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#rg1)" />
      <rect width="100%" height="100%" fill="url(#rg2)" />
      {/* Grid lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={`${i * 5.26}%`} x2="100%" y2={`${i * 5.26}%`}
          stroke="#00A3B4" strokeOpacity="0.04" strokeWidth="1" />
      ))}
      {Array.from({ length: 30 }).map((_, i) => (
        <line key={`v${i}`} x1={`${i * 3.33}%`} y1="0" x2={`${i * 3.33}%`} y2="100%"
          stroke="#00A3B4" strokeOpacity="0.04" strokeWidth="1" />
      ))}
      {/* Diagonal accent */}
      <line x1="0" y1="100%" x2="50%" y2="0" stroke="#00A3B4" strokeOpacity="0.06" strokeWidth="1" />
      <line x1="20%" y1="100%" x2="70%" y2="0" stroke="#00A3B4" strokeOpacity="0.04" strokeWidth="1" />
    </svg>
  );
}

export default function LoginClient() {
  const [phase, setPhase]           = useState<Phase>("logo");
  const [visibleLines, setVisible]  = useState(0);
  const [progress, setProgress]     = useState(0);
  const [showPass, setShowPass]     = useState(false);
  const [lang, setLang]             = useState<Lang>("en");
  const [langOpen, setLangOpen]     = useState(false);
  const [remember, setRemember]     = useState(true);
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const langRef = useRef<HTMLDivElement>(null);

  const t = T[lang];
  const currentLang = LANGS.find(l => l.code === lang)!;

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

  /* close lang dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── SPLASH ─────────────────────────────────────────────── */
  if ((phase as string) !== "login") return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#080b10" }}>
      <MeshBackground />

      <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)" }} />

      {/* top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-2 border-b z-10"
        style={{ borderColor: "#1a2235", background: "#060810ee" }}>
        <span className="text-[9px] tracking-[.25em] text-[#a0c0d0] font-bold">PTTS · INDUSTRIAL IOT PLATFORM</span>
        <span className="text-[9px] tracking-[.25em] text-[#00e676] font-bold animate-blink">■ CONNECTING</span>
      </div>

      <div className="relative z-10 flex flex-col items-center">
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
          <p className="text-[9px] tracking-[.4em] text-[#00A3B4] font-bold mb-1.5 animate-flicker">
            PT PRIMA TEKINDO TIRTA SEJAHTERA
          </p>
          <h1 className="text-3xl font-bold tracking-[.18em] text-white mb-1 drop-shadow-md">SMARTSENSOR</h1>
          <p className="text-[10px] tracking-[.25em] text-[#8aacc0] font-bold">INDUSTRIAL IOT MONITORING SYSTEM</p>
        </div>

        {/* Init lines */}
        {["init","bar","ready"].includes(phase) && (
          <div className="font-mono text-[11px] space-y-1.5 mb-6 w-96">
            {INIT_LINES.slice(0, visibleLines).map((ln, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-up">
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold text-[#00A3B4]"
                  style={{ background: "#00A3B415", border: "1px solid #00A3B450" }}>
                  {ln.tag}
                </span>
                <span className="flex-1 text-[#c8d8e8] font-mono">{ln.text}</span>
                {i < visibleLines - 1 || phase !== "init"
                  ? <span className="text-[#00e676] text-[10px] font-bold">OK</span>
                  : <span className="text-white animate-blink">_</span>}
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
              <span className="text-[9px] text-[#8aacc0] font-bold tracking-widest">
                {phase === "ready" ? "SYSTEM READY" : "LOADING..."}
              </span>
              <span className="text-[9px] text-[#00e676] font-bold">{progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 py-2 border-t z-10"
        style={{ borderColor: "#1a2235", background: "#060810ee" }}>
        <span className="text-[9px] text-[#6b8b9e] font-bold tracking-widest">v0.7.0</span>
        <span className="text-[9px] text-[#6b8b9e] font-bold tracking-widest">SESSION SECURED · JWT HS256</span>
      </div>
    </div>
  );

  /* ── LOGIN FORM (ABB-inspired split layout) ──────────────── */
  return (
    <div className="fixed inset-0 flex animate-slide-in overflow-hidden" style={{ background: "#080b10" }}>

      {/* ── LEFT PANEL — branding / mesh ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden p-10"
        style={{ background: "#060911" }}>
        <MeshBackground />

        {/* Top-left: logo + company */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
            style={{ border: "1px solid #00A3B430", background: "#0d1628" }}>
            <img src={LOGO} alt="PTTS" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <p className="text-[9px] tracking-[.3em] text-[#00A3B4] font-bold">PT PRIMA TEKINDO TIRTA SEJAHTERA</p>
            <p className="text-[8px] tracking-[.2em] text-[#4a6070] font-bold">ABB AUTHORIZED PARTNER</p>
          </div>
        </div>

        {/* Center: hero text */}
        <div className="relative z-10">
          <div className="w-8 h-0.5 mb-6" style={{ background: "#CC0000" }} />
          <h1 className="text-4xl font-bold text-white leading-tight mb-3 tracking-tight">
            SmartSensor™<br />
            <span style={{ color: "#00A3B4" }}>Industrial IoT</span><br />
            Platform
          </h1>
          <p className="text-sm text-[#6b8b9e] leading-relaxed max-w-xs">
            {t.tagline}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {["ABB SmartSensor", "RONDS", "MQTT", "SCADA/HMI", "PostgreSQL"].map(tag => (
              <span key={tag} className="text-[9px] px-2 py-1 rounded-sm font-bold tracking-wider"
                style={{ background: "#00A3B410", border: "1px solid #00A3B430", color: "#00A3B4" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom: version */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="led led-online" style={{ width: 6, height: 6 }} />
            <span className="text-[9px] text-[#00e676] font-bold tracking-widest">SYSTEM ONLINE</span>
          </div>
          <p className="text-[9px] text-[#4a6070] font-bold tracking-widest">v0.7.0 · {t.secured}</p>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex flex-col relative" style={{ background: "#0c1018" }}>

        {/* Top bar: language selector */}
        <div className="flex items-center justify-end px-8 py-4 border-b"
          style={{ borderColor: "#1a2235" }}>

          {/* Mobile: logo */}
          <div className="lg:hidden flex items-center gap-2 mr-auto">
            <div className="w-7 h-7 rounded-full overflow-hidden" style={{ background: "#0d1628", border: "1px solid #00A3B430" }}>
              <img src={LOGO} alt="PTTS" className="w-full h-full object-contain p-0.5" />
            </div>
            <span className="text-[9px] tracking-widest text-[#00A3B4] font-bold">PTTS SMARTSENSOR</span>
          </div>

          {/* Language picker */}
          <div className="relative" ref={langRef}>
            <button onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-[11px] font-bold tracking-wider transition-colors"
              style={{ border: "1px solid #1a2235", color: "#8aacc0", background: langOpen ? "#1a2235" : "transparent" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span>{currentLang.flag} {currentLang.label}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: langOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-sm shadow-xl z-50 overflow-hidden animate-fade-up"
                style={{ background: "#111520", border: "1px solid #242d3f" }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-[11px] font-bold tracking-wider transition-colors text-left"
                    style={{
                      color: lang === l.code ? "#00A3B4" : "#8aacc0",
                      background: lang === l.code ? "#00A3B410" : "transparent",
                      borderBottom: "1px solid #1a2235",
                    }}>
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                    {lang === l.code && (
                      <svg className="ml-auto" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-full max-w-sm">

            {/* Header */}
            <div className="mb-8">
              <div className="w-6 h-0.5 mb-4" style={{ background: "#CC0000" }} />
              <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                SmartSensor™
              </h2>
              <p className="text-sm text-[#6b8b9e]">{t.subtitle}</p>
            </div>

            {/* Error */}
            {state?.error && (
              <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-sm mb-4 animate-fade-up"
                style={{ background: "#CC000015", border: "1px solid #CC000040", color: "#ff6b6b" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{state.error}</span>
              </div>
            )}

            {/* Form */}
            <form action={formAction} className="space-y-4">

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 tracking-wider" style={{ color: "#8aacc0" }}>
                  {t.username.toUpperCase()}
                </label>
                <div className="relative">
                  <input type="text" name="username" autoComplete="username"
                    required maxLength={64} placeholder={t.userplaceholder}
                    className="w-full px-4 py-3 text-sm rounded-sm outline-none transition-all"
                    style={{
                      background: "#080b10",
                      border: "1px solid #242d3f",
                      color: "white",
                      fontFamily: "inherit",
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = "#00A3B4";
                      e.target.style.boxShadow = "0 0 0 2px #00A3B420";
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = "#242d3f";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a6070]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 tracking-wider" style={{ color: "#8aacc0" }}>
                  {t.password.toUpperCase()}
                </label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} name="password"
                    autoComplete="current-password" required maxLength={64}
                    placeholder={t.passplaceholder}
                    className="w-full px-4 py-3 text-sm rounded-sm outline-none transition-all pr-20"
                    style={{
                      background: "#080b10",
                      border: "1px solid #242d3f",
                      color: "white",
                      fontFamily: "inherit",
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = "#00A3B4";
                      e.target.style.boxShadow = "0 0 0 2px #00A3B420";
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = "#242d3f";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-widest transition-colors"
                    style={{ color: "#4a6070" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#00A3B4")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#4a6070")}>
                    {showPass ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => setRemember(!remember)}
                  className="w-4 h-4 rounded-sm flex-shrink-0 flex items-center justify-center transition-all"
                  style={{
                    background: remember ? "#00A3B4" : "transparent",
                    border: `1px solid ${remember ? "#00A3B4" : "#242d3f"}`,
                  }}>
                  {remember && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
                      fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
                <span className="text-xs" style={{ color: "#6b8b9e" }}>{t.remember}</span>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isPending}
                className="w-full py-3 text-sm font-bold tracking-[.1em] rounded-sm transition-all disabled:opacity-60 mt-2"
                style={{
                  background: isPending ? "#003F5C" : "#CC0000",
                  color: "#fff",
                  border: "none",
                  letterSpacing: "0.08em",
                }}
                onMouseEnter={e => { if (!isPending) e.currentTarget.style.background = "#aa0000"; }}
                onMouseLeave={e => { if (!isPending) e.currentTarget.style.background = "#CC0000"; }}>
                {isPending ? t.signingIn : t.signinBtn}
              </button>
            </form>

            {/* Footer links */}
            <div className="mt-6 pt-4 border-t" style={{ borderColor: "#1a2235" }}>
              <p className="text-[10px] text-center" style={{ color: "#4a6070" }}>
                {t.footer}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-8 py-3 border-t"
          style={{ borderColor: "#1a2235" }}>
          <span className="text-[9px] font-bold tracking-widest" style={{ color: "#4a6070" }}>v0.7.0</span>
          <div className="flex items-center gap-1.5">
            <span className="led led-online" style={{ width: 5, height: 5 }} />
            <span className="text-[9px] font-bold tracking-widest" style={{ color: "#4a6070" }}>JWT HS256</span>
          </div>
        </div>
      </div>
    </div>
  );
}
