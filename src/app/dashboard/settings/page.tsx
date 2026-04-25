"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { createUserAction } from "@/app/actions/auth";
import { apiClient } from "@/lib/apiClient";

/**
 * CORE COMMAND CONFIGURATION — INDUSTRIAL OS KERNEL
 * Architecture: Monolithic System Control
 */

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState({
    smartSensorPTTS: "",
    smartSensorRonds: "",
  });
  const [activeKeyTab, setActiveKeyTab] = useState<"smartSensorRonds">("smartSensorRonds");
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tab, setTab] = useState<"swagger" | "api" | "users" | "notifications">("swagger");
  const [notifications, setNotifications] = useState({
    telegramToken: "", telegramChatId: "", whatsappApiUrl: "", whatsappToken: "", isNotifyEnabled: true
  });
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "operator" });
  const [userCreated, setUserCreated] = useState<{ success: boolean; message: string } | null>(null);
  const [users, setUsers] = useState<Array<{ username: string; hash: string; role: string }>>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("operator");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState<string>("");

  useEffect(() => {
    async function init() {
      try {
        const session = await apiClient.getCurrentSession();
        if (session?.role) setCurrentUserRole(session.role.toLowerCase());
        const cfg = await apiClient.getConfig();
        if (cfg.apiKeys) setSavedKeys(cfg.apiKeys);
        if (cfg.notifications) setNotifications(cfg.notifications);
        if (tab === "users") fetchUsers();
      } catch (e) { console.error(e); }
    }
    init();
  }, [tab]);

  const fetchUsers = async () => {
    try {
      const result = await apiClient.fetchUsers();
      if (result?.success && result.users) setUsers(result.users);
    } catch (e) { console.error(e); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    try {
      const fd = new FormData();
      fd.append("username", newUser.username);
      fd.append("password", newUser.password);
      fd.append("role", newUser.role);
      const res = await createUserAction(fd);
      if (res?.success) {
        setUserCreated({ success: true, message: "Credential established successfully." });
        setNewUser({ username: "", password: "", role: "operator" });
        fetchUsers();
      } else {
        setUserCreated({ success: false, message: res?.error || "Provisioning failed." });
      }
    } catch (e) { setUserCreated({ success: false, message: "Runtime error." }); }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden">
      <Sidebar pollInterval={0} />

      <main className="flex-1 flex flex-col min-w-0 h-screen relative bg-black">
        <header className="flex-none z-30">
          <TopBar title="Kernel Configuration" />
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="max-w-[1200px] mx-auto p-6 lg:p-12 space-y-12 animate-fade-in">
            
            {/* Primary Control Switch */}
            <section className="flex flex-wrap gap-px bg-[var(--border-dim)] border border-[var(--border-dim)]">
              {[
                { id: "swagger", label: "Registry Docs" },
                { id: "api",     label: "Link Protocols" },
                { id: "users",   label: "Access Control", adminOnly: true },
                { id: "notifications", label: "Relay Config" }
              ].filter(t => !t.adminOnly || currentUserRole === 'admin').map(t => (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  className={`px-8 py-4 text-[10px] font-bold tracking-[0.3em] uppercase transition-all ${tab === t.id ? "bg-white text-black" : "bg-black text-[var(--text-muted)] hover:text-white"}`}>
                  {t.label}
                </button>
              ))}
            </section>

            {/* Dynamic Control Panels */}
            <div className="space-y-12">
              
              {tab === "swagger" && (
                <div className="border border-[var(--border-dim)] bg-[#0a0a0a] p-12 space-y-10">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold tracking-[0.4em] text-[var(--online)] uppercase">Status: Online</p>
                    <h2 className="text-[24px] font-bold tracking-tight text-white leading-tight">Backend Interface Specification</h2>
                    <p className="text-[13px] text-[var(--text-muted)] max-w-2xl leading-relaxed">
                      This instance is integrated with the NestJS Core Environment. All telemetry data is processed via Scrypt-secured JSON Web Tokens and served through the clinical API layer.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--border-dim)] border border-[var(--border-dim)]">
                    <div className="bg-black p-8 space-y-4">
                      <p className="text-[9px] font-bold tracking-[0.3em] text-[var(--text-faint)] uppercase">Service Endpoint</p>
                      <p className="text-[14px] font-mono text-[var(--text-muted)]">http://localhost:3001/api/v1</p>
                    </div>
                    <div className="bg-black p-8 space-y-4">
                      <p className="text-[9px] font-bold tracking-[0.3em] text-[var(--text-faint)] uppercase">Latency Status</p>
                      <p className="text-[14px] font-mono text-[var(--online)]">8ms (Stable)</p>
                    </div>
                  </div>
                  <button className="px-8 py-4 border border-white/10 text-[10px] font-bold tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-all">
                    Access Raw Registry →
                  </button>
                </div>
              )}

              {tab === "api" && (
                <div className="border border-[var(--border-dim)] bg-[#0a0a0a] p-12 space-y-10">
                  <div className="space-y-1">
                    <h2 className="text-[20px] font-bold text-white tracking-tight">Active Link Protocols</h2>
                    <p className="text-[12px] text-[var(--text-muted)] uppercase tracking-widest font-bold opacity-40">External IoT Data Bridges</p>
                  </div>
                  <div className="space-y-8 max-w-xl">

                    <div className="space-y-4">
                      <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--text-faint)] uppercase">Secondary Vibration Hub</p>
                      <div className="flex gap-px bg-[var(--border-dim)] border border-[var(--border-dim)]">
                         <input type="password" placeholder="RONDS Relay Key" className="flex-1 bg-black p-4 text-[13px] outline-none border-none text-white font-mono" />
                         <button className="px-8 py-4 bg-white text-black text-[10px] font-bold tracking-[0.2em] uppercase">Update</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "users" && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="border border-[var(--border-dim)] bg-[#0a0a0a] p-12 space-y-10">
                      <h2 className="text-[20px] font-bold text-white tracking-tight">Provisioning</h2>
                      <form onSubmit={handleCreateUser} className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-[9px] font-bold tracking-[0.2em] text-[var(--text-faint)] uppercase">User UID</label>
                            <input value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full bg-black border border-[var(--border-dim)] p-4 text-[13px] outline-none" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-bold tracking-[0.2em] text-[var(--text-faint)] uppercase">Access Role</label>
                            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-black border border-[var(--border-dim)] p-4 text-[13px] outline-none uppercase font-bold tracking-widest text-[var(--text-muted)]">
                               <option value="operator">Operator</option>
                               <option value="engineer">Engineer</option>
                               <option value="admin">Admin</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] font-bold tracking-[0.2em] text-[var(--text-faint)] uppercase">Shield Key</label>
                            <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-black border border-[var(--border-dim)] p-4 text-[13px] outline-none" />
                         </div>
                         <button className="w-full py-4 bg-white text-black text-[10px] font-bold tracking-[0.3em] uppercase transition-all hover:bg-[var(--text-muted)]">Establish Credential</button>
                      </form>
                   </div>
                   <div className="border border-[var(--border-dim)] bg-[#0a0a0a] p-0 flex flex-col">
                      <div className="p-8 border-b border-[var(--border-dim)]">
                        <h2 className="text-[14px] font-bold text-white tracking-[0.2em] uppercase">Active Credential Registry</h2>
                      </div>
                      <div className="flex-1 overflow-auto custom-scrollbar">
                         <table className="w-full">
                            <tbody>
                               {users.map(u => (
                                 <tr key={u.username} className="border-b border-[var(--border-dim)] hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-5 text-[12px] font-mono text-[var(--text-muted)]">{u.username}</td>
                                    <td className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--online)]">{u.role}</td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                 </div>
              )}

              {tab === "notifications" && (
                <div className="border border-[var(--border-dim)] bg-[#0a0a0a] p-12 space-y-10">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h2 className="text-[20px] font-bold text-white tracking-tight">Relay Engine</h2>
                        <p className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-[0.3em]">Communication Pathways</p>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 border border-[var(--online)] bg-[var(--online)]/5">
                        <span className="w-2 h-2 rounded-full bg-[var(--online)]" />
                        <span className="text-[10px] font-bold tracking-widest text-[var(--online)]">ACTIVE</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                         <p className="text-[11px] font-bold tracking-[0.2em] text-white border-b border-white/10 pb-4">TELEGRAM GATEWAY</p>
                         <div className="space-y-4">
                            <input placeholder="Bot Auth Token" className="w-full bg-black border border-[var(--border-dim)] p-4 text-[12px] outline-none" />
                            <input placeholder="Target Chat ID" className="w-full bg-black border border-[var(--border-dim)] p-4 text-[12px] outline-none" />
                         </div>
                      </div>
                      <div className="space-y-6">
                         <p className="text-[11px] font-bold tracking-[0.2em] text-white border-b border-white/10 pb-4">WHATSAPP RELAY</p>
                         <div className="space-y-4">
                            <input placeholder="Gateway Endpoint" className="w-full bg-black border border-[var(--border-dim)] p-4 text-[12px] outline-none" />
                            <input type="password" placeholder="Access Token" className="w-full bg-black border border-[var(--border-dim)] p-4 text-[12px] outline-none" />
                         </div>
                      </div>
                   </div>
                   <div className="pt-10 border-t border-[var(--border-dim)] flex justify-end">
                      <button className="px-12 py-4 bg-white text-black text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-[var(--text-muted)] transition-all">Consolidate & Sync</button>
                   </div>
                </div>
              )}
            </div>

            {/* Elite Sub-footer */}
            <footer className="pt-20 pb-8 flex items-center justify-between opacity-20 text-[9px] font-bold tracking-[0.4em] uppercase">
                <p>Command Console Alpha-1</p>
                <p>Consultant Grade Config Module</p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
