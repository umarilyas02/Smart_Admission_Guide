"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function ProfileProgressPage() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }
    
    // Simulate fetching profile data
    setTimeout(() => {
      setProfileData({
        completionPercent: 80,
        sections: [
          { name: "Academic Record Uploaded", completed: true },
          { name: "Entry Test Preference", completed: true },
          { name: "Personal Statement", completed: false },
          { name: "Extracurricular Activities", completed: false },
          { name: "References", completed: false },
        ],
      });
      setLoading(false);
    }, 0);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-secondary min-h-screen font-inter">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Profile Completion
          </h1>
          <p className="text-gray-600 mb-6">
            Complete your profile to get better recommendations
          </p>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-700 font-medium">Profile Progress</p>
              <strong className="text-primary text-lg">
                {profileData.completionPercent}%
              </strong>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-primary h-4 rounded-full transition-all duration-500"
                style={{ width: `${profileData.completionPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Completion Checklist */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Profile Sections
            </h2>
            <ul className="space-y-3">
              {profileData.sections.map((section, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <span className="text-gray-700 font-medium">
                    {section.name}
                  </span>
                  {section.completed ? (
                    <span className="text-success text-2xl">✓</span>
                  ) : (
                    <span className="text-danger text-2xl">✗</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <button className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
              Complete Profile
            </button>
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
