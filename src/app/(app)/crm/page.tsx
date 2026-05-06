"use client";
import { useEffect, useState, useCallback } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import type { Lead, LeadStatus } from "@/types";

const COLS = [
  { key: "sent" as LeadStatus, label: "No Answer Yet", color: "text-white/50", border: "border-white/10" },
  { key: "not-sure" as LeadStatus, label: "Not Sure", color: "text-yellow-400", border: "border-yellow-500/20" },
  { key: "interested" as LeadStatus, label: "Interested 🔥", color: "text-accent", border: "border-accent/20" },
  { key: "not-interested" as LeadStatus, label: "Not Interested", color: "text-danger", border: "border-danger/20" },
];

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(data.filter((l: Lead) => l.sent_at));
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function move(id: string, status: LeadStatus) {
    const body: Record<string, string> = { status };
    if (["replied","interested","not-interested","not-sure"].includes(status)) body.replied_at = new Date().toISOString();
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    toast.success("Updated");
  }

  function ago(d: string) {
    const s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  }

  return (
    <div className="p-8 flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">CRM Pipeline</h1>
          <p className="text-white/40 text-sm mt-1">{leads.length} leads contacted</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchLeads}><RefreshCw size={14} /></button>
      </div>
      {loading ? <div className="text-center py-12 text-white/30">Loading...</div> : (
        <div className="grid grid-cols-4 gap-4 flex-1 overflow-hidden">
          {COLS.map(col => {
            const colLeads = leads.filter(l => col.key === "sent" ? (l.status === "sent" || l.status === "replied") : l.status === col.key)
              .sort((a, b) => new Date(b.sent_at!).getTime() - new Date(a.sent_at!).getTime());
            return (
              <div key={col.key} className="flex flex-col overflow-hidden">
                <div className={`flex items-center justify-between mb-3 pb-3 border-b ${col.border}`}>
                  <span className={`text-xs font-bold uppercase tracking-widest ${col.color}`}>{col.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${col.border} ${col.color}`}>{colLeads.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {!colLeads.length && <div className="border border-dashed border-white/10 rounded-lg p-4 text-center text-xs text-white/20">Empty</div>}
                  {colLeads.map(lead => (
                    <div key={lead.id} className="card p-3 group">
                      <div className="flex items-start justify-between mb-1.5">
                        <p className="text-sm font-medium">{lead.name}</p>
                        <span className={lead.group === "A" ? "badge-a" : "badge-b"}>{lead.group}</span>
                      </div>
                      <p className="font-mono text-[11px] text-white/30 mb-2">{lead.phone}</p>
                      {lead.site && <a href={lead.site} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue text-[11px] mb-2 hover:underline"><ExternalLink size={10} />{lead.site.replace("https://","").substring(0,24)}</a>}
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <span className="text-[10px] text-white/20">{lead.sent_at ? ago(lead.sent_at) : ""}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {col.key !== "interested" && <button onClick={() => move(lead.id, "interested")} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded hover:bg-accent/20">✓</button>}
                          {col.key !== "not-interested" && <button onClick={() => move(lead.id, "not-interested")} className="text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded hover:bg-danger/20">✗</button>}
                          {col.key !== "not-sure" && <button onClick={() => move(lead.id, "not-sure")} className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded">?</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
