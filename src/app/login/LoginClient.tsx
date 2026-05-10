"use client";
import { useEffect, useState, useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";

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
  en: { sub:"Operator Sign In",    uid:"Operator ID",  uid_ph:"Enter your operator ID",   pwd:"Password",   pwd_ph:"Enter your password",    remember:"Stay signed in", btn:"Sign In",  pending:"Verifying...", footer:"PTTS EdgeCore" },
  id: { sub:"Masuk Operator",      uid:"ID Operator",  uid_ph:"Masukkan ID operator Anda", pwd:"Kata Sandi", pwd_ph:"Masukkan kata sandi",     remember:"Ingat saya",     btn:"Masuk",    pending:"Memverifikasi...", footer:"PTTS EdgeCore" },
  ja: { sub:"オペレーターサインイン", uid:"オペレーター ID", uid_ph:"ID を入力してください",    pwd:"パスワード",  pwd_ph:"パスワードを入力してください", remember:"ログイン状態を保持", btn:"サインイン", pending:"確認中...", footer:"PT プリマ テキンド ティルタ セジャテラ" },
  ko: { sub:"운영자 로그인",          uid:"운영자 ID",     uid_ph:"운영자 ID를 입력하세요",   pwd:"비밀번호",   pwd_ph:"비밀번호를 입력하세요",    remember:"로그인 유지",     btn:"로그인",    pending:"확인 중...", footer:"PT 프리마 테킨도 티르타 세자테라" },
  zh: { sub:"操作员登录",             uid:"操作员 ID",     uid_ph:"请输入操作员 ID",          pwd:"密码",       pwd_ph:"请输入密码",               remember:"保持登录",        btn:"登录",      pending:"验证中...", footer:"PT 普里马 特金多 蒂尔塔 塞贾特拉" },
};

/* ── colour tokens — Theme Aware Layout ─────────────── */
const C = {
  bg:       "var(--bg)",
  bgPanel:  "var(--surface)",
  bgInput:  "var(--surface-2)",
  bgCard:   "var(--surface-3)",
  border:   "var(--border)",      
  borderHi: "var(--ptts-teal)",     
  cream:    "var(--text-bright)",      
  muted:    "var(--text-muted)",      
  faint:    "var(--text-faint)",      
  gold:     "var(--ptts-teal)",      
  goldDim:  "var(--ptts)",      
};

/* ── Digitalization Background Animation ────────────────────── */
function DigitalBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none transition-opacity duration-1000">
      <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] rounded-full blur-[140px] opacity-20 bg-[var(--online)] animate-[pulse_10s_ease-in-out_infinite_alternate]" />
      <div className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] rounded-full blur-[140px] opacity-30 bg-[#007aff] animate-[pulse_12s_ease-in-out_infinite_alternate]" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-10 bg-[var(--ptts-teal)] animate-[pulse_14s_ease-in-out_infinite_alternate]" />
    </div>
  );
}

