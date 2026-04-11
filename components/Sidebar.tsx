"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "⬡" },
  { href: "/dashboard/assets", label: "Assets", icon: "◈" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "◬", badge: 3 },
  { href: "/dashboard/reports", label: "Reports", icon: "▤" },
  { href: "/dashboard/settings", label: "Settings", icon: "◎" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex flex-col w-56 min-h-screen shrink-0"
      style={{ background: "var(--sidebar-bg)", color: "var(--sidebar-text)" }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1e3048]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-[#005F8E]/50">
            <img
              src="https://media.licdn.com/dms/image/v2/C560BAQEHIaGsptj-6A/company-logo_200_200/company-logo_200_200/0/1630647930854?e=2147483647&v=beta&t=2t_XIZrMUC3hEWzA62Ar3lfts2ZS30oBt4petkGOmLE"
              alt="PTTS"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#00A3B4] uppercase">PTTS</p>
            <p className="text-[9px] leading-none mt-0.5" style={{ color: "var(--sidebar-muted)" }}>
              SmartSensor
            </p>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="px-5 py-2.5 border-b border-[#1e3048]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span className="text-[10px] font-mono" style={{ color: "var(--sidebar-muted)" }}>
            Live · 60s interval
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={
                active
                  ? { background: "#005F8E22", color: "#00A3B4", fontWeight: 600 }
                  : undefined
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] bg-[#CC0000] text-white px-1.5 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Brand tags */}
      <div className="px-4 py-3 border-t border-[#1e3048]">
        <p className="text-[9px] mb-2 font-semibold tracking-widest uppercase" style={{ color: "var(--sidebar-muted)" }}>
          Integrated With
        </p>
        <div className="flex gap-1.5">
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#CC0000]/20 text-[#CC0000]">ABB</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#FFD700]/15 text-[#FFD700]">FLUKE</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#003DA5]/30 text-[#7ba7f7]">SKF</span>
        </div>
      </div>

      {/* User + Logout */}
      <div className="px-3 py-3 border-t border-[#1e3048]">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-[#005F8E]/30 flex items-center justify-center text-[#00A3B4] text-xs font-bold">
            AM
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--sidebar-text)" }}>Adam Muhammad</p>
            <p className="text-[9px]" style={{ color: "var(--sidebar-muted)" }}>Engineer · PTTS</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
