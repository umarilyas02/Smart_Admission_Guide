"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { useState } from "react";

const allLinks = [
  {
    heading: "Tools",
    items: [
      { label: "Career Guidance",    href: "/quiz" },
      { label: "University Search",  href: "/universities" },
      { label: "Application Pack",   href: "/application-pack" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About",    href: "/about" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Login",    href: "/auth?mode=login" },
      { label: "Register", href: "/auth?mode=register" },
    ],
  },
];

export default function Footer() {
  const [isLoggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 > Date.now();
      } catch {
        return false;
      }
    }
    return false;
  });

  const links = isLoggedIn ? allLinks.filter((g) => g.heading !== "Account") : allLinks;

  return (
    <footer className="bg-gray-900 text-gray-400" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg" aria-label="Admission Compass Pakistan home">
            <GraduationCap className="w-6 h-6 text-blue-400" aria-hidden="true" />
            Admission Compass Pakistan
          </Link>
          <p className="text-sm leading-relaxed">
            AI-powered university and program matching for Pakistani intermediate students.
          </p>
        </div>

        {/* Nav columns */}
        {links.map(({ heading, items }) => (
          <nav key={heading} aria-label={`${heading} links`}>
            <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">{heading}</h3>
            <ul className="space-y-2 list-none p-0 m-0">
              {items.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm hover:text-white transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-gray-800 py-5 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} Admission Compass Pakistan — Final Year Project
      </div>
    </footer>
  );
}
