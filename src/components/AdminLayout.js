"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatbotWidget from "./ChatbotWidget";
import { Toaster } from "sonner";

const ADMIN_EMAIL = "smartadmissionguide@gmail.com";

export default function AdminLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        if (!data.authenticated || data.user?.email !== ADMIN_EMAIL) {
          router.push("/");
          return;
        }
      } catch {
        router.push("/auth?mode=login");
        return;
      }
      setLoading(false);
    };

    checkAuth();
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
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
