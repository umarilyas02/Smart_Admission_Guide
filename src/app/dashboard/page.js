"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }
    // In production, decode token or fetch user data from API
    setTimeout(() => {
      setUserData({
        name: "Student",
        email: "student@example.com",
        profileComplete: 45,
        universities: 3,
      });
      setLoading(false);
    }, 0);
  }, [router]);

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-secondary min-h-screen font-inter">
      <Navbar />

      <main className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome back, {userData?.name}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Track your admission journey and manage your applications.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-gray-600 font-medium text-sm">Profile Completion</h3>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-2xl font-bold text-primary">{userData?.profileComplete}%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${userData?.profileComplete}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-gray-600 font-medium text-sm">Universities Saved</h3>
              <p className="text-3xl font-bold text-primary mt-4">{userData?.universities}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-gray-600 font-medium text-sm">Applications Submitted</h3>
              <p className="text-3xl font-bold text-primary mt-4">0</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 Complete Your Profile</h3>
              <p className="text-gray-600 mb-4">
                Fill out your academic details to get personalized recommendations.
              </p>
              <a
                href="/dashboard/profile-progress"
                className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Go to Profile
              </a>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Find Universities</h3>
              <p className="text-gray-600 mb-4">
                Explore universities and check your admission chances.
              </p>
              <a
                href="/recommendation"
                className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Explore Now
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">📢 Notifications</h3>
              <a
                href="/dashboard/notifications"
                className="text-primary hover:text-blue-700 text-sm font-semibold"
              >
                View All →
              </a>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border-l-4 border-primary rounded">
                <p className="text-gray-700">
                  <strong>Tip:</strong> Complete your profile to get AI-powered university recommendations.
                </p>
              </div>
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <p className="text-gray-700">
                  <strong>Update:</strong> New universities and programs added to the database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
