"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { runScrape } from "@/app/actions/scrape";
import Breadcrumb from "@/components/Breadcrumb";

function formatDateTime(value) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatChip({ label, value, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <div className={`rounded-lg border px-3 py-2 ${tones[tone] || tones.blue}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function StepList({ steps, isPending }) {
  if (!steps?.length && !isPending) return null;

  const fallbackSteps = [
    { label: "Fetch worker data", status: "running", detail: "Contacting Cloudflare Worker" },
    { label: "Write raw data", status: "pending", detail: "Waiting for fetch to finish" },
    { label: "Clean scraped data", status: "pending", detail: "Python cleaner will run next" },
    { label: "Sync database", status: "pending", detail: "Database sync will run last" },
  ];

  const items = steps?.length ? steps : fallbackSteps;

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-semibold text-gray-800 mb-3">Pipeline Status</p>
      <div className="space-y-3">
        {items.map((step) => {
          const icon =
            step.status === "done" ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            ) : step.status === "failed" ? (
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : step.status === "running" ? (
              <Loader2 className="w-4 h-4 text-blue-600 shrink-0 animate-spin" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
            );

          return (
            <div key={step.label} className="flex items-start gap-3">
              <div className="pt-0.5">{icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-800">{step.label}</p>
                {step.detail ? <p className="text-xs text-gray-500">{step.detail}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SyncSummary({ sync }) {
  if (!sync?.summary) return null;
  const summary = sync.summary;

  return (
    <div className="mt-4 space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatChip label="Universities Created" value={summary.universities_created || 0} tone="green" />
        <StatChip label="Universities Updated" value={summary.universities_updated || 0} tone="blue" />
        <StatChip label="Descriptions Generated" value={summary.descriptions_generated || 0} tone="purple" />
        <StatChip label="Events Created" value={summary.events_created || 0} tone="purple" />
        <StatChip label="Events Updated" value={summary.events_updated || 0} tone="slate" />
        <StatChip label="Programs Added" value={summary.programs_inserted || 0} tone="green" />
        <StatChip label="Programs Unchanged" value={summary.programs_skipped || 0} tone="slate" />
        <StatChip label="Programs Renamed" value={summary.programs_renamed || 0} tone="amber" />
        <StatChip
          label="Programs Removed"
          value={(summary.programs_deleted || 0) + (summary.program_duplicates_removed || 0)}
          tone="red"
        />
      </div>

      {sync.inserted?.length ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Per-University Changes</p>
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {sync.inserted.map((item) => (
              <div key={`${item.universityId}-${item.name}`} className="px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  University {item.action}, event {item.event_action}, {item.programs_total} total programs now
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-green-50 text-green-700">+{item.programs_inserted} added</span>
                  <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-700">{item.programs_skipped} unchanged</span>
                  <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700">{item.programs_renamed} renamed</span>
                  <span className="px-2 py-1 rounded-full bg-red-50 text-red-700">
                    {item.programs_deleted + item.program_duplicates_removed} removed
                  </span>
                </div>
                {(item.programs_inserted_names?.length || item.program_renames?.length || item.programs_deleted_names?.length) ? (
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    {item.programs_inserted_names?.length ? (
                      <p>
                        Added: {item.programs_inserted_names.slice(0, 5).join(", ")}
                        {item.programs_inserted_names.length > 5 ? ` …+${item.programs_inserted_names.length - 5} more` : ""}
                      </p>
                    ) : null}
                    {item.program_renames?.length ? (
                      <p>
                        Renamed: {item.program_renames.slice(0, 3).map((entry) => `${entry.from} → ${entry.to}`).join(", ")}
                        {item.program_renames.length > 3 ? ` …+${item.program_renames.length - 3} more` : ""}
                      </p>
                    ) : null}
                    {item.programs_deleted_names?.length ? (
                      <p>
                        Removed: {item.programs_deleted_names.slice(0, 3).join(", ")}
                        {item.programs_deleted_names.length > 3 ? ` …+${item.programs_deleted_names.length - 3} more` : ""}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {sync.logs?.length ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-800 mb-2">Sync Log</p>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-56 overflow-y-auto">
            {sync.logs.join("\n")}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function ScrapeSection({ onSuccess }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [lastSuccessAt, setLastSuccessAt] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("admin_last_sync_at");
  });

  function handleScrape() {
    setResult(null);
    startTransition(async () => {
      try {
        const data = await runScrape();
        const completedAt = new Date().toISOString();
        const enriched = { ...data, completedAt };
        setResult(enriched);
        if (data?.success) {
          setLastSuccessAt(completedAt);
          localStorage.setItem("admin_last_sync_at", completedAt);
          onSuccess?.(enriched);
        }
      } catch (err) {
        setResult({ success: false, output: "", error: err.message, steps: [] });
      }
    });
  }

  async function handleDownloadReport() {
    if (!result) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const report = {
        completedAt: result.completedAt || new Date().toISOString(),
        steps: result.steps || [],
        summary: result.sync?.summary || null,
        inserted: result.sync?.inserted || [],
        skipped: result.sync?.skipped || [],
        logs: result.sync?.logs || [],
        output: result.output || "",
      };

      const res = await fetch("/api/admin/sync-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ report }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate PDF report");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const completedAt = report.completedAt.replace(/[:.]/g, "-");
      link.href = url;
      link.download = `sync-report-${completedAt}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setResult((prev) => prev ? { ...prev, error: error.message } : prev);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Scraping</h2>
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-gray-600 text-sm mb-1">
              Fetches raw data from the Cloudflare Worker, runs the Python cleaning script, and syncs results to the database.
            </p>
            <p className="text-gray-400 text-xs">
              Existing universities are updated in place; malformed old programs are cleaned automatically.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Last successful sync: {formatDateTime(lastSuccessAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {result?.success ? (
              <button
                onClick={handleDownloadReport}
                disabled={downloading}
                className="px-4 py-2.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                {downloading ? "Preparing PDF..." : "Download PDF Report"}
              </button>
            ) : null}
            <button
              onClick={handleScrape}
              disabled={isPending}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white transition ${
                isPending ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
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
        </div>

        <StepList steps={result?.steps} isPending={isPending} />

        {result?.success ? (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium text-sm mb-2">Sync complete</p>
            <p className="text-green-700 text-xs mb-3">
              Completed at {formatDateTime(result.completedAt)}
            </p>
            <SyncSummary sync={result.sync} />
            {result.output ? (
              <pre className="mt-4 text-green-700 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                {result.output}
              </pre>
            ) : null}
          </div>
        ) : null}

        {result && !result.success ? (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium text-sm mb-1">Failed</p>
            <pre className="text-red-600 text-xs whitespace-pre-wrap">
              {result.error || result.output}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/auth?mode=login");
      return;
    }

    const res = await fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.error) {
      router.push("/");
      return;
    }
    setStats(data);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStats().catch(() => router.push("/"));
    }, 0);
    return () => clearTimeout(timer);
  }, [loadStats, router]);

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
        <h1 className="text-3xl font-bold text-blue-600 mb-8">Admin Dashboard</h1>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.students.toLocaleString()}</p>
            <div className="mt-4">
              <a href="/admin/students" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Universities</h3>
            <p className="text-3xl font-bold text-green-600">{stats.universities.toLocaleString()}</p>
            <div className="mt-4">
              <a href="/admin/universities" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Manage →
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Programs</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.programs.toLocaleString()}</p>
            <div className="mt-4">
              <a href="/admin/programs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Manage →
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Chatbot Queries</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.chatbotQueries.toLocaleString()}</p>
            <div className="mt-4">
              <a href="/admin/chatbot-queries" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View logs →
              </a>
            </div>
          </div>
        </div>

        <ScrapeSection onSuccess={() => loadStats()} />
      </div>
    </AdminLayout>
  );
}
