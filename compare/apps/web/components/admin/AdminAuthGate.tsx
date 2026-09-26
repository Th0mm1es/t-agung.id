"use client";

import { useState, useEffect, ReactNode } from "react";

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check existing session on load
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth");
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(data.authenticated === true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Passcode salah.");
      }

      setIsAuthenticated(true);
      setPasscode("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } finally {
      setIsAuthenticated(false);
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-white/40 text-sm font-medium animate-pulse">
          Memeriksa izin sesi admin...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-2xl shadow-inner">
              🔒
            </div>
            <h1 className="text-xl font-display font-bold text-white tracking-tight">
              Portal Admin Terproteksi
            </h1>
            <p className="text-xs text-white/50 leading-relaxed">
              Masukkan Admin Passcode untuk mengakses dashboard data governance dan review proposal komunitas.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Admin Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Masukkan passcode admin..."
                className="w-full px-4 py-3 bg-slate-950 border border-white/15 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !passcode.trim()}
              className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Buka Portal Admin</span>
                  <span>🔓</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center text-[11px] text-white/35">
            BandingHidup Data Governance Engine · compare.t-agung.id
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Session indicator bar */}
      <div className="bg-slate-900 border-b border-white/10 px-4 py-2 text-xs text-white/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-white/80">Sesi Admin Aktif</span>
          <span className="text-white/30">|</span>
          <span className="text-white/40">compare.t-agung.id</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium flex items-center gap-1"
        >
          <span>Keluar</span>
          <span>🚪</span>
        </button>
      </div>
      {children}
    </div>
  );
}
