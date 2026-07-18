"use client";

import { useEffect } from "react";

// Wraps window.fetch once so an expired/invalid session (401 from any
// /api/* route, except the auth endpoints themselves) logs the user out
// and sends them to the login page — no matter which page triggered it.
export default function SessionGuard() {
  useEffect(() => {
    if (window.__sessionGuardInstalled) return;
    window.__sessionGuardInstalled = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const res = await originalFetch(...args);

      if (res.status === 401) {
        const input = args[0];
        const url = typeof input === "string" ? input : input?.url || "";
        const isApiCall = url.startsWith("/api/") || url.includes("/api/");
        const isAuthEndpoint = url.includes("/api/auth/");

        if (isApiCall && !isAuthEndpoint && !window.location.pathname.startsWith("/auth")) {
          localStorage.removeItem("auth_token");
          originalFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          window.location.href = "/auth?mode=login";
        }
      }

      return res;
    };
  }, []);

  return null;
}
