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
    if (progress > 15 && progress < 45) setStatus("BUILDING NEURAL MESH...");
    else if (progress >= 45 && progress < 75) {
      setStatus("SYMMETRIC KEY EXCHANGE: SCRYPT-AES INITIALIZED...");
      setPhase("authenticate");
    }
    else if (progress >= 75 && progress < 99) setStatus("CALIBRATING ASSET TELEMETRY...");
    else if (progress >= 99) setStatus("SYSTEM OPTIMAL. ENGAGING INTERFACE.");
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#000000] overflow-hidden flex flex-col items-center justify-center select-none" style={{ fontFamily: "var(--font-inter), sans-serif" }}>

      {/* ── Apple Style Ambient Blur Gradients (Vibrant) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] rounded-full blur-[140px] bg-[#007aff] opacity-40 animate-[pulse_10s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] rounded-full blur-[140px] bg-[#32ade6] opacity-40 animate-[pulse_12s_ease-in-out_infinite_alternate]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] bg-[#5856d6] opacity-20 animate-[pulse_15s_ease-in-out_infinite_alternate]" />
      </div>

      <div className="relative z-10 flex flex-col items-center animate-[fade-in_1s_ease-out_forwards]">

        {/* ── Monolithic Precision Logo ── */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-10 group bg-white/5 border border-white/10 shadow-elite">
          <div className="relative w-16 h-16 animate-[fade-up_1s_ease-out_0.2s_forwards] opacity-0 flex items-center justify-center">
            <img src="https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png" alt="PTTS" className="w-full h-full object-contain brightness-0 invert opacity-90" />
          </div>
        </div>

        {/* ── Cinematic Typography ── */}
        <div className="text-center space-y-4 mb-20">
          <div className="pb-4 overflow-hidden">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-[0.2em] text-[#f5f5f7] translate-y-16 animate-[slide-up_1s_cubic-bezier(0.16,1,0.3,1)_forwards_0.4s] opacity-0">
              SMART<span className="text-[#86868b] font-light">SENSOR</span>
            </h1>
          </div>
          <div className="pb-2 overflow-hidden">
            <p className="text-sm md:text-base tracking-[0.6em] text-[#a1a1a6] uppercase translate-y-8 animate-[slide-up_1s_cubic-bezier(0.16,1,0.3,1)_forwards_0.6s] opacity-0">
              Industrial IoT Platform
            </p>
          </div>
        </div>

        {/* ── Apple-Style Loading Indicator ── */}
        <div className="w-64 md:w-80 space-y-4 opacity-0 animate-[fade-in_1s_ease-out_forwards_1s]">
          <div className="flex justify-between items-end px-1">
            <span className="text-[10px] font-semibold tracking-widest text-[#a1a1a6] uppercase w-48 truncate">
              {status}
            </span>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-[#f5f5f7] tabular-nums tracking-widest">
                {formatLocalNumber(progress, 1)}%
              </span>
            </div>
          </div>

          {/* Progress Bar Container: Monolithic Bar */}
          <div className="h-1 w-full bg-white/5 overflow-hidden backdrop-blur-md border border-white/10">
            <div
              className="h-full bg-white relative"
              style={{ width: `${progress}%`, transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              {/* Shine effect */}
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-r from-transparent to-white opacity-40" />
            </div>
          </div>

          {/* Subdued metrics blending into background */}
          <div className="flex justify-between pt-2 text-[9px] text-[#86868b] tracking-[0.2em] font-medium font-mono uppercase">
            <span className="opacity-60 transition-opacity" style={{ opacity: phase === "authenticate" ? 1 : 0.6 }}>SCRYPT-AES</span>
            <span className="opacity-60">WEBSOCKET</span>
            <span className="opacity-60">12MS LATENCY</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center text-[9px] text-[#86868b] tracking-[0.4em] uppercase font-medium opacity-0 animate-[fade-in_2s_ease-out_forwards_1.5s]">
        © 2026 By DummVinci
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}} />
    </div>
  );
}
