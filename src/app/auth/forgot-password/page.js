"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ValidatedInput from "@/components/ValidatedInput";
import Breadcrumb from "@/components/Breadcrumb";
import { validate } from "@/lib/validators";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const router = useRouter();
  const isSubmitDisabled = Boolean(loading || validate("email", email, { required: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitDisabled) return;
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
      // Send the user to reset-password with their email prefilled
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
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

      <div className="max-w-md mx-auto px-4 pt-6">
        <Breadcrumb />
      </div>

      {/* Main Content */}
      <main className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-xl shadow-lg fade-in">
          <h2 className="text-3xl font-bold text-center text-primary">
            Forgot Password?
          </h2>
          <p className="text-center text-gray-600 mt-2">
            Enter your email to receive a 6-digit OTP
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <ValidatedInput
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Sending..." : "Send OTP"}
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
