"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { createUserAction, fetchUsersAction } from "@/app/actions/auth";
import { apiClient } from "@/lib/apiClient";

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState({
    smartSensorABB: "",
    smartSensorRonds: "",
  });
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [tab, setTab] = useState<"swagger" | "api" | "users">("swagger");
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "operator" });
  const [userCreated, setUserCreated] = useState<{ success: boolean; message: string } | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [users, setUsers] = useState<Array<{ username: string; hash: string; role: string }>>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [hoveredHash, setHoveredHash] = useState<string | null>(null);

  useEffect(() => {
    async function initConfig() {
      try {
        const cfg = await apiClient.getConfig();
        if (cfg.apiKeys) setSavedKeys(cfg.apiKeys);
      } catch (e) {
        console.error("Config load error", e);
      }
    }
    initConfig();
  }, []);

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
      const result = await fetchUsersAction();
      if (result?.success && result.users) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsFetchingUsers(false);
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
      <Sidebar />

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
              <button
                onClick={() => setTab("users")}
                className="px-4 py-2 text-[9px] font-bold tracking-widest rounded-sm transition-all"
                style={{
                  background: tab === "users" ? "#005F8E" : "var(--surface)",
                  color: tab === "users" ? "#fff" : "var(--text-muted)",
                  border: "1px solid var(--border)"
                }}>
                USER MANAGEMENT
              </button>
            </div>

            {/* Swagger Tab */}
            {tab === "swagger" && (
              <div className="rounded-sm p-6 space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div>
                  <h2 className="text-sm font-bold tracking-widest mb-3"
                    style={{ color: "#00A3B4" }}>ABB ABILITY™ CLOUD INTERFACE DOCUMENTATION</h2>

                  <div className="space-y-3 text-[9px]" style={{ color: "var(--text-muted)" }}>
                    <div className="p-3 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      <p className="font-bold mb-1">📖 Cloud Interface for Condition Monitoring</p>
                      <p className="text-[8px] leading-relaxed mb-2">
                        This SCADA dashboard is prepared to integrate directly with the ABB Ability™ Condition Monitoring for powertrains account. 
                        The backend connects to ABB&#39;s infrastructure using the API Keys specified in the configuration tab.
                      </p>
                      <a href="https://api.conditionmonitoring.motion.abb.com/swagger/index.html?urls.primaryName=Cloud+Interface+for+ABB+Ability+Condition+Monitoring+for+powertrains+account#/Account/UpdateApiKey"
                         target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm font-bold tracking-widest transition-all hover:opacity-80"
                         style={{ background: "#005F8E20", color: "#00A3B4", border: "1px solid #00A3B450" }}>
                        ↗ OPEN ABB SWAGGER UI
                      </a>
                    </div>

                    <div className="p-3 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      <p className="font-bold mb-1">🔌 Primary Endpoints Referenced</p>
                      <div className="space-y-1 font-mono text-[8px]" style={{ color: "#00e676" }}>
                        <div><span style={{ color: "var(--text-muted)" }}>PUT</span> /Account/UpdateApiKey</div>
                        <div><span style={{ color: "var(--text-muted)" }}>GET</span> /Assets (ABB Powertrain endpoints)</div>
                        <div><span style={{ color: "var(--text-muted)" }}>GET</span> /Measurements</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      <p className="font-bold mb-1">🔐 Authentication & Integration</p>
                      <p className="text-[8px] leading-relaxed">
                        Data from ABB SmartSensors is pulled securely via API keys. 
                        Ensure your backend utilizes standard HTTPS requests to <span className="font-mono text-[#00A3B4]">api.conditionmonitoring.motion.abb.com</span> 
                        and proxies the aggregated real-time data back to <span className="font-mono text-[#00A3B4]">/api/dashboard</span> for this SCADA UI.
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
                  <h2 className="text-sm font-bold tracking-widest mb-4"
                    style={{ color: "#00A3B4" }}>API KEY MANAGEMENT</h2>

                  <div className="space-y-4">
                    {/* ABB API Key */}
                    <div className="p-4 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      <label className="scada-label block mb-2">SmartSensor API Key — ABB</label>
                      <div className="flex gap-2">
                        <input
                          type={savedKeys.includes("smartSensorABB") ? "password" : "text"}
                          name="smartSensorABB"
                          value={apiKeys.smartSensorABB}
                          onChange={handleInputChange}
                          placeholder="Enter ABB SmartSensor API key"
                          className="flex-1 px-3 py-2.5 text-sm rounded-sm outline-none transition-all"
                          style={{
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                            color: "#c8d8e8"
                          }}
                        />
                        <button
                          onClick={() => handleSaveKey("smartSensorABB")}
                          className="px-4 py-2.5 text-[9px] font-bold rounded-sm transition-all tracking-widest"
                          style={{
                            background: savedKeys.includes("smartSensorABB") ? "#00A3B4" : "#005F8E",
                            color: "#fff",
                            border: "1px solid var(--border)"
                          }}>
                          {savedKeys.includes("smartSensorABB") ? "✓ SAVED" : "SAVE"}
                        </button>
                      </div>
                      <p className="text-[8px] mt-2" style={{ color: "var(--text-faint)" }}>
                        API key for ABB SmartSensor integration. Required for device communication.
                      </p>
                    </div>

                    {/* Ronds API Key */}
                    <div className="p-4 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      <label className="scada-label block mb-2">SmartSensor API Key — Ronds</label>
                      <div className="flex gap-2">
                        <input
                          type={savedKeys.includes("smartSensorRonds") ? "password" : "text"}
                          name="smartSensorRonds"
                          value={apiKeys.smartSensorRonds}
                          onChange={handleInputChange}
                          placeholder="Enter Ronds SmartSensor API key"
                          className="flex-1 px-3 py-2.5 text-sm rounded-sm outline-none transition-all"
                          style={{
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                            color: "#c8d8e8"
                          }}
                        />
                        <button
                          onClick={() => handleSaveKey("smartSensorRonds")}
                          className="px-4 py-2.5 text-[9px] font-bold rounded-sm transition-all tracking-widest"
                          style={{
                            background: savedKeys.includes("smartSensorRonds") ? "#00A3B4" : "#005F8E",
                            color: "#fff",
                            border: "1px solid var(--border)"
                          }}>
                          {savedKeys.includes("smartSensorRonds") ? "✓ SAVED" : "SAVE"}
                        </button>
                      </div>
                      <p className="text-[8px] mt-2" style={{ color: "var(--text-faint)" }}>
                        API key for Ronds SmartSensor integration. Required for device communication.
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

            {/* User Management Tab */}
            {tab === "users" && (
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
        </div>
      </main>
    </div>
  );
}
