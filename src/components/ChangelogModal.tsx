"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const CURRENT_VERSION = "2.0.0";

export default function ChangelogModal({ isOpen: manualOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [ackText, setAckText] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Custom parser for "game patch" look
  const renderFormattedContent = (raw: string) => {
    const lines = raw.split("\n");
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-2" />;

      // Version Header: ## [0.9.0] — 2026-04-14
      if (trimmed.startsWith("## ")) {
        return (
          <div key={i} className="mt-8 mb-4 border-b border-ptts/20 pb-2">
            <h3 className="text-base font-black text-ptts-teal tracking-[.25em] uppercase">
              {trimmed.replace("## ", "")}
            </h3>
          </div>
        );
      }

      // Category Header: ### Added
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={i} className="mt-5 mb-2 text-base font-black tracking-widest text-text-bright uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-ptts-teal/60 rounded-full" />
            {trimmed.replace("### ", "")}
          </h4>
        );
      }

      // Main Changelog Header: # Changelog (Ignore or style)
      if (trimmed.startsWith("# ")) return null;

      // List Items: - **Bold** — Text  OR - Text
      if (trimmed.startsWith("- ")) {
        let text = trimmed.replace("- ", "");
        
        // Handle **Bold**
        const boldMatch = text.match(/\*\*(.*?)\*\*/);
        if (boldMatch) {
          const [full, boldPart] = boldMatch;
          const remaining = text.replace(full, "");
          return (
            <div key={i} className="flex gap-3 mb-1.5 pl-2 group">
              <span className="text-ptts-teal/50 font-bold group-hover:text-ptts-teal transition-colors">»</span>
              <p className="text-sm leading-relaxed text-text-muted">
                <span className="font-bold text-text-bright">{boldPart}</span>
                {remaining}
              </p>
            </div>
          );
        }

        return (
          <div key={i} className="flex gap-3 mb-1.5 pl-2 group">
            <span className="text-ptts-teal/50 font-bold group-hover:text-ptts-teal transition-colors">»</span>
            <p className="text-sm leading-relaxed text-text-muted">{text}</p>
          </div>
        );
      }

      // Normal text
      return (
        <p key={i} className="text-sm leading-relaxed text-text-muted mb-2 px-1">
          {trimmed}
        </p>
      );
    });
  };

  const show = manualOpen || isOpen;

  if (!show || !mounted) return null;

  return createPortal(
    <div className="fixed top-0 left-0 right-0 bottom-0 z-[99999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in" style={{ height: "100vh", width: "100vw" }}>
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col scada-card overflow-hidden shadow-2xl border-2 border-ptts/40">
        
        {/* Header */}
        <div className="scada-card-header !bg-surface-3 py-3 border-b-2 border-ptts/30">
          <div className="flex items-center gap-3">
             <span className="led led-online" style={{ width: 8, height: 8 }} />
             <span className="scada-label !text-sm !text-text-bright font-black tracking-widest">
               SYSTEM UPDATE LOG · {CURRENT_VERSION}
             </span>
          </div>
          {!manualOpen && (
             <span className="text-xs font-bold text-ptts-teal animate-led">REQUIRED ACKNOWLEDGMENT</span>
          )}
          {manualOpen && (
             <button onClick={onClose} className="text-text-muted hover:text-text-bright transition-colors text-lg">✕</button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-surface/95 scrollbar-thin scrollbar-thumb-ptts/20">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-4">
              <div className="animate-spin-cw text-ptts-teal">◯</div>
              <span className="scada-label animate-blink">DECRYPTING LOGS...</span>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto selection:bg-ptts/30">
              {renderFormattedContent(content)}
            </div>
          )}
        </div>

        {/* Footer / ACK Box */}
        <div className="p-6 bg-surface-2 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          {!manualOpen ? (
            <>
              <div className="flex-1">
                <p className="text-base font-bold text-text-muted mb-2 tracking-widest uppercase">
                  Type <span className="text-ptts-teal">ACK</span> to confirm you have read the updates
                </p>
                <input
                  type="text"
                  value={ackText}
                  onChange={(e) => setAckText(e.target.value)}
                  placeholder="ENTER ACK..."
                  className="w-full md:w-48 px-4 py-2 bg-bg border border-border rounded-none text-sm font-mono tracking-widest text-text-bright outline-none focus:border-ptts/60 transition-all uppercase"
                />
              </div>

              <button
                onClick={handleAcknowledge}
                disabled={ackText.toUpperCase() !== "ACK"}
                className="w-full md:w-auto px-8 py-3 rounded-none font-black text-[15px] tracking-[.2em] transition-all disabled:opacity-30 disabled:grayscale"
                style={{ 
                  background: "var(--ptts)", 
                  color: "#fff", 
                  boxShadow: ackText.toUpperCase() === "ACK" ? "0 0 15px var(--ptts-glow)" : "none"
                }}
              >
                {ackText.toUpperCase() === "ACK" ? "ACKNOWLEDGE & PROCEED →" : "WAITING FOR INPUT..."}
              </button>
            </>
          ) : (
             <div className="flex-1 flex justify-end">
               <button onClick={onClose} className="px-8 py-2.5 rounded-none font-bold text-sm tracking-widest transition-all" style={{ background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text-bright)" }}>
                 CLOSE
               </button>
             </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
