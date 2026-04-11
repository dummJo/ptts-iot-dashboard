"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState({
    smartSensorABB: "",
    smartSensorRonds: "",
  });
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [tab, setTab] = useState<"swagger" | "api">("swagger");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApiKeys(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveKey = (key: string) => {
    if (apiKeys[key as keyof typeof apiKeys]) {
      setSavedKeys(prev =>
        prev.includes(key) ? prev : [...prev, key]
      );
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-2"
          style={{ background: "var(--sidebar-bg)", borderBottom: "1px solid var(--border)", minHeight: 40 }}>
          <div className="flex items-center gap-2 text-[9px] tracking-widest font-bold">
            <span style={{ color: "var(--text-faint)" }}>PTTS</span>
            <span style={{ color: "var(--border)" }}>›</span>
            <span style={{ color: "var(--text-faint)" }}>SMARTSENSOR</span>
            <span style={{ color: "var(--border)" }}>›</span>
            <span style={{ color: "#00A3B4" }}>CONFIG</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>

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
            </div>

            {/* Swagger Tab */}
            {tab === "swagger" && (
              <div className="rounded-sm p-6 space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div>
                  <h2 className="text-sm font-bold tracking-widest mb-3"
                    style={{ color: "#00A3B4" }}>SMARTSENSOR API DOCUMENTATION</h2>

                  <div className="space-y-3 text-[9px]" style={{ color: "var(--text-muted)" }}>
                    <div className="p-3 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      <p className="font-bold mb-1">📖 OpenAPI 3.0 Schema</p>
                      <p className="text-[8px] leading-relaxed">
                        SmartSensor IoT Platform exposes REST API endpoints for asset monitoring,
                        sensor data retrieval, and real-time alerts. Full API documentation available
                        at <span style={{ color: "#00A3B4" }}>/api/docs/swagger</span> (localhost development).
                      </p>
                    </div>

                    <div className="p-3 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      <p className="font-bold mb-1">🔌 Core Endpoints</p>
                      <div className="space-y-1 font-mono text-[8px]" style={{ color: "#00e676" }}>
                        <div><span style={{ color: "var(--text-muted)" }}>GET</span> /api/assets</div>
                        <div><span style={{ color: "var(--text-muted)" }}>GET</span> /api/sensors/data</div>
                        <div><span style={{ color: "var(--text-muted)" }}>GET</span> /api/alerts</div>
                        <div><span style={{ color: "var(--text-muted)" }}>POST</span> /api/config/refresh</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-sm" style={{ background: "var(--bg)", border: "1px solid var(--border-dim)" }}>
                      <p className="font-bold mb-1">🔐 Authentication</p>
                      <p className="text-[8px] leading-relaxed">
                        All requests require JWT Bearer token in Authorization header.
                        Token obtained via POST /api/auth/login with operator credentials.
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
          </div>
        </div>
      </main>
    </div>
  );
}
