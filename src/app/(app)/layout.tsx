"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Send, MessageSquare, BarChart2, Settings, Zap, Wifi, WifiOff, LogOut, UsersRound } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, loading, signOut, canAccess } = useAuth();
  const [waStatus, setWaStatus] = useState<"connected"|"disconnected"|"loading">("loading");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

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

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-white/30 text-sm">Loading...</div>
    </div>
  );

  if (!user) return null;

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/leads", label: "Leads", icon: Users, show: true },
    { href: "/send", label: "Send", icon: Send, show: true },
    { href: "/crm", label: "CRM", icon: MessageSquare, show: true },
    { href: "/ab", label: "A/B Results", icon: BarChart2, show: true },
    { href: "/settings", label: "Settings", icon: Settings, show: canAccess("settings") },
    { href: "/team", label: "Team", icon: UsersRound, show: user.role === "admin" },
  ].filter(n => n.show);

  const roleColors: Record<string, string> = { admin: "text-accent", manager: "text-blue", agent_b: "text-warm" };
  const roleLabels: Record<string, string> = { admin: "Admin", manager: "Manager", agent_b: "Agent B" };

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

        <div className="p-3 border-t border-white/[0.07] space-y-2">
          <div className="px-3 py-2 bg-surface2 rounded-lg">
            <div className={`text-[11px] font-bold uppercase tracking-wide ${roleColors[user.role]}`}>{roleLabels[user.role]}</div>
            <div className="text-[11px] text-white/30 truncate">{user.email}</div>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 bg-surface2 rounded-lg">
            {waStatus === "connected" ? <Wifi size={14} className="text-accent" /> : <WifiOff size={14} className="text-danger" />}
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium">{waStatus === "loading" ? "Checking..." : waStatus === "connected" ? "WhatsApp OK" : "WA Disconnected"}</div>
            </div>
            {waStatus === "connected" && <div className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />}
          </div>
          <button onClick={() => { signOut(); router.push("/login"); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-white/40 hover:text-danger hover:bg-danger/10 rounded-lg transition-all">
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
