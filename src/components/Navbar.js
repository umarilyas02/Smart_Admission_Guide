"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("auth_token");
      if (!token) { setIsLoggedIn(false); return; }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem("auth_token");
          setIsLoggedIn(false);
          return;
        }
      } catch {
        localStorage.removeItem("auth_token");
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
    };

    checkAuth();

    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setIsLoggedIn(false);
    router.push("/auth");
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
            Smart Admission Guide
          </Link>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700 hover:text-primary focus:outline-none"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          <nav className="hidden md:flex gap-6 items-center">
            <Link href="/about" className="text-gray-700 hover:text-primary transition">About</Link>
            <Link href="/universities" className="text-gray-700 hover:text-primary transition">Universities</Link>
            <Link href="/quiz" className="text-gray-700 hover:text-primary transition">Quiz</Link>
            <Link
              href={isLoggedIn ? "/application-pack" : "/auth?mode=login"}
              className="text-gray-700 hover:text-primary transition"
            >
              Application Pack
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-primary transition">Dashboard</Link>
                <button onClick={handleLogout} className="bg-danger text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth?mode=login" className="text-gray-700 hover:text-primary transition">Login</Link>
                <Link href="/auth?mode=register" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Register</Link>
              </>
            )}
          </nav>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 space-y-3">
            <Link href="/about" className="block text-gray-700 hover:text-primary transition py-2">About</Link>
            <Link href="/universities" className="block text-gray-700 hover:text-primary transition py-2">Universities</Link>
            <Link href="/quiz" className="block text-gray-700 hover:text-primary transition py-2">Quiz</Link>
            <Link
              href={isLoggedIn ? "/application-pack" : "/auth?mode=login"}
              className="block text-gray-700 hover:text-primary transition py-2"
            >
              Application Pack
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="block text-gray-700 hover:text-primary transition py-2">Dashboard</Link>
                <button onClick={handleLogout} className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth?mode=login" className="block text-gray-700 hover:text-primary transition py-2">Login</Link>
                <Link href="/auth?mode=register" className="block bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center">Register</Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
