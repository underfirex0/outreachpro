"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const err = await signIn(email, password);
    if (err) { setError(err); setLoading(false); return; }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-bg" />
          </div>
          <div className="font-display text-2xl font-bold">
            Outreach<span className="text-accent">Pro</span>
          </div>
        </div>

        <div className="card p-6">
          <h1 className="font-display font-bold text-lg mb-1">Sign in</h1>
          <p className="text-white/40 text-sm mb-6">Access your outreach dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
