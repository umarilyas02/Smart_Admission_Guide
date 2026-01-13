"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMessage({ type: "success", text: data.message });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-12">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Reset password</p>
          <h1 className="text-2xl font-semibold">Enter token and new password</h1>
          <p className="text-sm text-slate-400">Paste the token from the reset email link.</p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg ring-1 ring-slate-800/50"
        >
          <label className="grid gap-2 text-sm text-slate-200">
            <span>Reset token</span>
            <textarea
              value={token}
              required
              onChange={(e) => setToken(e.target.value)}
              className="min-h-[120px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none ring-1 ring-transparent transition focus:ring-sky-500"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-200">
              <span>New password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none ring-1 ring-transparent transition focus:ring-sky-500"
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-200">
              <span>Confirm password</span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none ring-1 ring-transparent transition focus:ring-sky-500"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-sky-500 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === "success" ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="text-sm text-slate-400">
          Back to <a className="text-sky-400 hover:underline" href="/auth">/auth</a>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
