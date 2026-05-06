"use client";
import { useEffect, useState } from "react";
import { Send, Zap } from "lucide-react";
import toast from "react-hot-toast";

interface Settings { msg_a: string; msg_b: string; send_delay: number; }

export default function SendPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [counts, setCounts] = useState({ a: 0, b: 0 });
  const [sending, setSending] = useState<"A"|"B"|null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const [log, setLog] = useState<string[]>([]);
  const [showModal, setShowModal] = useState<"A"|"B"|null>(null);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(setSettings);
    fetchCounts();
  }, []);

  async function fetchCounts() {
    const [a, b] = await Promise.all([
      fetch("/api/leads?group=A&status=unsent").then(r => r.json()),
      fetch("/api/leads?group=B&status=unsent").then(r => r.json()),
    ]);
    setCounts({ a: Array.isArray(a) ? a.length : 0, b: Array.isArray(b) ? b.length : 0 });
  }

  function buildPreview(template: string) {
    return template?.replace(/{name}/g, "[Business Name]").replace(/{link}/g, "https://example.yako.studio") || "";
  }

  async function startSend(group: "A"|"B") {
    setShowModal(null);
    setSending(group);
    setLog([]);

    const leadsRes = await fetch(`/api/leads?group=${group}&status=unsent`);
    const leads = await leadsRes.json();

    if (!leads.length) { toast.error("No unsent leads"); setSending(null); return; }

    setProgress({ done: 0, total: leads.length, failed: 0 });
    const delay = (settings?.send_delay || 4) * 1000;
    let done = 0, failed = 0;

    for (const lead of leads) {
      try {
        // Call our HTTPS API which calls WA server server-side
        const res = await fetch("/api/send-one", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: lead.id, group }),
        });
        const result = await res.json();
        if (result.success) { done++; setLog(l => [...l, `✓ ${lead.name}`]); }
        else { failed++; setLog(l => [...l, `✗ ${lead.name} — ${result.error || "Failed"}`]); }
      } catch {
        failed++;
        setLog(l => [...l, `✗ ${lead.name} — Error`]);
      }
      setProgress({ done: done + failed, total: leads.length, failed });
      await new Promise(r => setTimeout(r, delay));
    }

    setSending(null);
    toast.success(`${done} messages sent to Group ${group}!`);
    fetchCounts();
  }

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Send Messages</h1>
        <p className="text-white/40 text-sm mt-1">Bulk WhatsApp outreach with A/B testing</p>
      </div>

      {sending && (
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium">Sending Group {sending}... {progress.done}/{progress.total}</span>
            <span className="ml-auto text-sm text-white/40">{pct}%</span>
          </div>
          <div className="h-1.5 bg-surface2 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="bg-surface2 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-xs space-y-1">
            {log.map((l, i) => <div key={i} className={l.startsWith("✓") ? "text-accent" : "text-danger"}>{l}</div>)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {(["A","B"] as const).map(g => {
          const count = g === "A" ? counts.a : counts.b;
          const msg = g === "A" ? settings?.msg_a : settings?.msg_b;
          const color = g === "A" ? "#4ADE80" : "#60A5FA";
          return (
            <div key={g} className="card overflow-hidden" style={{ borderTop: `2px solid ${color}` }}>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className={g === "A" ? "badge-a" : "badge-b"}>MESSAGE {g}</span>
                  <span className="text-xs text-white/40">{g === "A" ? "Short & direct" : "Detailed & social proof"}</span>
                </div>
                <div className="bg-surface2 rounded-lg p-4 text-xs text-white/60 leading-relaxed max-h-52 overflow-y-auto whitespace-pre-wrap font-mono mb-4">
                  {msg ? buildPreview(msg) : "Loading..."}
                </div>
                <button className="w-full btn font-semibold" style={{ background: color, color: "#0C0F14" }}
                  onClick={() => setShowModal(g)} disabled={!!sending || count === 0}>
                  <Send size={14} /> Send to Group {g} ({count} unsent)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-white/10 rounded-2xl w-[440px] p-6">
            <h2 className="font-display font-bold text-lg mb-2">Confirm Send</h2>
            <p className="text-white/50 text-sm mb-4">
              Sending Message {showModal} to <strong className="text-white">{showModal === "A" ? counts.a : counts.b} leads</strong> with {settings?.send_delay || 4}s delay.
            </p>
            <div className="bg-surface2 rounded-lg p-3 text-xs text-white/40 mb-5">
              ⏱ ~{Math.ceil(((showModal === "A" ? counts.a : counts.b) * (settings?.send_delay || 4)) / 60)} minutes estimated
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => startSend(showModal!)}><Zap size={14} /> Start</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
