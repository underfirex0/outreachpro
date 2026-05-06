"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Upload, Trash2, ExternalLink, Search, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import type { Lead } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  unsent: "text-white/40", sent: "text-blue-400", replied: "text-warm",
  interested: "text-accent", "not-interested": "text-danger", "not-sure": "text-yellow-400",
};
const STATUS_LABELS: Record<string, string> = {
  unsent: "No Answer Yet", sent: "Sent", replied: "Replied",
  interested: "Interested", "not-interested": "Not Interested", "not-sure": "Not Sure",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<"all"|"A"|"B">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", site: "", group: "A" as "A"|"B" });
  const [csvData, setCsvData] = useState("");
  const [importGroup, setImportGroup] = useState<"A"|"B">("A");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (groupFilter !== "all") params.set("group", groupFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/leads?${params}`);
    setLeads(await res.json());
    setLoading(false);
  }, [groupFilter, search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function addLead() {
    if (!addForm.name || !addForm.phone) { toast.error("Name and phone required"); return; }
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm) });
    if (!res.ok) { toast.error("Failed to add"); return; }
    toast.success(`${addForm.name} added to Group ${addForm.group}`);
    setShowAdd(false);
    setAddForm({ name: "", phone: "", site: "", group: "A" });
    fetchLeads();
  }

  async function deleteLead(id: string) {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    fetchLeads();
  }

  async function updateStatus(id: string, status: string) {
    const body: Record<string, string> = { status };
    if (["replied","interested","not-interested","not-sure"].includes(status)) body.replied_at = new Date().toISOString();
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    fetchLeads();
  }

  async function importCSV() {
    if (!csvData.trim()) { toast.error("Paste CSV data first"); return; }
    const lines = csvData.trim().split("\n");
    const hasHeader = lines[0].toLowerCase().includes("name");
    const data = (hasHeader ? lines.slice(1) : lines).map(line => {
      const parts = line.split(",").map(p => p.trim().replace(/^"|"$/g, ""));
      return { name: parts[0], phone: parts[1], site: parts[2] || "" };
    }).filter(l => l.name && l.phone);
    const res = await fetch("/api/leads/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leads: data, group: importGroup }) });
    const result = await res.json();
    toast.success(`${result.imported} leads imported to Group ${importGroup}`);
    setShowImport(false); setCsvData(""); fetchLeads();
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-white/40 text-sm mt-1">{leads.length} total</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setShowImport(true)}><Upload size={14} /> Import CSV</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Lead</button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="input pl-8" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-surface2 rounded-lg p-1">
          {(["all","A","B"] as const).map(g => (
            <button key={g} onClick={() => setGroupFilter(g)} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${groupFilter === g ? "bg-surface text-white shadow" : "text-white/40 hover:text-white"}`}>
              {g === "all" ? "All" : `Group ${g}`}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchLeads}><RefreshCw size={13} /></button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.07]">
              {["Business","Phone","Website","Group","Status",""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-white/30 text-sm">Loading...</td></tr>
            ) : !leads.length ? (
              <tr><td colSpan={6} className="text-center py-12 text-white/30 text-sm">No leads — add some or import CSV</td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium text-sm">{lead.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-white/50">{lead.phone}</td>
                <td className="px-4 py-3">
                  {lead.site ? (
                    <a href={lead.site} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue text-xs hover:underline">
                      <ExternalLink size={10} />{lead.site.replace("https://","").substring(0,28)}
                    </a>
                  ) : <span className="text-white/20 text-xs">—</span>}
                </td>
                <td className="px-4 py-3"><span className={lead.group === "A" ? "badge-a" : "badge-b"}>{lead.group}</span></td>
                <td className="px-4 py-3">
                  <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                    className={`text-xs font-semibold bg-transparent border-0 outline-none cursor-pointer ${STATUS_COLORS[lead.status]}`}>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v} className="bg-surface2 text-white">{l}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => deleteLead(lead.id)} className="btn btn-ghost btn-sm text-danger hover:bg-danger/10"><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-surface border border-white/10 rounded-2xl w-[480px] p-6" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">Add Lead</h2>
            <div className="space-y-4">
              <div><label className="label">Business Name *</label><input className="input" value={addForm.name} onChange={e => setAddForm(f => ({...f, name: e.target.value}))} placeholder="Kaiser Gym" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Phone *</label><input className="input" value={addForm.phone} onChange={e => setAddForm(f => ({...f, phone: e.target.value}))} placeholder="+212661234567" /></div>
                <div><label className="label">Website URL</label><input className="input" value={addForm.site} onChange={e => setAddForm(f => ({...f, site: e.target.value}))} placeholder="https://..." /></div>
              </div>
              <div>
                <label className="label">Group</label>
                <div className="flex gap-2">
                  {(["A","B"] as const).map(g => (
                    <button key={g} onClick={() => setAddForm(f => ({...f, group: g}))}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${addForm.group === g ? g === "A" ? "bg-accent/20 text-accent border border-accent/30" : "bg-blue/20 text-blue border border-blue/30" : "bg-surface2 text-white/40 border border-white/10"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addLead}>Add Lead</button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowImport(false)}>
          <div className="bg-surface border border-white/10 rounded-2xl w-[560px] p-6" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">Import CSV</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Assign to Group</label>
                <div className="flex gap-2">
                  {(["A","B"] as const).map(g => (
                    <button key={g} onClick={() => setImportGroup(g)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${importGroup === g ? g === "A" ? "bg-accent/20 text-accent border border-accent/30" : "bg-blue/20 text-blue border border-blue/30" : "bg-surface2 text-white/40 border border-white/10"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">CSV Format</label>
                <div className="bg-surface2 rounded-lg p-3 font-mono text-xs text-white/40 mb-2">name,phone,website<br/>Kaiser Gym,+212661234567,https://kaiser-gym.yako.studio</div>
              </div>
              <div>
                <label className="label">Paste CSV Data</label>
                <textarea className="input" rows={6} value={csvData} onChange={e => setCsvData(e.target.value)} placeholder={"name,phone,website\nBusiness,+212661234567,https://..."} style={{ fontFamily: "monospace", fontSize: "12px" }} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowImport(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={importCSV}>Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
