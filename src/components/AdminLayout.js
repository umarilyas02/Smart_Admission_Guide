"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatbotWidget from "./ChatbotWidget";

const ADMIN_EMAIL = "smartadmissionguide@gmail.com";

function decodeToken(token) {
  try {
    const base64Url = token.split(".")[1];
    // JWT uses base64url (- and _ instead of + and /), atob needs standard base64
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export default function AdminLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }
    const decoded = decodeToken(token);
    if (!decoded || decoded.email !== ADMIN_EMAIL) {
      router.push("/");
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-secondary min-h-screen font-inter flex flex-col">
      <Navbar />
      <main className="grow">{children}</main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
