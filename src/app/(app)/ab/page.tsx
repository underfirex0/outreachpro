"use client";
import { useEffect, useState } from "react";

interface Stats {
  total: number; sent: number; replied: number; interested: number; replyRate: number; convRate: number;
  a: { sent: number; replied: number; interested: number; replyRate: number; convRate: number };
  b: { sent: number; replied: number; interested: number; replyRate: number; convRate: number };
}

export default function ABPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { fetch("/api/stats").then(r => r.json()).then(setStats); }, []);
  const s = stats;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">A/B Test Results</h1>
        <p className="text-white/40 text-sm mt-1">Compare message performance</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {(["A","B"] as const).map(g => {
          const data = g === "A" ? s?.a : s?.b;
          const color = g === "A" ? "#4ADE80" : "#60A5FA";
          return (
            <div key={g} className="card p-6" style={{ borderTop: `2px solid ${color}` }}>
              <div className="flex items-center gap-2 mb-6"><span className={g === "A" ? "badge-a" : "badge-b"}>MESSAGE {g}</span></div>
              <div className="grid grid-cols-2 gap-6">
                {[{ label: "Sent", value: data?.sent ?? 0 }, { label: "Replied", value: data?.replied ?? 0 }, { label: "Reply Rate", value: `${data?.replyRate ?? 0}%` }, { label: "Interested", value: data?.interested ?? 0 }].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-display text-3xl font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs text-white/30 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {s && s.a.sent > 0 && s.b.sent > 0 && (
        <div className="card p-6 mb-4">
          <h2 className="font-display font-bold mb-4">Comparison</h2>
          {[{ label: "Reply Rate", a: s.a.replyRate, b: s.b.replyRate }, { label: "Conversion", a: s.a.convRate, b: s.b.convRate }].map(({ label, a, b }) => (
            <div key={label} className="mb-4">
              <div className="flex justify-between text-xs text-white/40 mb-2"><span>{label}</span><span>A: {a}% · B: {b}%</span></div>
              <div className="space-y-1.5">
                {[{ g: "A", val: a, color: "#4ADE80" }, { g: "B", val: b, color: "#60A5FA" }].map(({ g, val, color }) => (
                  <div key={g} className="flex items-center gap-2">
                    <span className="text-xs w-4" style={{ color }}>{g}</span>
                    <div className="flex-1 h-2 bg-surface2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(val, 100)}%`, background: color }} />
                    </div>
                    <span className="text-xs text-white/40 w-8 text-right">{val}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="card p-5 flex items-center gap-4">
        <span className="text-3xl">🏆</span>
        <div>
          <p className="font-display font-bold text-base">
            {!s || (s.a.sent < 10 && s.b.sent < 10) ? "Send more to see results" :
             s.a.sent < 10 || s.b.sent < 10 ? "Need more data for both groups" :
             Math.abs(s.a.replyRate - s.b.replyRate) < 3 ? "Too close to call!" :
             s.a.replyRate > s.b.replyRate ? "Message A is winning! 🎉" : "Message B is winning! 🎉"}
          </p>
          {s && <p className="text-sm text-white/40 mt-0.5">A: {s.a.replyRate}% · B: {s.b.replyRate}% reply rate</p>}
        </div>
      </div>
    </div>
  );
}
