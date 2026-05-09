"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";

const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png";

function AmbientBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] rounded-full blur-[140px] opacity-20 bg-[var(--online)] animate-[pulse_10s_ease-in-out_infinite_alternate]" />
      <div className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] rounded-full blur-[140px] opacity-30 bg-[#007aff] animate-[pulse_12s_ease-in-out_infinite_alternate]" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] opacity-10 bg-[var(--ptts-teal)] animate-[pulse_14s_ease-in-out_infinite_alternate]" />
    </div>
  );
}

function ConditionIcon() {
  return (
    <svg viewBox="0 0 120 80" className="w-28 h-16 md:w-32 md:h-20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <path d="M2 40 Q14 10 26 40 T50 40 T74 40 T98 40 T120 40" strokeOpacity="0.85" />
      <circle cx="60" cy="40" r="6" fill="currentColor" fillOpacity="0.15" />
      <circle cx="60" cy="40" r="11" strokeOpacity="0.35" />
      <circle cx="60" cy="40" r="17" strokeOpacity="0.18" />
      <line x1="60" y1="22" x2="60" y2="14" />
      <line x1="60" y1="58" x2="60" y2="66" />
    </svg>
  );
}

function OperationsIcon() {
  return (
    <svg viewBox="0 0 120 80" className="w-28 h-16 md:w-32 md:h-20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <rect x="6" y="20" width="36" height="40" strokeOpacity="0.85" />
      <circle cx="24" cy="40" r="11" strokeOpacity="0.7" />
      <line x1="24" y1="29" x2="24" y2="51" strokeOpacity="0.6" />
      <line x1="13" y1="40" x2="35" y2="40" strokeOpacity="0.6" />
      <line x1="16.2" y1="32.2" x2="31.8" y2="47.8" strokeOpacity="0.6" />
      <line x1="31.8" y1="32.2" x2="16.2" y2="47.8" strokeOpacity="0.6" />
      <path d="M42 40 H58" strokeOpacity="0.5" strokeDasharray="3 3" />
      <rect x="58" y="24" width="56" height="32" strokeOpacity="0.85" />
      <text x="86" y="44" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor" stroke="none" letterSpacing="2">VSD</text>
      <line x1="64" y1="60" x2="64" y2="68" />
      <line x1="86" y1="60" x2="86" y2="68" />
      <line x1="108" y1="60" x2="108" y2="68" />
      <line x1="60" y1="68" x2="112" y2="68" strokeOpacity="0.6" />
    </svg>
  );
}

function AutomationIcon() {
  return (
    <svg viewBox="0 0 120 80" className="w-28 h-16 md:w-32 md:h-20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <rect x="4" y="30" width="28" height="20" strokeOpacity="0.85" />
      <rect x="46" y="14" width="28" height="20" strokeOpacity="0.85" />
      <rect x="46" y="46" width="28" height="20" strokeOpacity="0.85" />
      <rect x="88" y="30" width="28" height="20" strokeOpacity="0.85" />
      <path d="M32 40 L46 24" strokeOpacity="0.55" />
      <path d="M32 40 L46 56" strokeOpacity="0.55" />
      <path d="M74 24 L88 40" strokeOpacity="0.55" />
      <path d="M74 56 L88 40" strokeOpacity="0.55" />
      <circle cx="18" cy="40" r="2" fill="currentColor" stroke="none" />
      <circle cx="60" cy="24" r="2" fill="currentColor" stroke="none" />
      <circle cx="60" cy="56" r="2" fill="currentColor" stroke="none" />
      <circle cx="102" cy="40" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FabricIcon() {
  return (
    <svg viewBox="0 0 120 80" className="w-28 h-16 md:w-32 md:h-20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <circle cx="60" cy="40" r="6"  fill="currentColor" fillOpacity="0.2" strokeOpacity="0.9" />
      <circle cx="20" cy="20" r="5"  strokeOpacity="0.85" />
      <circle cx="100" cy="20" r="5" strokeOpacity="0.85" />
      <circle cx="20" cy="60" r="5"  strokeOpacity="0.85" />
      <circle cx="100" cy="60" r="5" strokeOpacity="0.85" />
      <circle cx="60" cy="10" r="4"  strokeOpacity="0.7" />
      <circle cx="60" cy="70" r="4"  strokeOpacity="0.7" />
      <line x1="20" y1="20" x2="60" y2="40" strokeOpacity="0.5" />
      <line x1="100" y1="20" x2="60" y2="40" strokeOpacity="0.5" />
      <line x1="20" y1="60" x2="60" y2="40" strokeOpacity="0.5" />
      <line x1="100" y1="60" x2="60" y2="40" strokeOpacity="0.5" />
      <line x1="60" y1="14" x2="60" y2="34" strokeOpacity="0.5" />
      <line x1="60" y1="46" x2="60" y2="66" strokeOpacity="0.5" />
    </svg>
  );
}

interface ModeCardProps {
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  onSelect: () => void;
  delay: number;
}

function ModeCard({ tag, title, subtitle, description, icon, accent, onSelect, delay }: ModeCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col items-stretch text-left w-full p-6 md:p-7 transition-colors duration-300 outline-none"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 30px 80px -40px rgba(0,0,0,0.6)",
      }}
    >
      <span
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300"
        style={{ border: `1px solid ${accent}`, boxShadow: `0 0 0 1px ${accent}33, 0 0 60px -10px ${accent}66 inset` }}
      />
      <div className="absolute top-0 left-0 w-full h-[2px] opacity-70" style={{ background: accent }} />

      <div className="flex items-center justify-between mb-4">
        <span className="text-[9px] tracking-[0.4em] font-bold" style={{ color: "var(--text-faint)" }}>
          {tag}
        </span>
        <span className="text-[9px] tracking-[0.3em] font-bold uppercase" style={{ color: accent }}>
          ENTER ›
        </span>
      </div>

      <div className="flex items-center justify-center h-24 md:h-28 mb-5" style={{ color: accent }}>
        {icon}
      </div>

      <h2 className="text-xl md:text-2xl font-semibold tracking-[0.16em] uppercase" style={{ color: "var(--text-bright)" }}>
        {title}
      </h2>
      <p className="text-[10px] tracking-[0.4em] uppercase font-bold mt-2" style={{ color: accent }}>
        {subtitle}
      </p>

      <div className="my-4 h-[1px] w-full" style={{ background: "var(--border-dim)" }} />

      <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
    </motion.button>
  );
}

