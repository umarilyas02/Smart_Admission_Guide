"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }

    // Simulate fetching admin stats
    setTimeout(() => {
      setStats({
        students: 1250,
        universities: 65,
        programs: 320,
        chatbotQueries: 89,
      });
      setLoading(false);
    }, 500);
  }, [router]);

  if (loading || !stats) {
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
        <h1 className="text-3xl font-bold text-blue-600 mb-8">
          Admin Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Total Students
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {stats.students.toLocaleString()}
            </p>
            <div className="mt-4">
              <a
                href="/admin/students"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Universities
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {stats.universities}
            </p>
            <div className="mt-4">
              <a
                href="/admin/universities"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage →
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Programs
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {stats.programs}
            </p>
            <div className="mt-4">
              <a
                href="/admin/programs"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage →
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300">
            <h3 className="text-gray-600 text-sm font-medium mb-2">
              Chatbot Queries
            </h3>
            <p className="text-3xl font-bold text-orange-600">
              {stats.chatbotQueries}
            </p>
            <div className="mt-4">
              <a
                href="/admin/chatbot-queries"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View logs →
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="/admin/universities"
              className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition text-center"
            >
              + Add University
            </a>
            <a
              href="/admin/programs"
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition text-center"
            >
              + Add Program
            </a>
            <a
              href="/admin/entry-tests"
              className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition text-center"
            >
              Manage Entry Tests
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
