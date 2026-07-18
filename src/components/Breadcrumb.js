"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS = {
  about: "About",
  quiz: "Quiz",
  universities: "Universities",
  "application-pack": "Application Pack",
  "admission-probability": "Admission Probability",
  "academic-background": "Academic Background",
  "test-cases": "Test Cases",
  auth: "Login",
  "forgot-password": "Forgot Password",
  "reset-password": "Reset Password",
  dashboard: "Dashboard",
  "profile-progress": "Profile Progress",
  notifications: "Notifications",
  admin: "Admin",
  programs: "Programs",
  students: "Students",
  "entry-tests": "Entry Tests",
  "chatbot-queries": "Chatbot Queries",
  settings: "Settings",
  "test-emails": "Email Testing",
};

export default function Breadcrumb({ items }) {
  const pathname = usePathname();

  const crumbs = items ?? (() => {
    const segments = pathname.split("/").filter(Boolean);
    const result = [{ label: "Home", href: "/" }];
    let currentPath = "";
    for (const seg of segments) {
      currentPath += `/${seg}`;
      result.push({ label: SEGMENT_LABELS[seg] ?? seg, href: currentPath });
    }
    return result;
  })();

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm text-gray-400 mb-6 flex-wrap">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
            {isLast ? (
              <span className="text-gray-600 font-medium flex items-center gap-1">
                {i === 0 && <Home className="w-3.5 h-3.5" />}
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="hover:text-primary transition flex items-center gap-1">
                {i === 0 && <Home className="w-3.5 h-3.5" />}
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