export default function ModeSelector() {
  const router = useRouter();

  const goCondition = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ptts-edgecore-splash-pending", "1");
    }
    router.push("/console/condition");
  };

  const goOperations  = () => router.push("/console/operations");
  const goAutomation  = () => router.push("/console/automation");
  const goEdgeFabric  = () => router.push("/console/devices");

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{ background: "var(--bg)", fontFamily: "var(--font-inter), sans-serif" }}
    >
      <AmbientBackground />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5 border-b border-[var(--border-dim)]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center bg-[var(--surface-input,var(--surface))] border border-[var(--border-dim)]">
            <img src={LOGO} alt="PTTS" className="w-7 h-7 object-contain logo-adaptive" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] tracking-[0.4em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>
              PTTS · EdgeCore Runtime
            </span>
            <span className="text-xs md:text-sm tracking-[0.3em] font-bold uppercase" style={{ color: "var(--text-bright)" }}>
              Select EdgeCore Domain
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-14"
        >
          <p className="text-[10px] md:text-[11px] tracking-[0.6em] uppercase font-bold mb-3" style={{ color: "var(--ptts-teal)" }}>
            Authenticated · Choose Domain
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--text-bright)" }}>
            EdgeCore Domains
          </h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="w-8 h-[1px]" style={{ background: "var(--border-bright,var(--border))" }} />
            <span className="text-[9px] md:text-[10px] tracking-[0.5em] uppercase font-bold" style={{ color: "var(--text-muted)" }}>
              Four Pillars · One Runtime
            </span>
            <span className="w-8 h-[1px]" style={{ background: "var(--border-bright,var(--border))" }} />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6 w-full max-w-7xl">
          <ModeCard
            tag="DOMAIN 01 · CONDITION"
            title="Condition Intelligence"
            subtitle="Predictive Asset Health"
            description="Vibration, temperature and RMS telemetry across the asset fleet. FFT analysis, anomaly detection and lifecycle insights."
            icon={<ConditionIcon />}
            accent="var(--ptts-teal)"
            onSelect={goCondition}
            delay={0.10}
          />
          <ModeCard
            tag="DOMAIN 02 · RUNTIME"
            title="Live Operations"
            subtitle="Industrial Process Runtime"
            description="Live multipump orchestration with ABB VSDs. Pressure, flow, energy and lead-lag sequencing in one console."
            icon={<OperationsIcon />}
            accent="#007aff"
            onSelect={goOperations}
            delay={0.20}
          />
          <ModeCard
            tag="DOMAIN 03 · LOGIC"
            title="Automation Studio"
            subtitle="Visual Workflow Engine"
            description="Node-based automation. Inputs, logic, AI predict and outputs across protocols, drives and notifications."
            icon={<AutomationIcon />}
            accent="#9b88ff"
            onSelect={goAutomation}
            delay={0.30}
          />
          <ModeCard
            tag="DOMAIN 04 · FABRIC"
            title="Edge Fabric"
            subtitle="Device & Protocol Layer"
            description="Unified device registry and protocol abstraction. Modbus, BACnet, OPC-UA, MQTT — discovered, normalized and live."
            icon={<FabricIcon />}
            accent="#f5a623"
            onSelect={goEdgeFabric}
            delay={0.40}
          />
        </div>
      </main>

      <footer className="relative z-10 px-6 md:px-10 py-5 border-t border-[var(--border-dim)] flex flex-col md:flex-row items-center justify-between gap-2">
        <p className="text-[9px] tracking-[0.4em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>
          © 2026 PTTS EdgeCore · Unified Industrial Runtime v2.0
        </p>
        <p className="text-[9px] tracking-[0.4em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>
          Authored by <span style={{ color: "#007aff" }}>DummVinci</span>
        </p>
      </footer>
    </div>
  );
}
