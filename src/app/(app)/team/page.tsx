"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";

interface UserRole { email: string; role: string; created_at: string; }

export default function TeamPage() {
  const { user, canAccess } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "agent_b" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !canAccess("settings")) { router.push("/dashboard"); return; }
    fetchUsers();
  }, [user]);

  async function fetchUsers() {
    const res = await fetch("/api/users");
    setUsers(await res.json());
  }

  async function addUser() {
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) { toast.error(data.error); setLoading(false); return; }
    toast.success(`${form.email} added as ${form.role}`);
    setShowAdd(false);
    setForm({ email: "", password: "", role: "agent_b" });
    fetchUsers();
    setLoading(false);
  }

  async function removeUser(email: string) {
    await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    toast.success("User removed");
    fetchUsers();
  }

  const roleColors: Record<string, string> = { admin: "text-accent badge-a", manager: "text-blue badge-b", agent_b: "text-warm" };
  const roleLabels: Record<string, string> = { admin: "Admin", manager: "Manager", agent_b: "Agent B" };

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-white/40 text-sm mt-1">Manage team access and roles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Member</button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { role: "admin", label: "Admin", desc: "Full access — sees everything, can do everything including Settings and Team management" },
          { role: "manager", label: "Manager", desc: "Full access except Settings — sees all leads (A+B), can send, manage CRM" },
          { role: "agent_b", label: "Agent B", desc: "Limited access — sees only Group B leads, no Settings, no Group A" },
        ].map(({ role, label, desc }) => (
          <div key={role} className="card p-4">
            <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${role === "admin" ? "text-accent" : role === "manager" ? "text-blue" : "text-warm"}`}>{label}</div>
            <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center gap-2">
          <Users size={15} className="text-white/40" />
          <span className="font-display font-bold text-sm">{users.length} Members</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.07]">
              {["Email","Role","Added",""].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/30">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!users.length ? (
              <tr><td colSpan={4} className="text-center py-12 text-white/30 text-sm">No team members yet</td></tr>
            ) : users.map(u => (
              <tr key={u.email} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-sm font-medium">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${u.role === "admin" ? "bg-accent/10 text-accent" : u.role === "manager" ? "bg-blue/10 text-blue" : "bg-warm/10 text-warm"}`}>
                    {roleLabels[u.role]}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-white/30">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  {u.email !== user?.email && (
                    <button onClick={() => removeUser(u.email)} className="btn btn-ghost btn-sm text-danger hover:bg-danger/10"><Trash2 size={12} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-surface border border-white/10 rounded-2xl w-[440px] p-6" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-5">Add Team Member</h2>
            <div className="space-y-4">
              <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="colleague@email.com" /></div>
              <div><label className="label">Password *</label><input className="input" type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="••••••••" /></div>
              <div>
                <label className="label">Role *</label>
                <div className="flex gap-2">
                  {(["admin","manager","agent_b"] as const).map(r => (
                    <button key={r} onClick={() => setForm(f => ({...f, role: r}))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${form.role === r ? r === "admin" ? "bg-accent/20 text-accent border border-accent/30" : r === "manager" ? "bg-blue/20 text-blue border border-blue/30" : "bg-warm/20 text-warm border border-warm/30" : "bg-surface2 text-white/40 border border-white/10"}`}>
                      {r === "agent_b" ? "Agent B" : r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addUser} disabled={loading}>{loading ? "Adding..." : "Add Member"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
