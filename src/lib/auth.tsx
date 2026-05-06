"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

export type Role = "admin" | "manager" | "agent_b";

interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface AuthContext {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  canAccess: (feature: "settings" | "group_a" | "group_b" | "all") => boolean;
}

const Ctx = createContext<AuthContext>({
  user: null, loading: true,
  signIn: async () => null,
  signOut: async () => {},
  canAccess: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser(email: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("email", email)
      .single();
    return data?.role as Role || "agent_b";
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        const role = await loadUser(session.user.email);
        setUser({ id: session.user.id, email: session.user.email, role });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.email) {
        const role = await loadUser(session.user.email);
        setUser({ id: session.user.id, email: session.user.email, role });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  function canAccess(feature: "settings" | "group_a" | "group_b" | "all"): boolean {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (feature === "settings") return false; // manager and agent_b cannot access settings
    if (feature === "group_a") return user.role === "manager"; // only manager can access group A
    if (feature === "group_b") return true; // all roles can access group B
    if (feature === "all") return user.role === "manager";
    return false;
  }

  return <Ctx.Provider value={{ user, loading, signIn, signOut, canAccess }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
