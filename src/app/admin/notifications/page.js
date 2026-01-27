"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

export default function AdminNotifications() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info",
  });

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
          title: "System Maintenance",
          message: "Server maintenance scheduled for tonight.",
          type: "info",
          timestamp: "2026-01-27 08:00 AM",
          status: "sent",
        },
        {
          id: 2,
          title: "New Feature Released",
          message: "AI-powered university recommendations now available.",
          type: "success",
          timestamp: "2026-01-26 10:00 AM",
          status: "sent",
        },
        {
          id: 3,
          title: "Deadline Alert",
          message: "University application deadlines approaching.",
          type: "warning",
          timestamp: "2026-01-25 09:00 AM",
          status: "sent",
        },
      ]);
      setLoading(false);
    }, 500);
  }, [router]);

  const handleCreateNotification = () => {
    if (!newNotification.title || !newNotification.message) {
      alert("Please fill in all fields");
      return;
    }

    const newId = Math.max(...notifications.map((n) => n.id), 0) + 1;
    const timestamp = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    setNotifications([
      {
        id: newId,
        ...newNotification,
        timestamp,
        status: "sent",
      },
      ...notifications,
    ]);

    setNewNotification({ title: "", message: "", type: "info" });
    setShowCreateModal(false);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this notification?")) {
      setNotifications(notifications.filter((n) => n.id !== id));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">
            Notifications Management
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Create Notification
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <div className="flex justify-between items-start">
                <div className="grow">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        notification.type === "info"
                          ? "bg-blue-100 text-blue-800"
                          : notification.type === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {notification.type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {notification.timestamp}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {notification.title}
                  </h3>
                  <p className="text-gray-600">{notification.message}</p>
                </div>
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="text-red-600 hover:text-red-800 ml-4"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Notification Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Create New Notification
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        title: e.target.value,
                      })
                    }
                    placeholder="Enter notification title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Message</label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        message: e.target.value,
                      })
                    }
                    placeholder="Enter notification message"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Type</label>
                  <select
                    value={newNotification.type}
                    onChange={(e) =>
                      setNewNotification({
                        ...newNotification,
                        type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateNotification}
                  className="grow bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewNotification({ title: "", message: "", type: "info" });
                  }}
                  className="grow bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
