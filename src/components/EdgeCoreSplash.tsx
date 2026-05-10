"use client";

import { useEffect, useState } from "react";

const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png";

const STATUS_LINES = [
  { from: 0,  to: 30,  text: "Initializing runtime" },
  { from: 30, to: 65,  text: "Establishing secure channel" },
  { from: 65, to: 92,  text: "Loading workspace" },
  { from: 92, to: 101, text: "Console ready" },
];

export default function EdgeCoreSplash() {
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = sessionStorage.getItem("ptts-edgecore-splash-pending");
    if (pending !== "1") return;
    sessionStorage.removeItem("ptts-edgecore-splash-pending");
    setActive(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const tick = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(tick); return 100; }
        let inc = Math.random() * 9 + 3;
        if (prev > 75) inc = Math.random() * 3 + 1;
        return Math.min(prev + inc, 100);
      });
    }, 90);
    return () => clearInterval(tick);
  }, [active]);

  useEffect(() => {
    if (progress < 100) return;
    const fade = setTimeout(() => setExiting(true), 400);
    const done = setTimeout(() => setActive(false), 900);
    return () => { clearTimeout(fade); clearTimeout(done); };
  }, [progress]);

  if (!active) return null;

  const status = STATUS_LINES.find((l) => progress >= l.from && progress < l.to)?.text ?? "Console ready";

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none transition-opacity duration-500 ${exiting ? "opacity-0" : "opacity-100"}`}
      style={{ background: "var(--bg)" }}
    >
      <div className="flex flex-col items-center gap-10">
        <img
          src={LOGO}
          alt="PTTS"
          className="w-10 h-10 object-contain logo-adaptive"
          style={{ opacity: 0.7 }}
        />

        <div className="text-center space-y-2">
          <h1
            className="text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-bright)", fontWeight: 400 }}
          >
            PTTS EdgeCore
          </h1>
          <p className="text-sm" style={{ color: "var(--text-faint)", letterSpacing: "0.18em" }}>
            Unified Industrial Runtime
          </p>
        </div>

        <div className="w-52 md:w-64 flex flex-col gap-3">
          <div className="h-px w-full overflow-hidden" style={{ background: "var(--border-dim)" }}>
            <div
              className="h-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%`, background: "var(--ptts-teal)" }}
            />
          </div>
          <p className="text-[11px] text-center" style={{ color: "var(--text-faint)", letterSpacing: "0.06em" }}>
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
