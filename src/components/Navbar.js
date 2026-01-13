"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("auth_token");
      setIsLoggedIn(!!token);
    };
    
    checkAuth();
    
    // Listen for storage changes (logout in another tab)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-primary">
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
            <Link href="/" className="text-gray-700 hover:text-primary transition">Home</Link>
            <Link href="/universities" className="text-gray-700 hover:text-primary transition">Universities</Link>
            <Link href="/about" className="text-gray-700 hover:text-primary transition">About</Link>
            {isLoggedIn ? (
              <>
                <Link href="/profile" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Profile</Link>
                <button onClick={handleLogout} className="bg-danger text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Logout</button>
              </>
            ) : (
              <Link href="/auth" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Login / Register</Link>
            )}
          </nav>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 space-y-3">
            <Link href="/" className="block text-gray-700 hover:text-primary transition py-2">Home</Link>
            <Link href="/universities" className="block text-gray-700 hover:text-primary transition py-2">Universities</Link>
            <Link href="/about" className="block text-gray-700 hover:text-primary transition py-2">About</Link>
            {isLoggedIn ? (
              <>
                <Link href="/profile" className="block bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center">Profile</Link>
                <button onClick={handleLogout} className="w-full bg-danger text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">Logout</button>
              </>
            ) : (
              <Link href="/auth" className="block bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-center">Login / Register</Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
