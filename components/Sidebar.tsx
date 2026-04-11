"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "⬡" },
  { href: "/dashboard/assets", label: "Assets", icon: "◈" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "◬" },
  { href: "/dashboard/reports", label: "Reports", icon: "▤" },
  { href: "/dashboard/settings", label: "Settings", icon: "◎" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex flex-col w-56 min-h-screen bg-[#1a1814] text-[#e8e2d6] shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#2a2620]">
        <div className="flex items-center gap-3">
          <img
            src="https://media.licdn.com/dms/image/v2/C560BAQEHIaGsptj-6A/company-logo_200_200/company-logo_200_200/0/1630647930854?e=2147483647&v=beta&t=2t_XIZrMUC3hEWzA62Ar3lfts2ZS30oBt4petkGOmLE"
            alt="PTTS"
            className="w-8 h-8 rounded"
          />
          <div>
            <p className="text-xs font-semibold text-[#c9a96e] tracking-widest uppercase">PTTS</p>
            <p className="text-[10px] text-[#6b6560] leading-none mt-0.5">SmartSensor</p>
          </div>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "bg-[#c9a96e]/15 text-[#c9a96e] font-medium"
                  : "text-[#9a9390] hover:text-[#e8e2d6] hover:bg-white/5"
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
              {item.label === "Alerts" && (
                <span className="ml-auto text-[10px] bg-[#ef4444] text-white px-1.5 py-0.5 rounded-full font-semibold">3</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-5 py-4 border-t border-[#2a2620]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#c9a96e]/20 flex items-center justify-center text-[#c9a96e] text-xs font-bold">AM</div>
          <div>
            <p className="text-xs font-medium text-[#e8e2d6]">Adam Muhammad</p>
            <p className="text-[10px] text-[#6b6560]">Engineer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
