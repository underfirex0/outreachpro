"use client";
import { useEffect, useState } from "react";
import { Save, Wifi, WifiOff } from "lucide-react";
import toast from "react-hot-toast";

interface Settings { msg_a: string; msg_b: string; wa_url: string; wa_key: string; send_delay: number; }

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>({ msg_a: "", msg_b: "", wa_url: "http://136.117.247.136:3001", wa_key: "buildfactory-secret-key", send_delay: 4 });
  const [waTest, setWaTest] = useState<"idle"|"testing"|"ok"|"fail">("idle");

  useEffect(() => { fetch("/api/settings").then(r => r.json()).then(d => { if (d?.msg_a) setForm(d); }); }, []);

  async function save() {
    const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) toast.success("Saved!"); else toast.error("Failed");
  }

  async function testWA() {
    setWaTest("testing");
    try {
      const res = await fetch(`${form.wa_url}/status?key=${form.wa_key}`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      setWaTest(data.status === "connected" ? "ok" : "fail");
    } catch { setWaTest("fail"); }
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-white/40 text-sm mt-1">Configure messages and WhatsApp</p>
        </div>
        <button className="btn btn-primary" onClick={save}><Save size={14} /> Save</button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {(["A","B"] as const).map(g => (
          <div key={g} className="card p-5" style={{ borderTop: `2px solid ${g === "A" ? "#4ADE80" : "#60A5FA"}` }}>
            <div className="flex items-center gap-2 mb-3">
              <span className={g === "A" ? "badge-a" : "badge-b"}>MESSAGE {g}</span>
              <span className="text-xs text-white/30">Variables: {"{name}"} {"{link}"}</span>
            </div>
            <textarea className="input text-xs leading-relaxed" rows={12} value={g === "A" ? form.msg_a : form.msg_b}
              onChange={e => setForm(f => g === "A" ? {...f, msg_a: e.target.value} : {...f, msg_b: e.target.value})}
              style={{ fontFamily: "monospace", resize: "vertical" }} />
          </div>
        ))}
      </div>

      <div className="card p-5 mb-4">
        <h2 className="font-display font-bold text-sm mb-4">WhatsApp Server</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><label className="label">Server URL</label><input className="input" value={form.wa_url} onChange={e => setForm(f => ({...f, wa_url: e.target.value}))} /></div>
          <div><label className="label">API Key</label><input className="input" type="password" value={form.wa_key} onChange={e => setForm(f => ({...f, wa_key: e.target.value}))} /></div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary" onClick={testWA} disabled={waTest === "testing"}>{waTest === "testing" ? "Testing..." : "Test Connection"}</button>
          {waTest === "ok" && <span className="flex items-center gap-1.5 text-accent text-sm"><Wifi size={14} /> Connected!</span>}
          {waTest === "fail" && <span className="flex items-center gap-1.5 text-danger text-sm"><WifiOff size={14} /> Cannot connect</span>}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-bold text-sm mb-4">Send Delay</h2>
        <div className="max-w-xs">
          <label className="label">Seconds between messages</label>
          <input className="input" type="number" min={2} max={30} value={form.send_delay} onChange={e => setForm(f => ({...f, send_delay: parseInt(e.target.value) || 4}))} />
          <p className="text-xs text-white/30 mt-1.5">Minimum 3s to avoid WhatsApp ban</p>
        </div>
      </div>
    </div>
  );
}
