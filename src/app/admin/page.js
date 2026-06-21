"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { runScrape } from "@/app/actions/scrape";
import Breadcrumb from "@/components/Breadcrumb";

function ScrapeSection() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState(null);

  function handleScrape() {
    setResult(null);
    startTransition(async () => {
      try {
        const data = await runScrape();
        setResult(data);
      } catch (err) {
        setResult({ success: false, output: "", error: err.message });
      }
    });
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Data Scraping
      </h2>
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-gray-600 text-sm mb-1">
              Fetches raw data from the Cloudflare Worker, runs the Python
              cleaning script, and syncs results to the database.
            </p>
            <p className="text-gray-400 text-xs">
              Existing data will be replaced on each run.
            </p>
          </div>
          <button
            onClick={handleScrape}
            disabled={isPending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition ${
              isPending
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isPending ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Running...
              </>
            ) : (
              "Scrape & Sync Data"
            )}
          </button>
        </div>

        {result && result.success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium text-sm mb-2">
              ✓ Sync complete
            </p>
            {result.output && (
              <pre className="text-green-700 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                {result.output}
              </pre>
            )}
          </div>
        )}

        {result && !result.success && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium text-sm mb-1">✗ Failed</p>
            <pre className="text-red-600 text-xs whitespace-pre-wrap">
              {result.error || result.output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

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

    fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push("/");
          return;
        }
        setStats(data);
        setLoading(false);
      })
      .catch(() => router.push("/"));
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
        <Breadcrumb />
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
              {stats.universities.toLocaleString()}
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
              {stats.programs.toLocaleString()}
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
              {stats.chatbotQueries.toLocaleString()}
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

        <ScrapeSection />
      </div>
    </AdminLayout>
  );
}
