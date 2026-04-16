"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("ESTABLISHING SECURE DATALINK...");

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    const statusUpdates = [
      { p: 20, s: "LOADING SYSTEM CORE..." },
      { p: 50, s: "CONNECTING TO MQTT BROKER..." },
      { p: 80, s: "INITIALIZING TELEMETRY ENGINE..." },
      { p: 95, s: "SYNCING ASSET REGISTRY..." },
    ];

    const statusTimer = setInterval(() => {
      const update = statusUpdates.find(u => progress >= u.p);
      if (update) setStatus(update.s);
    }, 100);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--bg)] overflow-hidden flex flex-col items-center justify-center font-mono">
      {/* ── Background Grid ── */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
           style={{ 
             backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
             backgroundSize: '40px 40px',
             animation: 'grid-drift 20s linear infinite'
           }} />

      {/* ── Digital Scanner Line ── */}
      <div className="absolute inset-x-0 h-[2px] bg-[var(--ptts-teal)] opacity-50 shadow-[0_0_15px_var(--ptts-teal)] pointer-events-none"
           style={{ animation: 'scan 4s linear infinite' }} />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center space-y-8 animate-fade-in">
        
        {/* Hexagon Logo Placeholder */}
        <div className="relative flex items-center justify-center">
           <div className="absolute inset-0 bg-[var(--ptts)] opacity-20 blur-2xl rounded-full" />
           <div className="w-24 h-24 border-2 border-[var(--ptts)] rounded-lg rotate-45 flex items-center justify-center overflow-hidden">
             <div className="w-16 h-16 border border-[var(--ptts-teal)] -rotate-45 flex items-center justify-center">
                <span className="text-[var(--ptts-teal)] text-2xl font-black -tracking-tighter">PTTS</span>
             </div>
           </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-[0.2em] text-[var(--text-bright)]">
            SMARTSENSOR <span className="text-[var(--ptts-teal)]">v1.3.0</span>
          </h1>
          <p className="text-[9px] tracking-[0.4em] text-[var(--text-faint)] uppercase">
            PT Prima Tekindo Tirta Sejahtera
          </p>
        </div>

        {/* Loading progress */}
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-[8px] tracking-widest text-[var(--ptts-teal)]">
            <span>{status}</span>
            <span>{Math.min(100, Math.floor(progress))}%</span>
          </div>
          <div className="h-[2px] w-full bg-[var(--surface-3)] overflow-hidden">
            <div 
              className="h-full bg-[var(--ptts-teal)] shadow-[0_0_10px_var(--ptts-teal)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[6px] text-[var(--text-faint)] tracking-tighter uppercase">
            <span>System: Stable</span>
            <span>Encryption: AES-256</span>
            <span>Node: PTTS-JKT-01</span>
          </div>
        </div>
      </div>

      {/* ── Corner Decoration ── */}
      <div className="absolute top-8 left-8 border-t border-l border-[var(--border)] w-12 h-12" />
      <div className="absolute top-8 right-8 border-t border-r border-[var(--border)] w-12 h-12" />
      <div className="absolute bottom-8 left-8 border-b border-l border-[var(--border)] w-12 h-12" />
      <div className="absolute bottom-8 right-8 border-b border-r border-[var(--border)] w-12 h-12" />
      
      <div className="absolute bottom-4 text-[7px] text-[var(--text-faint)] tracking-[0.5em] opacity-30">
        © 2026 PTTS INDUSTRIAL IOT PLATFORM · ALL SYSTEMS OPERATIONAL
      </div>
    </div>
  );
}
