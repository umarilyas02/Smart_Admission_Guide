"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, XCircle, RefreshCw, Sparkles } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PK", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ChatbotQueries() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        filter === "all"
          ? "/api/chatbot/logs"
          : `/api/chatbot/logs?filter=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }
    fetchLogs();
  }, [router, fetchLogs]);

  const total = logs.length;
  const relevant = logs.filter((l) => l.relevant === true).length;
  const irrelevant = logs.filter((l) => l.relevant === false).length;

  return (
    <AdminLayout>
      <div className="p-8">
        <Breadcrumb />
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">SAG AI — Query Logs</h1>
              <p className="text-sm text-gray-500">All chatbot conversations tracked in real time</p>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm mb-1">Total Queries</p>
            <p className="text-3xl font-bold text-gray-800">{total}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-green-100">
            <p className="text-gray-500 text-sm mb-1">Admission-Related</p>
            <p className="text-3xl font-bold text-green-600">{relevant}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-red-100">
            <p className="text-gray-500 text-sm mb-1">Off-Topic</p>
            <p className="text-3xl font-bold text-red-500">{irrelevant}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {[["all", "All Queries"], ["relevant", "Admission-Related"], ["irrelevant", "Off-Topic"]].map(
            ([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === val
                    ? val === "relevant"
                      ? "bg-green-600 text-white"
                      : val === "irrelevant"
                      ? "bg-red-500 text-white"
                      : "bg-linear-to-r from-purple-600 to-indigo-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Logs list */}
        {!loading && !error && (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      log.relevant ? "bg-green-50" : "bg-red-50"
                    }`}>
                      {log.relevant
                        ? <MessageSquare className="w-4 h-4 text-green-600" />
                        : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{log.query}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(log.created_at)}
                        {log.user_name && (
                          <span className="ml-2 text-indigo-400">· {log.user_name}</span>
                        )}
                      </p>
                      {log.response && (
                        <div className="mt-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                          <p className="text-sm text-gray-600 line-clamp-3">
                            <span className="font-medium text-gray-700">SAG AI: </span>
                            {log.response}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                      log.relevant
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {log.relevant ? "Relevant" : "Off-topic"}
                  </span>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No queries yet</p>
                <p className="text-sm mt-1">SAG AI conversations will appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
