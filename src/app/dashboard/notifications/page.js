"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }

    // Simulate fetching notifications
    setTimeout(() => {
      setNotifications([
        {
          id: 1,
          type: "deadline",
          icon: "⏰",
          title: "FAST Entry Test Deadline",
          message: "FAST entry test deadline is in 3 days. Register now!",
          time: "2 hours ago",
          unread: true,
        },
        {
          id: 2,
          type: "merit",
          icon: "📊",
          title: "PUCIT Merit List Announced",
          message: "Punjab University College of IT has announced their merit list for Spring 2026.",
          time: "5 hours ago",
          unread: true,
        },
        {
          id: 3,
          type: "recommendation",
          icon: "💡",
          title: "New Recommendation Added",
          message: "Based on your profile, we've added NUST to your recommendations.",
          time: "1 day ago",
          unread: false,
        },
        {
          id: 4,
          type: "update",
          icon: "🔔",
          title: "Profile Update Reminder",
          message: "Complete your profile to get better university recommendations.",
          time: "2 days ago",
          unread: false,
        },
        {
          id: 5,
          type: "success",
          icon: "✅",
          title: "Application Submitted",
          message: "Your application to LUMS has been successfully submitted.",
          time: "3 days ago",
          unread: false,
        },
      ]);
      setLoading(false);
    }, 0);
  }, [router]);

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, unread: false } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notif) => ({ ...notif, unread: false }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="bg-secondary min-h-screen font-inter">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                🔔 Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-gray-600 mt-1">
                  You have {unreadCount} unread notification
                  {unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-primary hover:text-blue-700 font-semibold transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No notifications yet</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`p-4 rounded-lg border transition hover:shadow-md ${
                    notification.unread
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{notification.icon}</span>
                    <div className="grow">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {notification.unread && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mb-2">
                        {notification.message}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs">
                          {notification.time}
                        </span>
                        <div className="flex gap-3">
                          {notification.unread && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-primary text-xs hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-danger text-xs hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Back Button */}
          <div className="mt-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
