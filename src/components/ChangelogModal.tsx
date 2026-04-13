"use client";
import { useEffect, useState } from "react";

const CURRENT_VERSION = "1.1.0";

export default function ChangelogModal({ isOpen: manualOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [ackText, setAckText] = useState("");
  const [loading, setLoading] = useState(true);

  // Auto-pop logic: Show if NOT acknowledged for this version AND hasn't been shown in this session
  useEffect(() => {
    const lastAck = localStorage.getItem("ptts-last-ack-version");
    const sessionSeen = sessionStorage.getItem("ptts-changelog-session-seen");

    if (lastAck !== CURRENT_VERSION && !sessionSeen) {
      setIsOpen(true);
      sessionStorage.setItem("ptts-changelog-session-seen", "true");
    }
  }, []);

  // Fetch content when modal opens
  useEffect(() => {
    if (isOpen || manualOpen) {
      setLoading(true);
      fetch("/api/changelog")
        .then((res) => res.json())
        .then((data) => {
          setContent(data.content || "No changelog content available.");
          setLoading(false);
        })
        .catch(() => {
          setContent("Failed to load changelog.");
          setLoading(false);
        });
    }
  }, [isOpen, manualOpen]);

  const handleAcknowledge = () => {
    if (ackText.toUpperCase() === "ACK") {
      localStorage.setItem("ptts-last-ack-version", CURRENT_VERSION);
      setIsOpen(false);
      onClose?.();
    }
  };

  const show = manualOpen || isOpen;

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col scada-card overflow-hidden shadow-2xl border-2 border-ptts/40">
        
        {/* Header */}
        <div className="scada-card-header !bg-surface-3 py-3 border-b-2 border-ptts/30">
          <div className="flex items-center gap-3">
             <span className="led led-online" style={{ width: 8, height: 8 }} />
             <span className="scada-label !text-[11px] !text-text-bright font-black tracking-widest">
               SYSTEM UPDATE LOG · {CURRENT_VERSION}
             </span>
          </div>
          {!manualOpen && (
             <span className="text-[9px] font-bold text-ptts-teal animate-led">REQUIRED ACKNOWLEDGMENT</span>
          )}
          {manualOpen && (
             <button onClick={onClose} className="text-text-muted hover:text-text-bright transition-colors text-lg">✕</button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-surface text-text">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-4">
              <div className="animate-spin-cw text-ptts-teal">◯</div>
              <span className="scada-label animate-blink">DECRYPTING LOGS...</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-text-muted selection:bg-ptts/30">
              {content}
            </pre>
          )}
        </div>

        {/* Footer / ACK Box */}
        <div className="p-6 bg-surface-2 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-text-muted mb-2 tracking-widest uppercase">
              Type <span className="text-ptts-teal">ACK</span> to confirm you have read the updates
            </p>
            <input
              type="text"
              value={ackText}
              onChange={(e) => setAckText(e.target.value)}
              placeholder="ENTER ACK..."
              className="w-full md:w-48 px-4 py-2 bg-bg border border-border rounded-sm text-[11px] font-mono tracking-widest text-text-bright outline-none focus:border-ptts/60 transition-all uppercase"
            />
          </div>

          <button
            onClick={handleAcknowledge}
            disabled={ackText.toUpperCase() !== "ACK"}
            className="w-full md:w-auto px-8 py-3 rounded-sm font-black text-[12px] tracking-[.2em] transition-all disabled:opacity-30 disabled:grayscale"
            style={{ 
              background: "var(--ptts)", 
              color: "#fff", 
              boxShadow: ackText.toUpperCase() === "ACK" ? "0 0 15px var(--ptts-glow)" : "none"
            }}
          >
            {ackText.toUpperCase() === "ACK" ? "ACKNOWLEDGE & PROCEED →" : "WAITING FOR INPUT..."}
          </button>
        </div>
      </div>
    </div>
  );
}
