"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import ValidatedInput from "@/components/ValidatedInput";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [token, setToken] = useState(null);
  const googleButtonRef = useRef(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const saved = localStorage.getItem("auth_token");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (!googleClientId) return;

    const initializeGsi = () => {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
      });
    };

    if (window.google?.accounts?.id) {
      initializeGsi();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGsi;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [googleClientId]);

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const payload =
      mode === "login"
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
        setMessage({ type: "success", text: data.message || "Login successful!" });
        // Redirect to homepage after short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        setMessage({ type: "success", text: data.message || `Success: ${mode}` });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google login failed");

      localStorage.setItem("auth_token", data.token);
      setMessage({ type: "success", text: data.message || "Login successful!" });
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setMessage({ type: "success", text: "Logged out successfully." });
  };

  return (
    <div className="bg-secondary min-h-screen font-inter">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-xl shadow-lg fade-in">
          {/* Mode Toggle */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-medium transition ${
                mode === "login"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                mode === "register"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Register
            </button>
          </div>

          <h2 className="text-3xl font-bold text-center text-primary">
            {mode === "login" ? "Login" : "Create Account"}
          </h2>
          <p className="text-center text-gray-600 mt-2">
            {mode === "login"
              ? "Access your Smart Admission Guide account"
              : "Start your smart admission journey"}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <ValidatedInput
                type="name"
                label="Full Name"
                value={form.name}
                onChange={onChange("name")}
                required
                placeholder="Enter your name"
              />
            )}

            <ValidatedInput
              type="email"
              label="Email"
              value={form.email}
              onChange={onChange("email")}
              required
              placeholder="Enter your email"
            />

            <ValidatedInput
              type="password"
              label="Password"
              value={form.password}
              onChange={onChange("password")}
              placeholder={mode === "login" ? "Enter your password" : "Create password"}
              required
              showPasswordStrength={mode === "register"}
            />

            {mode === "register" && (
              <ValidatedInput
                type="confirm-password"
                label="Confirm Password"
                value={form.confirmPassword}
                onChange={onChange("confirmPassword")}
                compareValue={form.password}
                placeholder="Confirm password"
                required
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
            </button>
          </form>

          <div className="mt-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="flex-1 h-px bg-gray-200" />
              <span>or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="mt-3">
              {googleClientId ? (
                <div ref={googleButtonRef} className="flex justify-center" />
              ) : (
                <div className="text-center text-xs text-gray-500">
                  Google sign-in is not configured.
                </div>
              )}
            </div>
          </div>

          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm text-center ${
                message.type === "success"
                  ? "bg-success/10 text-success border border-success/20"
                  : "bg-danger/10 text-danger border border-danger/20"
              }`}
            >
              {message.text}
            </div>
          )}

          {mode === "login" && (
            <p className="text-center text-gray-600 mt-4 text-sm">
              Forgot your password?{" "}
              <a href="/auth/forgot-password" className="text-primary font-semibold hover:underline">
                Reset it here
              </a>
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
          <p>&copy; 2026 Smart Admission Guide. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
