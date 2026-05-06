"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Send, MessageSquare, BarChart2, Settings, Zap, Wifi, WifiOff } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/send", label: "Send", icon: Send },
  { href: "/crm", label: "CRM", icon: MessageSquare },
  { href: "/ab", label: "A/B Results", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [waStatus, setWaStatus] = useState<"connected"|"disconnected"|"loading">("loading");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/wa-status");
        const data = await res.json();
        setWaStatus(data.status === "connected" ? "connected" : "disconnected");
      } catch { setWaStatus("disconnected"); }
    };
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[220px] flex-shrink-0 bg-surface border-r border-white/[0.07] flex flex-col">
        <div className="px-5 py-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-bg" />
            </div>
            <div>
              <div className="font-display font-bold text-[15px]">Outreach<span className="text-accent">Pro</span></div>
              <div className="text-[10px] text-white/30 tracking-widest uppercase">WA Sales System</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${active ? "bg-accent/10 text-accent border border-accent/20" : "text-white/50 hover:bg-surface2 hover:text-white"}`}>
                <Icon size={15} className={active ? "text-accent" : "text-white/40"} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-surface2 rounded-lg">
            {waStatus === "connected" ? <Wifi size={14} className="text-accent" /> : <WifiOff size={14} className="text-danger" />}
            <div>
              <div className="text-[12px] font-medium">{waStatus === "loading" ? "Checking..." : waStatus === "connected" ? "WhatsApp OK" : "WA Disconnected"}</div>
              <div className="text-[10px] text-white/30">{waStatus === "connected" ? "Bot active" : "Check settings"}</div>
            </div>
            {waStatus === "connected" && <div className="ml-auto w-2 h-2 rounded-full bg-accent animate-pulse" />}
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
