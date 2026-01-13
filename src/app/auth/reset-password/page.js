"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Navbar from "@/components/Navbar";
import PasswordInput from "@/components/PasswordInput";

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
    <div className="bg-secondary min-h-screen font-inter">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-xl shadow-lg fade-in">
          <h2 className="text-3xl font-bold text-center text-primary">
            Reset Password
          </h2>
          <p className="text-center text-gray-600 mt-2">
            Enter your new password below
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-gray-700 font-medium">Reset Token</label>
              <textarea
                value={token}
                required
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from email"
                rows="3"
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none font-mono text-sm"
              />
            </div>

            <PasswordInput
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />

            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

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

          <p className="text-center text-gray-600 mt-4">
            Back to
            <a href="/auth" className="text-primary font-semibold hover:underline ml-1">
              Login
            </a>
          </p>
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
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
