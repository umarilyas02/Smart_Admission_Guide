"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
            Forgot Password?
          </h2>
          <p className="text-center text-gray-600 mt-2">
            Enter your email to receive a password reset link
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-gray-700 font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Sending..." : "Send Reset Link"}
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
            Remember your password?
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
