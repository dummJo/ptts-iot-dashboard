"use client";

import { useEffect, useState } from "react";
import { formatLocalNumber } from "@/lib/utils";

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("INITIALIZING KERNEL");
  const [phase, setPhase] = useState("boot"); // boot, authenticate, ready

  useEffect(() => {
    // ── Synthetic progression reflecting a highly optimized boot sequence ──
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setPhase("ready");
          return 100;
        }
        // Snappy, non-linear progress
        let inc = Math.random() * 8 + 2;
        if (prev > 70) inc = Math.random() * 3 + 1; // slow down at the end
        if (prev > 90) inc = Math.random() * 1.5;
        return Math.min(prev + inc, 100);
      });
    }, 150);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress > 15 && progress < 45) setStatus("LINKING ABB CIAM CLOUD...");
    else if (progress >= 45 && progress < 75) {
      setStatus("AUTHENTICATING SEAMLESS BRIDGE...");
      setPhase("authenticate");
    }
    else if (progress >= 75 && progress < 99) setStatus("SYNCING POWERTRAIN TELEMETRY...");
    else if (progress >= 99) setStatus("SYSTEM OPTIMAL. ENGAGING CONSOLE.");
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--bg)] overflow-hidden flex flex-col items-center justify-center select-none" style={{ fontFamily: "var(--font-inter), sans-serif" }}>

      {/* ── Monolithic Depth Layer (V2.0 Aesthetic) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-[1000px] h-[1000px] rounded-full blur-[160px] bg-[var(--surface-elevated)] opacity-80" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,122,255,0.05)_0%,transparent_70%)] opacity-40 animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center animate-[fade-in_1.5s_ease-out_forwards]">

        {/* ── Monolithic Shield (Logo) ── */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-12 bg-[var(--surface-input)] border border-[var(--border-dim)] shadow-[0_0_100px_rgba(255,255,255,0.03)] group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent" />
          <div className="relative w-20 h-20 animate-[fade-up_1s_ease-out_0.2s_forwards] opacity-0 flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <img src="https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png" alt="PTTS" className="w-full h-full object-contain logo-adaptive opacity-100" />
          </div>
          {/* Scanning Line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--border-bright)] to-transparent animate-[scan_3s_linear_infinite]" />
        </div>

        {/* ── Cinematic Branding ── */}
        <div className="text-center space-y-6 mb-24">
          <div className="pb-2 overflow-hidden">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-[0.3em] text-[var(--text-bright)] translate-y-20 animate-[slide-up_1.2s_cubic-bezier(0.16,1,0.3,1)_forwards_0.4s] opacity-0 uppercase">
              Consolidated<span className="text-[var(--text-faint)] font-light">Console</span>
            </h1>
          </div>
          <div className="pb-2 overflow-hidden">
            <div className="flex items-center justify-center gap-4 translate-y-10 animate-[slide-up_1.2s_cubic-bezier(0.16,1,0.3,1)_forwards_0.6s] opacity-0">
              <span className="w-8 h-[1px] bg-[var(--border-bright)]" />
              <p className="text-[10px] md:text-[11px] tracking-[0.8em] text-[var(--text-muted)] uppercase font-bold">
                Unified Ecosystem v2.0
              </p>
              <span className="w-8 h-[1px] bg-[var(--border-bright)]" />
            </div>
          </div>
        </div>

        {/* ── Clinical Loading ── */}
        <div className="w-72 md:w-96 space-y-5 opacity-0 animate-[fade-in_1s_ease-out_forwards_1s]">
          <div className="flex justify-between items-end px-1 mb-1">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-[#007aff] animate-pulse" />
              <span className="text-[9px] font-bold tracking-[0.4em] text-[var(--text-faint)] uppercase w-56 truncate">
                {status}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[var(--text-bright)] tabular-nums tracking-[0.2em]">
                {formatLocalNumber(progress, 1)}%
              </span>
            </div>
          </div>

          {/* Monolithic Progress Bar */}
          <div className="h-[2px] w-full bg-[var(--border-dim)] relative overflow-hidden">
            <div
              className="h-full bg-[var(--text-bright)] transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-[var(--text-bright)] opacity-40 blur-[10px]" />
            </div>
          </div>

          {/* Subdued Metrics Strip */}
          <div className="flex justify-between pt-2 text-[8px] text-[var(--text-faint)] tracking-[0.4em] font-bold uppercase">
            <span className={phase === "authenticate" ? "text-[var(--text-muted)] transition-colors" : ""}>CIAM_BRIDGE</span>
            <span>ABB_GW_SYNC</span>
            <span>POWERTRAIN_V2</span>
          </div>
        </div>
      </div>

      {/* Signature Footer */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-3 opacity-0 animate-[fade-in_2s_ease-out_forwards_1.5s]">
        <p className="text-[10px] text-[var(--text-faint)] tracking-[0.5em] uppercase font-bold">
          © 2026 PTTS Industrial
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-[var(--text-faint)] tracking-[0.3em] uppercase">Authored By</span>
          <span className="text-[9px] text-[#007aff] tracking-[0.3em] uppercase font-bold">DummVinci</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scan { from { transform: translateY(-32px); } to { transform: translateY(128px); } }
      `}} />
    </div>
  );
}
