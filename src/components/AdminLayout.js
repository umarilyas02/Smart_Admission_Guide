"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatbotWidget from "./ChatbotWidget";

export default function AdminLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }
    // In production, verify token and check admin role via API
    setTimeout(() => setLoading(false), 0);
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
