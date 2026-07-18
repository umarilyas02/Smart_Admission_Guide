"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Send, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import Breadcrumb from "@/components/Breadcrumb";

function formatDateTime(value) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusPill({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
    }`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
}

export default function TestEmailsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  const [type, setType] = useState("custom");
  const [recipientMode, setRecipientMode] = useState("custom");
  const [emails, setEmails] = useState("");
  const [userLimit, setUserLimit] = useState(5);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [days, setDays] = useState(30);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  const token = () => localStorage.getItem("auth_token");

  const loadStatus = () => {
    fetch("/api/admin/test-email", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/"); return; }
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!token()) { router.push("/auth?mode=login"); return; }
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSend = async (e) => {
    e.preventDefault();
    setResults(null);

    if (type === "custom" && (!subject.trim() || !message.trim())) {
      toast.error("Subject and message are required");
      return;
    }
    if (recipientMode === "custom" && !emails.trim()) {
      toast.error("Enter at least one email address");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          type,
          recipientMode,
          emails,
          userLimit,
          subject,
          message,
          days,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send test email");

      setResults(data.results);
      toast.success(`Sent ${data.sent}/${data.total} test email${data.total !== 1 ? "s" : ""}`);
      loadStatus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <Breadcrumb />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-600">Email Testing</h1>
          <p className="text-gray-500 text-sm mt-1">Send test emails and verify the deadline reminder pipeline.</p>
        </div>

        {/* Auto-send status */}
        <div className="bg-white p-5 rounded-xl shadow mb-6">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" /> Deadline Auto-Reminder Status
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <StatusPill ok={status?.smtpConfigured} label={status?.smtpConfigured ? "SMTP configured" : "SMTP missing"} />
            <StatusPill ok={status?.reminderSecretConfigured} label={status?.reminderSecretConfigured ? "Reminder secret set" : "Reminder secret missing"} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border border-gray-200 px-3 py-2">
              <p className="text-xs text-gray-400">Schedule</p>
              <p className="font-medium text-gray-800">{status?.autoSendSchedule}</p>
            </div>
            <div className="rounded-lg border border-gray-200 px-3 py-2">
              <p className="text-xs text-gray-400">Registered users</p>
              <p className="font-medium text-gray-800">{status?.usersCount ?? 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 px-3 py-2">
              <p className="text-xs text-gray-400">Upcoming events (30d)</p>
              <p className="font-medium text-gray-800">{status?.upcomingEvents ?? 0}</p>
            </div>
            <div className="rounded-lg border border-gray-200 px-3 py-2">
              <p className="text-xs text-gray-400">Reminders sent (all-time)</p>
              <p className="font-medium text-gray-800">
                {status?.remindersSentTotal ?? 0} · last {formatDateTime(status?.lastReminderSentAt)}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            The reminder job runs automatically every day and emails each user a digest of events they haven't
            been reminded about yet within the window. Use the form below to trigger a real send without
            touching that dedupe log, so you can re-test freely.
          </p>
        </div>

        {/* Send form */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" /> Send Test Email
          </h2>

          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email content</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setType("custom")}
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm font-medium transition ${
                    type === "custom" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Custom message
                </button>
                <button
                  type="button"
                  onClick={() => setType("deadline")}
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm font-medium transition ${
                    type === "deadline" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Deadline reminder (real data)
                </button>
              </div>
            </div>

            {type === "custom" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Test subject line"
                    maxLength={150}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Test message body..."
                    rows={4}
                    maxLength={2000}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Days window</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Pulls up to 10 real upcoming university events in this window and sends the actual reminder digest email.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setRecipientMode("custom")}
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm font-medium transition ${
                    recipientMode === "custom" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Custom email address(es)
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode("users")}
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm font-medium transition ${
                    recipientMode === "users" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Existing users
                </button>
              </div>

              {recipientMode === "custom" ? (
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="one@example.com, two@example.com&#10;or one per line"
                  rows={3}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={userLimit}
                    onChange={(e) => setUserLimit(e.target.value)}
                  />
                  <span className="text-sm text-gray-500">
                    users (first {userLimit || 0} of {status?.usersCount ?? 0}, by signup order)
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition font-medium"
            >
              <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send Test Email"}
            </button>
          </form>

          {results && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">Results</p>
              <div className="space-y-1.5">
                {results.map((r) => (
                  <div key={r.email} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-gray-700">{r.email}</span>
                    {r.success ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Sent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 font-medium">
                        <XCircle className="w-4 h-4" /> Failed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