export default function LoginClient() {
  const [phase, setPhase]  = useState<Phase>("logo");
  const [isExiting, setIsExiting] = useState(false);
  const [lines, setLines]  = useState(0);
  const [pct,   setPct]    = useState(0);
  const [showPw, setShowPw]= useState(false);
  const [lang,  setLang]   = useState<Lang>("en");
  const [open,  setOpen]   = useState(false);
  const [remember, setRem] = useState(true);
  const [state, action, pending] = useActionState(loginAction, null);
  const router = useRouter();
  const dropRef = useRef<HTMLDivElement>(null);
  const t = T[lang];

  useEffect(() => {
    if (state?.success) {
      // ⚡ DUMMVINCI DEFAULT: Set Live Demo as default upon initial login
      localStorage.setItem("ptts-selected-org", "demo-mode");
      router.push("/select-mode");
    }
  }, [state?.success, router]);

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
    ids.push(setTimeout(() => setIsExiting(true), 5400));
    ids.push(setTimeout(() => setPhase("login"),  6000));
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

  /* ── MONOLITHIC SPLASH SEQUENCE ────────────────────────────────────────── */
  if (phase !== "login") return (
    <div
      className={`fixed inset-0 z-[9999] bg-[var(--bg)] overflow-hidden flex flex-col items-center justify-center select-none transition-opacity duration-700 ${isExiting ? "opacity-0" : "opacity-100"}`}
    >
      <div className="flex flex-col items-center gap-10">
        {/* Logo */}
        <div
          className="transition-all duration-[800ms]"
          style={{ opacity: phase === "logo" ? 0 : 0.72, transform: phase === "logo" ? "scale(0.94)" : "scale(1)" }}
        >
          <img src={LOGO} alt="PTTS" className="w-12 h-12 object-contain logo-adaptive" />
        </div>

        {/* Wordmark */}
        <div
          className="text-center space-y-2 transition-all duration-700"
          style={{
            opacity: phase === "logo" ? 0 : 1,
            transform: phase === "logo" ? "translateY(12px)" : "translateY(0)",
          }}
        >
          <h1
            className="text-4xl md:text-6xl"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-bright)", fontWeight: 400 }}
          >
            PTTS EdgeCore
          </h1>
          <p className="text-sm" style={{ color: "var(--text-faint)", letterSpacing: "0.18em" }}>
            Unified Industrial Runtime
          </p>
        </div>

        {/* Progress */}
        <div
          className="w-52 md:w-64 flex flex-col gap-3 transition-opacity duration-500"
          style={{ opacity: (["bar", "ready"] as typeof phase[]).includes(phase) ? 1 : 0 }}
        >
          <div className="h-px w-full overflow-hidden" style={{ background: "var(--border-dim)" }}>
            <div
              className="h-full"
              style={{ width: `${pct}%`, background: "var(--ptts-teal)", transition: "width 0.2s linear" }}
            />
          </div>
          <p className="text-[11px] text-center" style={{ color: "var(--text-faint)", letterSpacing: "0.06em" }}>
            {phase === "ready" ? "System ready" : "Loading workspace…"}
          </p>
        </div>
      </div>

      <div
        className="absolute bottom-8 left-0 right-0 text-center text-[11px] transition-opacity duration-[1000ms] delay-500"
        style={{ color: "var(--text-faint)", opacity: phase === "logo" ? 0 : 0.5 }}
      >
        © 2026 PTTS EdgeCore
      </div>
    </div>
  );

  /* ── APPLE CONCEPT LIQUID GLASS LOGIN FORM ──────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden animate-slide-in" style={{ background: C.bg }}>

      {/* Full-width Immersive Ambient Background Layer */}
      <div className="absolute inset-0 z-0">
        <DigitalBackground />
      </div>

      {/* Monolithic Console Pane */}
      <div className="relative z-10 w-full max-w-[380px] mx-4 p-8 flex flex-col animate-fade-up border border-[var(--border)] bg-[var(--surface-elevated)] shadow-elite"
           style={{ 
             background: 'var(--surface)', 
             backdropFilter: 'blur(32px)',
             WebkitBackdropFilter: 'blur(32px)',
           }}>
           
        {/* Language & Theme Toggle (Top Right) */}
        <div className="absolute top-5 right-6 flex items-center gap-2">
          <ThemeToggle />
          
          <div className="relative" ref={dropRef}>
            <button onClick={() => setOpen(!open)}
              className="flex items-center justify-center w-8 h-8 rounded-none transition-colors"
              style={{
                color: open ? C.gold : C.muted,
                background: open ? C.bgInput : "transparent",
              }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-36 z-50 overflow-hidden shadow-2xl bg-[var(--surface-input)] border border-[var(--border)]">
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
                    className="flex items-center justify-between w-full px-5 py-4 text-[17px] font-bold transition-colors text-left border-b border-[var(--border-dim)] last:border-0"
                    style={{
                      color:      lang === l.code ? C.gold  : C.muted,
                      background: lang === l.code ? "rgba(255,255,255,0.05)" : "transparent",
                    }}>
                    <span>{l.label}</span>
                    <span className="font-normal text-sm opacity-60">{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Brand Identity Header */}
        <div className="flex flex-col items-center mb-8 mt-2">
          <div className="w-14 h-14 overflow-hidden flex-shrink-0 mb-4 border border-[var(--border)] bg-[var(--surface-inset)] flex items-center justify-center shadow-lg"
               style={{ backdropFilter: 'blur(20px)' }}>
            <img src={LOGO} alt="PTTS" className="w-8 h-8 object-contain logo-adaptive opacity-90" />
          </div>
          <h1 className="text-[32px] font-extrabold tracking-tight text-center" style={{ color: C.cream, fontFamily: 'var(--font-inter)' }}>
            IOT DASHBOARD
          </h1>
          <p className="text-[15px] mt-2 font-medium text-center opacity-80" style={{ color: C.muted }}>
            {t.sub}
          </p>
        </div>

        {/* Error Notification */}
        {state?.error && (
          <div className="flex items-center gap-3 px-4 py-3 mb-6 animate-fade-up shadow-sm"
            style={{ 
              background: "rgba(220, 38, 38, 0.05)", 
              border: `1px solid rgba(220, 38, 38, 0.2)`, 
              color: "var(--fault)", 
            }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span className="text-[14px] font-semibold">{state.error}</span>
          </div>
        )}

        <form action={action} className="space-y-6">
          
          {/* Apple-style Soft Inputs Container */}
          <div className="space-y-4">
            
            {/* Username */}
            <div className="relative group">
              <input type="text" name="username" autoComplete="username"
                required maxLength={64} placeholder={t.uid_ph}
                className="w-full px-5 py-4 text-[16px] font-semibold outline-none transition-all placeholder-opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid var(--border)`,
                  color: C.cream,
                  boxShadow: 'inset 0 0 15px rgba(0,0,0,0.3)',
                }}
                onFocus={e => { e.target.style.borderColor = C.gold; e.target.style.boxShadow = `0 0 0 3px ${C.gold}20, inset 0 2px 4px rgba(0,0,0,0.02)`; }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border)';       e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.02)"; }}
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <input type={showPw ? "text" : "password"} name="password"
                autoComplete="current-password" required maxLength={64}
                placeholder={t.pwd_ph}
                className="w-full px-5 py-4 pr-12 text-[16px] font-semibold outline-none transition-all placeholder-opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid var(--border)`,
                  color: C.cream,
                  boxShadow: 'inset 0 0 15px rgba(0,0,0,0.3)',
                }}
                onFocus={e => { e.target.style.borderColor = C.gold; e.target.style.boxShadow = `0 0 0 3px ${C.gold}20, inset 0 2px 4px rgba(0,0,0,0.02)`; }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border)';       e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.02)"; }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-none p-2 hover:bg-[rgba(150,150,150,0.1)] transition-colors"
                style={{ color: C.muted }}>
                {showPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-[18px] h-[18px] border flex items-center justify-center transition-all bg-[var(--surface-input)]"
                   style={{ borderColor: remember ? C.gold : 'var(--border-dim)' }}>
                {remember && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                    fill="none" stroke={C.gold} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                <input type="checkbox" className="hidden" checked={remember} onChange={() => setRem(!remember)} />
              </div>
              <span className="text-[14px] font-medium" style={{ color: C.muted }}>{t.remember}</span>
            </label>
            <a href="mailto:adam@ptts.co.id" className="text-[14px] font-semibold hover:opacity-80 transition-opacity" style={{ color: C.gold }}>
              Forgot Password?
            </a>
          </div>

          <button type="submit" disabled={pending}
            className="w-full py-4 text-[15px] tracking-[0.4em] font-bold uppercase transition-all disabled:opacity-30 mt-6 shadow-2xl active:scale-[0.99]"
            style={{
              background: pending ? 'rgba(255,255,255,0.1)' : 'white',
              color: pending ? C.muted : 'black',
              border: "none",
            }}>
            {pending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {t.pending}
              </span>
            ) : t.btn}
          </button>
        </form>

        <div className="mt-10 pt-6 flex flex-col items-center opacity-40" style={{ borderTop: `1px solid var(--border-dim)` }}>
          <p className="text-[10px] tracking-[0.2em] font-bold uppercase" style={{ color: C.muted }}>
            PTTS EdgeCore · v2.0.0
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="w-1 h-1 rounded-full bg-[var(--online)]" />
            <span className="text-[9px] font-bold tracking-widest uppercase opacity-60" style={{ color: C.muted }}>Secure Encryption Active</span>
          </div>
        </div>
      </div>

      {/* Auto Logout Toast */}
      {showInactivityToast && (
        <div className="fixed top-8 right-8 z-50 animate-slide-in flex shadow-2xl" 
          style={{ background: 'var(--surface)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', color: "var(--text)", padding: "16px 20px", borderRadius: "16px" }}>
          <div className="flex-1 mr-4">
            <p className="text-[15px] font-semibold">Session Expired</p>
            <p className="text-[13px] mt-1 opacity-70">For your security, please log in again.</p>
          </div>
          <button onClick={() => setShowInactivityToast(false)} className="self-start opacity-50 hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}
    </div>
  );
}
