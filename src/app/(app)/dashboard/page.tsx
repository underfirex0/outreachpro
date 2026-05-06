"use client";
import { useEffect, useState } from "react";
import { TrendingUp, Users, Send, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Stats {
  total: number; sent: number; replied: number; interested: number;
  replyRate: number; convRate: number;
  a: { sent: number; replied: number; interested: number; replyRate: number; convRate: number };
  b: { sent: number; replied: number; interested: number; replyRate: number; convRate: number };
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { fetch("/api/stats").then(r => r.json()).then(setStats); }, []);
  const s = stats;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Campaign performance overview</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads" className="btn btn-secondary">Add Leads</Link>
          <Link href="/send" className="btn btn-primary"><Send size={14} /> Send Campaign</Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Leads", value: s?.total ?? 0, icon: Users, color: "text-white" },
          { label: "Sent", value: s?.sent ?? 0, icon: Send, color: "text-blue" },
          { label: "Replied", value: s?.replied ?? 0, sub: `${s?.replyRate ?? 0}% rate`, icon: MessageSquare, color: "text-warm" },
          { label: "Interested", value: s?.interested ?? 0, sub: `${s?.convRate ?? 0}% conv`, icon: TrendingUp, color: "text-accent" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
              <Icon size={15} className={`${color} opacity-60`} />
            </div>
            <p className={`font-display text-3xl font-bold tracking-tight ${color}`}>{value}</p>
            {sub && <p className="text-[12px] text-white/30 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {(["A","B"] as const).map(g => {
          const data = g === "A" ? s?.a : s?.b;
          const color = g === "A" ? "#4ADE80" : "#60A5FA";
          return (
            <div key={g} className="card p-5" style={{ borderTop: `2px solid ${color}` }}>
              <div className="flex items-center gap-2 mb-4">
                <span className={g === "A" ? "badge-a" : "badge-b"}>MESSAGE {g}</span>
                <span className="text-xs text-white/40">{g === "A" ? "Short & direct" : "Detailed & social proof"}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[{ label: "Sent", value: data?.sent ?? 0 }, { label: "Replied", value: data?.replied ?? 0 }, { label: "Reply Rate", value: `${data?.replyRate ?? 0}%` }].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {s && (s.a.sent >= 10 || s.b.sent >= 10) && (
        <div className="card p-5 flex items-center gap-4">
          <span className="text-3xl">🏆</span>
          <div>
            <p className="font-display font-bold text-base">
              {s.a.sent < 10 || s.b.sent < 10 ? "Not enough data yet" :
               Math.abs(s.a.replyRate - s.b.replyRate) < 3 ? "Too close to call!" :
               s.a.replyRate > s.b.replyRate ? "Message A is winning! 🎉" : "Message B is winning! 🎉"}
            </p>
            <p className="text-sm text-white/40 mt-0.5">A: {s.a.replyRate}% · B: {s.b.replyRate}% reply rate</p>
          </div>
        </div>
      )}
    </div>
  );
}
