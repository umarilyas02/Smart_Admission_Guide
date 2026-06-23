"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList, Target, Megaphone, User, GraduationCap,
  Lightbulb, CheckCircle2, AlertCircle, Loader2, ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import { authFetch } from "@/lib/authFetch";
import Breadcrumb from "@/components/Breadcrumb";

const SECTIONS = [
  { id: "personal",  label: "Personal Info",       icon: User },
  { id: "academic",  label: "Academic Background",  icon: GraduationCap },
  { id: "test",      label: "Entry Test Score",     icon: ClipboardList },
  { id: "interests", label: "Interests & Goals",    icon: Lightbulb },
];

function isSectionComplete(id, u, s) {
  if (id === "personal")  return !!(u?.name?.trim() && s?.phone);
  if (id === "academic")  return !!(s?.academic_level && s?.matric_type && s?.matric_marks != null && s?.intermediate_marks != null);
  if (id === "test")      return !!(s?.test_type && (s.test_type === "none" || s.test_score != null));
  if (id === "interests") return !!s?.interests?.trim();
  return false;
}

function calcCompletion(u, s) {
  const done = SECTIONS.filter(sec => isSectionComplete(sec.id, u, s)).length;
  return Math.round((done / SECTIONS.length) * 100);
}

export default function DashboardPage() {
  const [loading,    setLoading]    = useState(true);
  const [userData,   setUserData]   = useState(null);
  const [student,    setStudent]    = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { router.push("/auth?mode=login"); return; }

    authFetch("/api/profile")
      .then(r => r.json())
      .then(data => {
        setUserData(data.user || null);
        setStudent(data.student || null);
        setSavedCount(data.savedCount ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

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

  const completion  = calcCompletion(userData, student);
  const incomplete  = SECTIONS.filter(s => !isSectionComplete(s.id, userData, student));
  const firstName   = userData?.name?.split(" ")[0] || "Student";

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        <Breadcrumb />

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, <span className="text-blue-600">{firstName}</span>!
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Track your admission journey and manage your applications.
          </p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          {/* Profile completion */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Profile Completion</p>
            <div className="flex items-end justify-between mb-3">
              <span className={`text-3xl font-bold ${completion === 100 ? "text-green-600" : "text-blue-600"}`}>
                {completion}%
              </span>
              {completion === 100 && <CheckCircle2 className="w-6 h-6 text-green-500 mb-1" />}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${completion === 100 ? "bg-green-500" : "bg-blue-600"}`}
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {completion === 100 ? "Profile complete!" : `${incomplete.length} section${incomplete.length !== 1 ? "s" : ""} to complete`}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Universities Saved</p>
            <p className="text-3xl font-bold text-blue-600">{savedCount}</p>
            <p className="text-xs text-gray-400 mt-2">
              {savedCount > 0 ? "You'll receive email reminders for upcoming events" : "Explore and save universities"}
            </p>
          </div>
        </div>

        {/* Profile incomplete banner */}
        {completion < 100 && (
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Profile Progress</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Missing: {incomplete.map(s => s.label).join(", ")}
                  </p>
                </div>
              </div>
              <a
                href="/dashboard/profile-progress"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition shrink-0"
              >
                Complete now <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Section checklist */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-5">
              {SECTIONS.map(sec => {
                const done = isSectionComplete(sec.id, userData, student);
                const Icon = sec.icon;
                return (
                  <a
                    key={sec.id}
                    href="/dashboard/profile-progress"
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm transition ${
                      done
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${done ? "text-green-600" : "text-gray-400"}`} />
                    <span className="flex-1 text-xs font-medium leading-tight">{sec.label}</span>
                    {done
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      : <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    }
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Action cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Complete Your Profile</h3>
            <p className="text-sm text-gray-500 mb-4">
              Fill in your academic details to unlock personalised AI recommendations.
            </p>
            <a
              href="/dashboard/profile-progress"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 px-5 py-2 rounded-xl hover:bg-blue-700 transition"
            >
              Go to Profile <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Find Universities</h3>
            <p className="text-sm text-gray-500 mb-4">
              Explore universities and check your admission chances based on your marks.
            </p>
            <a
              href="/universities"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 px-5 py-2 rounded-xl hover:bg-blue-700 transition"
            >
              Explore Now <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-600" /> Notifications
            </h3>
            <a href="/dashboard/notifications" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
              View All →
            </a>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
              <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full shrink-0" />
              <p className="text-sm text-gray-700">
                <strong>Tip:</strong> Complete your profile to get AI-powered university recommendations.
              </p>
            </div>
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
              <div className="w-2 h-2 mt-1.5 bg-green-500 rounded-full shrink-0" />
              <p className="text-sm text-gray-700">
                <strong>Update:</strong> New universities and programs have been added to the database.
              </p>
            </div>
          </div>
        </div>

      </main>

      <Footer />
      <ChatbotWidget />
    </div>
  );
}
