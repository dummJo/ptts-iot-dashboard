"use client";

import { useEffect, useState } from "react";
import { formatLocalNumber } from "@/lib/utils";

const STATUS_LINES = [
  { from: 0,  to: 30,  text: "INITIALIZING SENSOR MESH" },
  { from: 30, to: 65,  text: "SYNCING TELEMETRY STREAM" },
  { from: 65, to: 92,  text: "CALIBRATING THRESHOLDS" },
  { from: 92, to: 101, text: "CONSOLE READY" },
];

export default function SmartsensorSplash() {
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = sessionStorage.getItem("ptts-smartsensor-splash-pending");
    if (pending !== "1") return;
    sessionStorage.removeItem("ptts-smartsensor-splash-pending");
    setActive(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const tick = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(tick);
          return 100;
        }
        let inc = Math.random() * 9 + 3;
        if (prev > 75) inc = Math.random() * 3 + 1;
        return Math.min(prev + inc, 100);
      });
    }, 90);
    return () => clearInterval(tick);
  }, [active]);

  useEffect(() => {
    if (progress < 100) return;
    const fade = setTimeout(() => setExiting(true), 350);
    const done = setTimeout(() => setActive(false), 850);
    return () => { clearTimeout(fade); clearTimeout(done); };
  }, [progress]);

  if (!active) return null;

  const status = STATUS_LINES.find((l) => progress >= l.from && progress < l.to)?.text ?? "CONSOLE READY";

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none transition-opacity duration-500 ${exiting ? "opacity-0" : "opacity-100"}`}
      style={{ background: "var(--bg)", fontFamily: "var(--font-inter), sans-serif" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-[700px] h-[700px] rounded-full blur-[150px] opacity-25 bg-[var(--ptts-teal)] animate-[pulse_8s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-0 -right-1/4 w-[700px] h-[700px] rounded-full blur-[150px] opacity-25 bg-[var(--online)] animate-[pulse_10s_ease-in-out_infinite_alternate]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-24 h-24 flex items-center justify-center mb-8 border border-[var(--border-dim)]" style={{ background: "var(--surface)" }}>
          <svg viewBox="0 0 120 80" className="w-16 h-12" fill="none" stroke="var(--ptts-teal)" strokeWidth="1.5" strokeLinecap="square">
            <path d="M2 40 Q14 10 26 40 T50 40 T74 40 T98 40 T120 40" />
            <circle cx="60" cy="40" r="6" fill="var(--ptts-teal)" fillOpacity="0.2" />
            <circle cx="60" cy="40" r="11" strokeOpacity="0.4" />
          </svg>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--ptts-teal)] to-transparent animate-[scan-ss_2.5s_linear_infinite]" />
        </div>

        <h1 className="text-3xl md:text-5xl font-semibold tracking-[0.3em] uppercase text-center" style={{ color: "var(--text-bright)" }}>
          SmartSensor<span className="font-light" style={{ color: "var(--text-faint)" }}>Console</span>
        </h1>
        <div className="flex items-center justify-center gap-3 mt-3 mb-12">
          <span className="w-6 h-[1px]" style={{ background: "var(--ptts-teal)" }} />
          <p className="text-[10px] tracking-[0.6em] uppercase font-bold" style={{ color: "var(--ptts-teal)" }}>
            Condition Monitoring
          </p>
          <span className="w-6 h-[1px]" style={{ background: "var(--ptts-teal)" }} />
        </div>

        <div className="w-72 md:w-96 space-y-4">
          <div className="flex justify-between items-end px-1">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 bg-[var(--ptts-teal)] animate-pulse" />
              <span className="text-[9px] font-bold tracking-[0.4em] uppercase truncate w-56" style={{ color: "var(--text-faint)" }}>
                {status}
              </span>
            </div>
            <span className="text-[10px] font-bold tabular-nums tracking-[0.2em]" style={{ color: "var(--text-bright)" }}>
              {formatLocalNumber(progress, 1)}%
            </span>
          </div>
          <div className="h-[2px] w-full relative overflow-hidden" style={{ background: "var(--border-dim)" }}>
            <div
              className="h-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%`, background: "var(--ptts-teal)" }}
            />
          </div>
          <div className="flex justify-between pt-1 text-[8px] tracking-[0.4em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>
            <span>SENSOR_MESH</span>
            <span>TELEMETRY</span>
            <span>THRESHOLDS</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `@keyframes scan-ss { from { transform: translateY(-24px); } to { transform: translateY(96px); } }`,
      }} />
    </div>
  );
}
