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
  return null;
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

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "var(--bg)" }}>

      {/* Login card */}
      <div className="w-full max-w-sm mx-5 p-8 flex flex-col" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

        {/* Controls */}
        <div className="flex justify-end gap-2 mb-7">
          <ThemeToggle />
          <div className="relative" ref={dropRef}>
            <button onClick={() => setOpen(!open)}
              className="w-8 h-8 flex items-center justify-center transition-colors"
              style={{ color: open ? "var(--ptts-teal)" : "var(--text-faint)", background: open ? "var(--surface-2)" : "transparent" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-1 w-36 z-50 overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
                    className="flex items-center justify-between w-full px-4 py-3 text-sm transition-colors text-left"
                    style={{ color: lang === l.code ? "var(--ptts-teal)" : "var(--text-muted)", background: lang === l.code ? "var(--surface-2)" : "transparent", borderBottom: "1px solid var(--border-dim)" }}>
                    <span className="font-semibold">{l.label}</span>
                    <span className="text-xs opacity-60">{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <img src={LOGO} alt="PTTS" className="w-10 h-10 object-contain logo-adaptive mb-5" style={{ opacity: 0.75 }} />
          <h1 className="text-3xl md:text-4xl text-center" style={{ fontFamily: "var(--font-serif)", color: "var(--text-bright)", fontWeight: 400 }}>
            PTTS EdgeCore
          </h1>
          <p className="text-sm mt-2 text-center" style={{ color: "var(--text-faint)", letterSpacing: "0.06em" }}>
            {t.sub}
          </p>
        </div>

        {/* Error */}
        {state?.error && (
          <div className="flex items-center gap-3 px-4 py-3 mb-5" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", color: "var(--fault)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span className="text-sm font-medium">{state.error}</span>
          </div>
        )}

        <form action={action} className="space-y-3">
          {/* Username */}
          <input type="text" name="username" autoComplete="username"
            required maxLength={64} placeholder={t.uid_ph}
            className="w-full px-4 py-3 text-sm outline-none transition-colors"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-bright)" }}
            onFocus={e => e.currentTarget.style.borderColor = "var(--ptts-teal)"}
            onBlur={e  => e.currentTarget.style.borderColor = "var(--border)"}
          />

          {/* Password */}
          <div className="relative">
            <input type={showPw ? "text" : "password"} name="password"
              autoComplete="current-password" required maxLength={64} placeholder={t.pwd_ph}
              className="w-full px-4 py-3 pr-11 text-sm outline-none transition-colors"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-bright)" }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--ptts-teal)"}
              onBlur={e  => e.currentTarget.style.borderColor = "var(--border)"}
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-opacity hover:opacity-100 opacity-50"
              style={{ color: "var(--text-muted)" }}>
              {showPw ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="w-4 h-4 border flex items-center justify-center transition-colors"
                style={{ borderColor: remember ? "var(--ptts-teal)" : "var(--border)", background: remember ? "var(--ptts-teal)" : "transparent" }}>
                {remember && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                <input type="checkbox" className="hidden" checked={remember} onChange={() => setRem(!remember)} />
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t.remember}</span>
            </label>
            <a href="mailto:adam@ptts.co.id" className="text-xs transition-opacity hover:opacity-80" style={{ color: "var(--ptts-teal)" }}>
              Forgot password?
            </a>
          </div>

          <button type="submit" disabled={pending}
            className="w-full py-3 text-sm font-semibold transition-opacity disabled:opacity-40 mt-1"
            style={{ background: "var(--text-bright)", color: "var(--bg)", border: "none" }}>
            {pending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t.pending}
              </span>
            ) : t.btn}
          </button>
        </form>

        <div className="mt-8 pt-5 text-center" style={{ borderTop: "1px solid var(--border-dim)" }}>
          <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>PTTS EdgeCore · v2.0.0</p>
        </div>
      </div>

      {/* Inactivity toast */}
      {showInactivityToast && (
        <div className="fixed top-6 right-6 z-50 flex shadow-lg"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", padding: "14px 18px" }}>
          <div className="flex-1 mr-4">
            <p className="text-sm font-semibold">Session Expired</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>For your security, please log in again.</p>
          </div>
          <button onClick={() => setShowInactivityToast(false)} className="self-start opacity-40 hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
