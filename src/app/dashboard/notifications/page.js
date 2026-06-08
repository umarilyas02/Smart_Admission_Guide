"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Clock, BarChart2, Lightbulb, CheckCircle,
  Megaphone, Trash2, Check, Loader2, ArrowLeft, Inbox,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

const TYPE_META = {
  deadline:       { icon: Clock,       color: "text-red-500",    bg: "bg-red-50",    border: "border-red-200"   },
  merit:          { icon: BarChart2,   color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
  recommendation: { icon: Lightbulb,  color: "text-yellow-500", bg: "bg-yellow-50", border: "border-yellow-200" },
  update:         { icon: Bell,        color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-200"  },
  success:        { icon: CheckCircle, color: "text-green-500",  bg: "bg-green-50",  border: "border-green-200" },
};

const DEFAULT_META = { icon: Megaphone, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" };

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60)  return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60)        return `${m} minute${m !== 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24)        return `${h} hour${h !== 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d !== 1 ? "s" : ""} ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionId,      setActionId]      = useState(null); // id currently being acted on
  const [markingAll,    setMarkingAll]    = useState(false);
  const router = useRouter();

  const token = () => localStorage.getItem("auth_token");
  const authHeader = () => ({ Authorization: `Bearer ${token()}` });

  const fetchNotifications = useCallback(async () => {
    const t = token();
    if (!t) { router.push("/auth?mode=login"); return; }

    try {
      const res  = await fetch("/api/notifications", { headers: authHeader() });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id) => {
    setActionId(id);
    await fetch(`/api/notifications/${id}`, { method: "PATCH", headers: authHeader() });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setActionId(null);
  };

  const deleteNotification = async (id) => {
    setActionId(id);
    await fetch(`/api/notifications/${id}`, { method: "DELETE", headers: authHeader() });
    setNotifications(prev => prev.filter(n => n.id !== id));
    setActionId(null);
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    await fetch("/api/notifications/read-all", { method: "PATCH", headers: authHeader() });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setMarkingAll(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" /> Notifications
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition disabled:opacity-60"
              >
                {markingAll
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Check className="w-4 h-4" />}
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-700">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">
                You'll be notified about upcoming deadlines, merit lists, and more.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {notifications.map((n) => {
                const meta  = TYPE_META[n.type] || DEFAULT_META;
                const Icon  = meta.icon;
                const busy  = actionId === n.id;

                return (
                  <li
                    key={n.id}
                    className={`flex items-start gap-4 px-6 py-4 transition-colors ${
                      !n.read ? "bg-blue-50/60" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Icon badge */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold leading-snug ${n.read ? "text-gray-700" : "text-gray-900"}`}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                        <div className="flex items-center gap-3">
                          {!n.read && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              disabled={busy}
                              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition disabled:opacity-50"
                            >
                              {busy ? "…" : "Mark as read"}
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(n.id)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
