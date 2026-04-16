"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { createUserAction, fetchUsersAction } from "@/app/actions/auth";
import { apiClient } from "@/lib/apiClient";

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState({
    smartSensorPTTS: "",
    smartSensorRonds: "",
  });
  const [activeKeyTab, setActiveKeyTab] = useState<"smartSensorPTTS" | "smartSensorRonds">("smartSensorPTTS");
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tab, setTab] = useState<"swagger" | "api" | "users" | "notifications">("swagger");
  const [notifications, setNotifications] = useState({
    telegramToken: "",
    telegramChatId: "",
    whatsappApiUrl: "",
    whatsappToken: "",
    isNotifyEnabled: true
  });
  const [isSavingNotify, setIsSavingNotify] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "operator" });
  const [userCreated, setUserCreated] = useState<{ success: boolean; message: string } | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [users, setUsers] = useState<Array<{ username: string; hash: string; role: string }>>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [hoveredHash, setHoveredHash] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("operator");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState<string>("");

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await apiClient.getCurrentSession();
        if (session?.role) {
          setCurrentUserRole(session.role.toLowerCase());
        }
      } catch (e) {
        console.error("Auth check failed", e);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    async function initConfig() {
      try {
        const cfg = await apiClient.getConfig();
        if (cfg.apiKeys) setSavedKeys(cfg.apiKeys);
        if (cfg.notifications) setNotifications(cfg.notifications);
      } catch (e) {
        console.error("Config load error", e);
      }
    }
    initConfig();
  }, []);

  const handleNotifyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNotifications(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotify(true);
    try {
      await apiClient.saveConfig(savedKeys, notifications);
      setTestStatus("success");
      setTestMessage("NOTIFICATION CONFIG SAVED & SYNCED");
      setTimeout(() => setTestStatus("idle"), 3000);
    } catch (e) {
      console.error("Notify save error", e);
    } finally {
      setIsSavingNotify(false);
    }
  };

  const handleTestNotify = async (channel: 'telegram' | 'whatsapp') => {
    setTestStatus("testing");
    setTestMessage("");
    try {
      const data = channel === 'telegram' 
        ? { token: notifications.telegramToken, chatId: notifications.telegramChatId }
        : { apiUrl: notifications.whatsappApiUrl, token: notifications.whatsappToken };

      const result = await apiClient.testNotification(channel, data);
      if (result.success) {
        setTestStatus("success");
        setTestMessage(result.message);
      } else {
        setTestStatus("error");
        setTestMessage(result.message);
      }
    } catch (e) {
      setTestStatus("error");
      setTestMessage("TEST FAILED — NETWORK ERROR");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApiKeys(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveKey = async (key: string) => {
    if (apiKeys[key as keyof typeof apiKeys]) {
      setIsSyncing(true);
      const newKeys = savedKeys.includes(key) ? savedKeys : [...savedKeys, key];
      setSavedKeys(newKeys);
      try {
        await apiClient.saveConfig(newKeys);
      } catch (e) {
        console.error("Config save error", e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;

    setIsCreatingUser(true);
    try {
      const formData = new FormData();
      formData.append("username", newUser.username);
      formData.append("password", newUser.password);
      formData.append("role", newUser.role);

      const result = await createUserAction(formData);
      if (result?.success) {
        setUserCreated({ success: true, message: `User "${newUser.username}" created successfully` });
        setNewUser({ username: "", password: "", role: "operator" });
        setTimeout(() => setUserCreated(null), 3000);
        // Refresh users list after creating a new user
        fetchUsers();
      } else {
        setUserCreated({ success: false, message: result?.error || "Failed to create user" });
      }
    } catch (error) {
      setUserCreated({ success: false, message: "Error creating user" });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const fetchUsers = async () => {
    setIsFetchingUsers(true);
    try {
      const result = await apiClient.fetchUsers();
      if (result?.success && result.users) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const handleTestConnection = async () => {
    const key = apiKeys[activeKeyTab];
    if (!key) return;

    setTestStatus("testing");
    setTestMessage("");
    try {
      const result = await apiClient.testIntegration(activeKeyTab, key);
      if (result.success) {
        setTestStatus("success");
        setTestMessage(result.message);
      } else {
        setTestStatus("error");
        setTestMessage(result.message);
      }
    } catch (e) {
      setTestStatus("error");
      setTestMessage("FAILED — SYSTEM ERROR DURING TEST");
    }
  };

  // Fetch users when users tab is opened
  useEffect(() => {
    if (tab === "users") {
      fetchUsers();
    }
  }, [tab]);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar pollInterval={0} />

      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top bar */}
        <TopBar title="CONFIG" />

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="max-w-4xl space-y-4">
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setTab("swagger")}
                className="px-4 py-2 text-[9px] font-bold tracking-widest rounded-sm transition-all"
                style={{
                  background: tab === "swagger" ? "#005F8E" : "var(--surface)",
                  color: tab === "swagger" ? "#fff" : "var(--text-muted)",
                  border: "1px solid var(--border)"
                }}>
                SWAGGER / API DOCS
              </button>
              <button
                onClick={() => setTab("api")}
                className="px-4 py-2 text-[9px] font-bold tracking-widest rounded-sm transition-all"
                style={{
                  background: tab === "api" ? "#005F8E" : "var(--surface)",
                  color: tab === "api" ? "#fff" : "var(--text-muted)",
                  border: "1px solid var(--border)"
                }}>
                API CONFIGURATION
              </button>
              
              {currentUserRole === "admin" && (
                <button
                  onClick={() => setTab("users")}
                  className="px-4 py-2 text-[9px] font-bold tracking-widest rounded-sm transition-all"
                  style={{
                    background: tab === "users" ? "#1e3048" : "var(--surface)",
                    color: tab === "users" ? "#00c8e0" : "var(--text-muted)",
                    border: tab === "users" ? "1px solid #00c8e050" : "1px solid var(--border)"
                  }}>
                  USER MANAGEMENT
                </button>
              )}

              <button
                onClick={() => setTab("notifications")}
                className="px-4 py-2 text-[9px] font-bold tracking-widest rounded-sm transition-all"
                style={{
                  background: tab === "notifications" ? "#1e3048" : "var(--surface)",
                  color: tab === "notifications" ? "#ff8c00" : "var(--text-muted)",
                  border: tab === "notifications" ? "1px solid #ff8c0050" : "1px solid var(--border)"
                }}>
                NOTIFICATIONS (WA/TG)
              </button>
            </div>

            {/* Notification Tab Content */}
            {tab === "notifications" && (
              <div className="rounded-sm p-6 space-y-6"
                   style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div>
                  <h2 className="text-sm font-bold tracking-widest mb-1" style={{ color: "#ff8c00" }}>NOTIFICATION ENGINE</h2>
                  <p className="text-[9px] text-muted-foreground mb-4">Centralized alert delivery for industrial equipment violations.</p>
                  
                  <div className="flex items-center gap-3 p-4 rounded-sm mb-6" style={{ background: "rgba(255,140,0,0.05)", border: "1px dashed rgba(255,140,0,0.3)" }}>
                    <input 
                      type="checkbox" 
                      id="isNotifyEnabled"
                      name="isNotifyEnabled"
                      checked={notifications.isNotifyEnabled}
                      onChange={handleNotifyChange}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="isNotifyEnabled" className="text-[10px] font-bold tracking-widest cursor-pointer">
                      ENABLE AUTOMATIC EXTERNAL ALERTS
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {/* Telegram Section */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold tracking-widest border-b border-border pb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#0088cc]"></span> TELEGRAM BOT CONFIG
                      </h3>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[8px] text-muted-foreground uppercase">Bot Token (from @BotFather)</label>
                          <input
                            type="text"
                            name="telegramToken"
                            value={notifications.telegramToken}
                            onChange={handleNotifyChange}
                            className="w-full bg-bg border border-border p-3 text-[10px] focus:border-[#0088cc] outline-none transition-all font-mono"
                            placeholder="0000000000:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-muted-foreground uppercase">Chat ID / Group ID</label>
                          <input
                            type="text"
                            name="telegramChatId"
                            value={notifications.telegramChatId}
                            onChange={handleNotifyChange}
                            className="w-full bg-bg border border-border p-3 text-[10px] focus:border-[#0088cc] outline-none transition-all font-mono"
                            placeholder="-100xxxxxxxxxx"
                          />
                        </div>
                        <button
                          onClick={() => handleTestNotify('telegram')}
                          disabled={testStatus === "testing"}
                          className="w-full py-2 bg-[#0088cc20] border border-[#0088cc50] text-[#0088cc] text-[8px] font-bold tracking-widest hover:bg-[#0088cc] hover:text-white transition-all rounded-sm uppercase">
                          {testStatus === "testing" ? "Testing..." : "Send Test Telegram"}
                        </button>
                      </div>
                    </div>

                    {/* WhatsApp Section */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold tracking-widest border-b border-border pb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#25D366]"></span> WHATSAPP GATEWAY (FONNTE)
                      </h3>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[8px] text-muted-foreground uppercase">API Endpoint URL</label>
                          <input
                            type="text"
                            name="whatsappApiUrl"
                            value={notifications.whatsappApiUrl}
                            onChange={handleNotifyChange}
                            className="w-full bg-bg border border-border p-3 text-[10px] focus:border-[#25D366] outline-none transition-all font-mono"
                            placeholder="https://api.fonnte.com/send"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-muted-foreground uppercase">API Token / Secret</label>
                          <input
                            type="password"
                            name="whatsappToken"
                            value={notifications.whatsappToken}
                            onChange={handleNotifyChange}
                            className="w-full bg-bg border border-border p-3 text-[10px] focus:border-[#25D366] outline-none transition-all font-mono"
                            placeholder="••••••••••••••••"
                          />
                        </div>
                        <button
                          onClick={() => handleTestNotify('whatsapp')}
                          disabled={testStatus === "testing"}
                          className="w-full py-2 bg-[#25D36620] border border-[#25D36650] text-[#25D366] text-[8px] font-bold tracking-widest hover:bg-[#25D366] hover:text-white transition-all rounded-sm uppercase">
                          {testStatus === "testing" ? "Testing..." : "Send Test WhatsApp"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-border flex justify-end">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={isSavingNotify}
                      className="px-8 py-3 bg-[#ff8c00] text-white text-[9px] font-bold tracking-[.2em] rounded-sm hover:brightness-110 active:scale-[.98] transition-all disabled:opacity-50">
                      {isSavingNotify ? "SYNCING..." : "SAVE NOTIFICATION CONFIG"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Swagger Tab */}
            {tab === "swagger" && (
              <div className="rounded-sm p-6 space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div>
                  <h2 className="text-sm font-bold tracking-widest mb-3"
                    style={{ color: "#00A3B4" }}>PTTS SMARTSENSOR — API DOCUMENTATION</h2>

                  <div className="space-y-3 text-[9px]" style={{ color: "var(--text-muted)" }}>
                    <div className="p-3 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      <p className="font-bold mb-1">📖 PTTS Backend REST API</p>
                      <p className="text-[8px] leading-relaxed mb-2">
                        Dashboard ini terhubung ke backend NestJS PTTS yang berjalan di <span className="font-mono text-[#00A3B4]">localhost:3001</span>.
                        Seluruh data telemetri, alarm, dan konfigurasi diproses melalui API layer ini sebelum ditampilkan di SCADA UI.
                      </p>
                      <a href="http://localhost:3001/api/dashboard"
                         target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm font-bold tracking-widest transition-all hover:opacity-80"
                         style={{ background: "#005F8E20", color: "#00A3B4", border: "1px solid #00A3B450" }}>
                        ↗ OPEN BACKEND API
                      </a>
                    </div>

                    <div className="p-3 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      <p className="font-bold mb-1">🔌 Available Endpoints</p>
                      <div className="space-y-1 font-mono text-[8px]" style={{ color: "#00e676" }}>
                        <div><span style={{ color: "var(--text-muted)" }}>GET</span>   /api/dashboard</div>
                        <div><span style={{ color: "var(--text-muted)" }}>GET</span>   /api/reports?period=monthly</div>
                        <div><span style={{ color: "var(--text-muted)" }}>GET</span>   /api/config</div>
                        <div><span style={{ color: "var(--text-muted)" }}>POST</span>  /api/config</div>
                        <div><span style={{ color: "var(--text-muted)" }}>PATCH</span> /api/alarms/:id/ack</div>
                        <div><span style={{ color: "var(--text-muted)" }}>GET</span>   /api/assets/:id</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      <p className="font-bold mb-1">🔐 Authentication & Integration</p>
                      <p className="text-[8px] leading-relaxed">
                        Data SmartSensor PTTS & RONDS ditarik secara aman via API key dan diproses oleh backend NestJS.
                        Backend memproxy data ke <span className="font-mono text-[#00A3B4]">/api/dashboard</span> untuk konsumsi SCADA UI ini.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Configuration Tab */}
            {tab === "api" && (
              <div className="rounded-sm p-6 space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div>
                  <h2 className="text-sm font-bold tracking-widest mb-4 uppercase"
                    style={{ color: "var(--ptts-teal)" }}>SmartSensor API Configuration</h2>

                  <div className="space-y-4">
                    {/* Unified API Key Group */}
                    <div className="p-4 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      
                      {/* Provider Selector Tabs */}
                      <div className="flex gap-1 mb-4 p-1 rounded-sm w-fit" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <button
                          onClick={() => setActiveKeyTab("smartSensorPTTS")}
                          className="px-4 py-1.5 text-[8px] font-bold tracking-widest rounded-sm transition-all"
                          style={{
                            background: activeKeyTab === "smartSensorPTTS" ? "var(--ptts-teal)" : "transparent",
                            color: activeKeyTab === "smartSensorPTTS" ? "#fff" : "var(--text-muted)",
                          }}>
                          PTTS / ABB
                        </button>
                        <button
                          onClick={() => setActiveKeyTab("smartSensorRonds")}
                          className="px-4 py-1.5 text-[8px] font-bold tracking-widest rounded-sm transition-all"
                          style={{
                            background: activeKeyTab === "smartSensorRonds" ? "var(--ptts-teal)" : "transparent",
                            color: activeKeyTab === "smartSensorRonds" ? "#fff" : "var(--text-muted)",
                          }}>
                          RONDS
                        </button>
                      </div>

                      <label className="scada-label block mb-2 uppercase text-[9px]">
                        {activeKeyTab === "smartSensorPTTS" ? "ABB Ability™" : "RONDS Monitoring"} API Key
                      </label>
                      
                      <div className="flex gap-2">
                        <input
                          type={savedKeys.includes(activeKeyTab) ? "password" : "text"}
                          name={activeKeyTab}
                          value={apiKeys[activeKeyTab]}
                          onChange={handleInputChange}
                          placeholder={`Enter ${activeKeyTab === "smartSensorPTTS" ? "ABB" : "Ronds"} API key`}
                          className="flex-1 px-3 py-2.5 text-[11px] rounded-sm outline-none transition-all"
                          style={{
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                            color: "var(--text)"
                          }}
                        />
                        <button
                          onClick={handleTestConnection}
                          disabled={testStatus === "testing" || !apiKeys[activeKeyTab]}
                          className="px-4 py-2.5 text-[8px] font-bold rounded-sm transition-all tracking-widest disabled:opacity-50"
                          style={{
                            background: "var(--bg)",
                            color: "var(--ptts-teal)",
                            border: "1px solid var(--ptts-teal)"
                          }}>
                          {testStatus === "testing" ? "TESTING..." : "TEST CONNECTION"}
                        </button>
                        <button
                          onClick={() => handleSaveKey(activeKeyTab)}
                          className="px-5 py-2.5 text-[9px] font-bold rounded-sm transition-all tracking-widest"
                          style={{
                            background: savedKeys.includes(activeKeyTab) ? "var(--online)" : "var(--ptts-teal)",
                            color: "#fff",
                            border: "1px solid var(--border)"
                          }}>
                          {savedKeys.includes(activeKeyTab) ? "✓ SAVED" : "SAVE KEY"}
                        </button>
                      </div>

                      {testStatus !== "idle" && (
                        <div className="mt-2 p-2 rounded-sm flex items-center gap-2"
                             style={{ 
                               background: testStatus === "success" ? "#00e67608" : testStatus === "error" ? "#ff525208" : "#00A3B408",
                               border: `1px solid ${testStatus === "success" ? "#00e67630" : testStatus === "error" ? "#ff525230" : "#00A3B430"}`
                             }}>
                          <span className={`led ${testStatus === "success" ? "led-online" : testStatus === "error" ? "led-critical" : "led-warning"}`} 
                                style={{ width: 6, height: 6 }} />
                          <span className="text-[8px] font-bold tracking-widest"
                                style={{ color: testStatus === "success" ? "#00e676" : testStatus === "error" ? "#ff5252" : "#00A3B4" }}>
                            {testMessage || "PREPARING CONNECTION TEST..."}
                          </span>
                        </div>
                      )}

                      <p className="text-[8px] mt-2 italic" style={{ color: "var(--text-faint)" }}>
                        {activeKeyTab === "smartSensorPTTS" 
                          ? "Required for communication with ABB Ability™ Condition Monitoring cloud." 
                          : "Required for integration with RONDS wireless sensor datalink."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="p-3 rounded-sm flex items-center gap-2"
                  style={{ background: "#00e67608", border: "1px solid #00e67620" }}>
                  <span className="led led-online" style={{ width: 6, height: 6 }} />
                  <span className="text-[9px] tracking-widest text-[#00e676]">
                    {savedKeys.length === 0
                      ? "NO KEYS CONFIGURED"
                      : `${savedKeys.length} API KEY${savedKeys.length !== 1 ? "S" : ""} ACTIVE`}
                  </span>
                </div>
              </div>
            )}

            {tab === "users" && currentUserRole === "admin" && (
              <div className="rounded-sm p-6 space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div>
                  <h2 className="text-sm font-bold tracking-widest mb-4"
                    style={{ color: "#00A3B4" }}>USER MANAGEMENT</h2>

                  <div className="space-y-4">
                    {/* Create New User Form */}
                    <form onSubmit={handleCreateUser} className="p-4 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      <div className="space-y-3">
                        <div>
                          <label className="scada-label block mb-2">USERNAME</label>
                          <input
                            type="text"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            placeholder="Enter username"
                            className="w-full px-3 py-2.5 text-[10px] rounded-sm outline-none transition-all"
                            style={{
                              background: "#0b0e13",
                              border: "1px solid #242d3f",
                              color: "#d4e4f4"
                            }}
                          />
                        </div>

                        <div>
                          <label className="scada-label block mb-2">PASSWORD</label>
                          <input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Enter password"
                            className="w-full px-3 py-2.5 text-[10px] rounded-sm outline-none transition-all"
                            style={{
                              background: "#0b0e13",
                              border: "1px solid #242d3f",
                              color: "#d4e4f4"
                            }}
                          />
                        </div>

                        <div>
                          <label className="scada-label block mb-2">ROLE</label>
                          <select
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            className="w-full px-3 py-2.5 text-[10px] rounded-sm outline-none transition-all"
                            style={{
                              background: "#0b0e13",
                              border: "1px solid #242d3f",
                              color: "#d4e4f4"
                            }}>
                            <option value="engineer">ENGINEER</option>
                            <option value="operator">OPERATOR</option>
                            <option value="admin">ADMIN</option>
                          </select>
                        </div>

                        {userCreated && (
                          <div className="p-2 rounded-sm text-[9px] tracking-widest"
                            style={{
                              background: userCreated.success ? "#00e67608" : "#CC000015",
                              border: `1px solid ${userCreated.success ? "#00e67620" : "#CC000030"}`,
                              color: userCreated.success ? "#00e676" : "#CC0000"
                            }}>
                            {userCreated.message}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isCreatingUser || !newUser.username || !newUser.password}
                          className="w-full py-2.5 text-[9px] font-bold rounded-sm transition-all tracking-widest disabled:opacity-50"
                          style={{
                            background: "#005F8E",
                            color: "#fff",
                            border: "1px solid #00A3B440"
                          }}>
                          {isCreatingUser ? "CREATING..." : "CREATE USER"}
                        </button>
                      </div>
                    </form>

                    <p className="text-[8px]" style={{ color: "var(--text-faint)" }}>
                      Create new user accounts with username, password, and role assignment. Users must have unique usernames and minimum 6 characters for passwords.
                    </p>
                  </div>

                  {/* Users List */}
                  <div className="mt-6">
                    <h3 className="text-sm font-bold tracking-widest mb-3" style={{ color: "#00A3B4" }}>
                      REGISTERED USERS
                    </h3>
                    {isFetchingUsers ? (
                      <div className="p-4 rounded-sm text-center" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                        <p className="text-[9px] tracking-widest" style={{ color: "var(--text-faint)" }}>LOADING...</p>
                      </div>
                    ) : users.length === 0 ? (
                      <div className="p-4 rounded-sm text-center" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                        <p className="text-[9px] tracking-widest" style={{ color: "var(--text-faint)" }}>NO USERS REGISTERED</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-sm" style={{ border: "1px solid var(--border-dim)" }}>
                        <table className="w-full text-[8px]" style={{ background: "var(--bg)" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-dim)" }}>
                              <th className="px-3 py-2 text-left font-bold tracking-widest" style={{ color: "#00A3B4" }}>USERNAME</th>
                              <th className="px-3 py-2 text-left font-bold tracking-widest" style={{ color: "#00A3B4" }}>PASSWORD HASH</th>
                              <th className="px-3 py-2 text-left font-bold tracking-widest" style={{ color: "#00A3B4" }}>ROLE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user) => (
                              <tr key={user.username} style={{ borderBottom: "1px solid var(--border-dim)" }}>
                                <td className="px-3 py-2" style={{ color: "#c8d8e8", fontFamily: "monospace" }}>{user.username}</td>
                                <td className="px-3 py-2 relative" style={{ color: "#c8d8e8", fontFamily: "monospace" }}>
                                  <span
                                    onMouseEnter={() => setHoveredHash(user.hash)}
                                    onMouseLeave={() => setHoveredHash(null)}
                                    style={{ cursor: "help", position: "relative" }}>
                                    {user.hash.substring(0, 16)}...
                                    {hoveredHash === user.hash && (
                                      <div
                                        className="absolute px-3 py-2 rounded-sm text-[8px] font-bold tracking-widest whitespace-nowrap"
                                        style={{
                                          background: "#0b0e13",
                                          border: "2px solid #00A3B4",
                                          color: "#00A3B4",
                                          zIndex: 9999,
                                          left: "50%",
                                          transform: "translateX(-50%)",
                                          top: "-40px",
                                          boxShadow: "0 0 10px rgba(0, 163, 180, 0.5)"
                                        }}>
                                        {user.hash}
                                      </div>
                                    )}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className="px-2 py-1 rounded-sm text-[7px] font-bold tracking-widest"
                                    style={{
                                      background: user.role === "admin" ? "#CC000025" : user.role === "operator" ? "#00A3B425" : "#005F8E25",
                                      color: user.role === "admin" ? "#CC0000" : user.role === "operator" ? "#00A3B4" : "#005F8E",
                                      border: `1px solid ${user.role === "admin" ? "#CC000040" : user.role === "operator" ? "#00A3B440" : "#005F8E40"}`
                                    }}>
                                    {user.role.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex items-center justify-between px-2 py-1 text-[8px] tracking-[.15em] border-t border-border-dim"
            style={{ color:"var(--text-faint)" }}>
            <div className="flex gap-4">
              <span>PTTS SMARTSENSOR IoT PLATFORM · v1.1.0</span>
              <span>ADMIN CONFIGURATION MODULE</span>
            </div>
            <div className="flex gap-4">
              <span>SECURITY: SCRYPT · JWT + PERMANENT STORAGE</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
