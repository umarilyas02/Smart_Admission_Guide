"use client";

import { useEffect, useState } from "react";

const initialState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("auth_token");
    if (saved) setToken(saved);
  }, []);

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const payload = mode === "login"
      ? { email: form.email, password: form.password }
      : {
          name: form.name,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      if (mode === "login" && data.token) {
        localStorage.setItem("auth_token", data.token);
        setToken(data.token);
      }

      setMessage({ type: "success", text: data.message || `Success: ${mode}` });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setMessage({ type: "success", text: "Logged out and token cleared." });
  };

  const fields = mode === "login"
    ? [
        { label: "Email", value: form.email, onChange: onChange("email"), type: "email" },
        { label: "Password", value: form.password, onChange: onChange("password"), type: "password" },
      ]
    : [
        { label: "Name", value: form.name, onChange: onChange("name") },
        { label: "Email", value: form.email, onChange: onChange("email"), type: "email" },
        { label: "Password", value: form.password, onChange: onChange("password"), type: "password" },
        { label: "Confirm Password", value: form.confirmPassword, onChange: onChange("confirmPassword"), type: "password" },
      ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Auth Sandbox</p>
            <h1 className="text-2xl font-semibold">{mode === "login" ? "Login" : "Create account"}</h1>
            <p className="text-sm text-slate-400">Hits the Next.js API routes you set up.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("login")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "login" ? "bg-white text-slate-900" : "bg-slate-800 text-slate-200"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "signup" ? "bg-white text-slate-900" : "bg-slate-800 text-slate-200"
              }`}
            >
              Signup
            </button>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg ring-1 ring-slate-800/50"
        >
          <div className="grid gap-4">
            {fields.map((field) => (
              <label key={field.label} className="grid gap-2 text-sm text-slate-200">
                <span>{field.label}</span>
                <input
                  type={field.type || "text"}
                  value={field.value}
                  onChange={field.onChange}
                  required
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none ring-1 ring-transparent transition focus:ring-sky-500"
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-sky-500 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Working..." : mode === "login" ? "Login" : "Create account"}
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

        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-200 ring-1 ring-slate-800/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Session token</p>
              <p className="text-slate-400">Stored in localStorage as auth_token</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-500"
            >
              Logout / clear token
            </button>
          </div>
          <div className="mt-3 rounded border border-slate-800 bg-black/40 p-3 font-mono text-xs text-slate-100">
            {token ? `${token.slice(0, 32)}...` : "No token saved yet."}
          </div>
        </section>

        <div className="text-sm text-slate-400">
          Forgot password? Go to <a className="text-sky-400 hover:underline" href="/auth/forgot-password">/auth/forgot-password</a>.
        </div>
      </div>
    </div>
  );
}
