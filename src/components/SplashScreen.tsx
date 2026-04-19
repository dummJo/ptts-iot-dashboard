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
    <div className="fixed inset-0 z-[9999] bg-[#03060a] overflow-hidden flex flex-col items-center justify-center font-mono select-none">
      
      {/* ── Ambient Radial Glow ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full" 
          style={{ 
            background: "radial-gradient(circle, rgba(0,163,180,0.06) 0%, rgba(0,0,0,0) 70%)",
            transform: `scale(${progress > 80 ? 1.2 : 0.8})`,
            transition: "transform 2s cubic-bezier(0.16, 1, 0.3, 1)"
          }} 
        />
      </div>

      {/* ── Subtitle Grid Overlay (Korean/SG Digital Standard) ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ 
             backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
             backgroundSize: '48px 48px',
             backgroundPosition: 'center center',
             animation: 'grid-pan 30s linear infinite'
           }} />

      {/* ── Vertical & Horizontal Precision Crosshairs ── */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-[var(--ptts-teal)] opacity-20 -translate-y-1/2 scale-x-0 animate-[scaleX_1.5s_cubic-bezier(0.8,0,0.2,1)_forwards_0.5s]" />
      <div className="absolute left-1/2 top-0 w-px h-full bg-[var(--ptts-teal)] opacity-20 -translate-x-1/2 scale-y-0 animate-[scaleY_1.5s_cubic-bezier(0.8,0,0.2,1)_forwards_0.8s]" />

      <div className="relative z-10 flex flex-col items-center animate-[fade-in_1s_ease-out_forwards]">
        
        {/* ── 3D Geometry / Abstract Brand Architecture ── */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-10">
           {/* Outer Rotating Diamond rings */}
           <div className="absolute inset-0 border border-[var(--ptts-teal)] opacity-10 rounded-full animate-[spin_10s_linear_infinite]" />
           <div className="absolute inset-2 border-[0.5px] border-dashed border-[var(--ptts-teal)] opacity-30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
           
           {/* Center Core */}
           <div className="relative w-20 h-20 bg-[#001018] border border-[var(--ptts-teal)] rotate-45 shadow-[0_0_30px_rgba(0,163,180,0.2)] flex items-center justify-center overflow-hidden transition-all duration-1000"
                style={{ 
                  boxShadow: progress > 80 ? '0 0 50px rgba(0,163,180,0.5)' : '0 0 20px rgba(0,163,180,0.1)'
                }}>
             {/* Dynamic scanline inside the logo */}
             <div className="absolute inset-x-0 top-0 h-[1px] bg-[var(--ptts-teal)] shadow-[0_0_10px_var(--ptts-teal)] animate-[scan_2s_ease-in-out_infinite]" />
             
             <div className="-rotate-45 flex flex-col items-center justify-center">
                <span className="text-[var(--text-bright)] text-base font-bold tracking-[0.3em] opacity-50 mb-1">PTTS</span>
                <div className="w-4 h-0.5 bg-[var(--ptts-teal)]" />
             </div>
           </div>
        </div>

        {/* ── Typography Section ── */}
        <div className="text-center space-y-3 mb-12">
          <div className="overflow-hidden">
            <h1 className="text-3xl md:text-5xl font-black tracking-[0.25em] text-[var(--text-bright)] translate-y-12 animate-[slide-up_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards_1s]">
              SMART<span className="text-[var(--ptts-teal)]">SENSOR</span>
            </h1>
          </div>
          <div className="overflow-hidden">
            <p className="text-base md:text-xs tracking-[0.5em] text-[var(--ptts-teal)] uppercase translate-y-12 animate-[slide-up_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards_1.2s]">
              Industrial IoT Platform <span className="opacity-50">v1.3.0</span>
            </p>
          </div>
        </div>

        {/* ── Advanced Loading Analytics ── */}
        <div className="w-72 md:w-96 space-y-3 opacity-0 animate-[fade-in_1s_ease-out_forwards_1.8s]">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold tracking-widest text-[var(--ptts-teal)] uppercase w-48 truncate">
              {status}
            </span>
            <div className="text-right">
              <span className="text-xs font-mono text-[var(--text-bright)]">
                {formatLocalNumber(progress, 1).padStart(4, "0")}
              </span>
              <span className="text-sm text-[var(--ptts-teal)] ml-1">%</span>
            </div>
          </div>
          
          {/* Progress Bar Container: Glassmorphism standard */}
          <div className="h-1 w-full bg-[#0d1620] overflow-hidden rounded-full border border-[rgba(0,163,180,0.2)]">
            <div 
              className="h-full bg-gradient-to-r from-[var(--ptts)] to-[var(--ptts-teal)] relative"
              style={{ width: `${progress}%`, transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
            >
              {/* Hot head indicator */}
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white opacity-50" />
            </div>
          </div>
          
          <div className="flex justify-between text-base text-[var(--text-faint)] tracking-[0.2em] uppercase font-bold">
            <span className={phase === "authenticate" ? "text-[var(--online)]" : ""}>SEC: SCRYPT-AES</span>
            <span>ENG: WEBSOCKET</span>
            <span>LAT: 12ms</span>
          </div>
        </div>
      </div>

      {/* ── Technical Diagnostics Overlay ── */}
      <div className="absolute top-6 left-8 text-sm tracking-widest text-[var(--text-faint)] opacity-0 animate-[fade-in_2s_ease-out_forwards_2.5s]">
        <p>SYS.UID: 0x8F9A</p>
        <p>MEM.ALLOC: 1024MB</p>
        <p>ENV: PRODUCTION</p>
      </div>

      <div className="absolute top-6 right-8 text-right text-sm tracking-widest text-[var(--text-faint)] opacity-0 animate-[fade-in_2s_ease-out_forwards_2.5s]">
        <p>VIBRATION.ANALYSIS [A]</p>
        <p>THERMAL.SCAN [A]</p>
        <p>AI.DIAGNOSTICS [I]</p>
      </div>

      {/* ── Footer Branding ── */}
      <div className="absolute bottom-5 text-sm text-[var(--text-faint)] tracking-[0.6em] opacity-40 uppercase">
        © 2026 PT Prima Tekindo Tirta Sejahtera
      </div>

      {/* Inject custom highly-reusable keyframes strictly for intro */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scaleX { to { transform: translate(-50%, -50%) scaleX(1); } }
        @keyframes scaleY { to { transform: translate(-50%, -50%) scaleY(1); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scan { 
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes grid-pan { from { background-position: 0 0; } to { background-position: -48px 48px; } }
      `}} />
    </div>
  );
}
