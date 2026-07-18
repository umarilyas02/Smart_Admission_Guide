"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Send, CheckCircle2, XCircle, Clock, CalendarDays, Users } from "lucide-react";
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

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(value) {
  if (!value) return null;
  const diff = Math.ceil((new Date(value) - new Date()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff}d`;
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

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [eventRecipients, setEventRecipients] = useState(null);
  const [eventRecipientsLoading, setEventRecipientsLoading] = useState(false);

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

  const loadEvents = () => {
    setEventsLoading(true);
    fetch("/api/admin/deadline-events?days=90", { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  };

  useEffect(() => {
    if (!token()) { router.push("/auth?mode=login"); return; }
    loadStatus();
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Preview which users would receive an email for the currently selected events
  useEffect(() => {
    if (selectedEventIds.length === 0) {
      setEventRecipients(null);
      return;
    }
    setEventRecipientsLoading(true);
    fetch("/api/admin/deadline-events/recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ eventIds: selectedEventIds }),
    })
      .then((r) => r.json())
      .then((data) => setEventRecipients(data.users || []))
      .catch(() => setEventRecipients([]))
      .finally(() => setEventRecipientsLoading(false));
  }, [selectedEventIds]);

  const toggleEvent = (id) => {
    setSelectedEventIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (next.length > 0) {
        setRecipientMode("event-users");
        setType("deadline");
      } else if (recipientMode === "event-users") {
        setRecipientMode("custom");
      }
      return next;
    });
  };

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
    if (recipientMode === "event-users" && selectedEventIds.length === 0) {
      toast.error("Select at least one event");
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
          eventIds: selectedEventIds,
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

        {/* Upcoming deadlines */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" /> Upcoming Deadlines (next 90 days)
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Select one or more events to email only the users who favorited that university. The list below the
            table updates to show exactly who would receive it.
          </p>

          {eventsLoading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              No upcoming events in the next 90 days.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                    <th className="px-2 py-2 w-8"></th>
                    <th className="px-2 py-2">University</th>
                    <th className="px-2 py-2">Event</th>
                    <th className="px-2 py-2">Start</th>
                    <th className="px-2 py-2">When</th>
                    <th className="px-2 py-2 text-right">Favorited by</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => {
                    const checked = selectedEventIds.includes(ev.id);
                    return (
                      <tr
                        key={ev.id}
                        onClick={() => toggleEvent(ev.id)}
                        className={`border-b border-gray-50 cursor-pointer transition ${checked ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      >
                        <td className="px-2 py-2">
                          <input type="checkbox" checked={checked} onChange={() => toggleEvent(ev.id)} className="accent-blue-600" />
                        </td>
                        <td className="px-2 py-2 font-medium text-gray-800">{ev.university_name}</td>
                        <td className="px-2 py-2 text-gray-600">{ev.event_type || "Event"}</td>
                        <td className="px-2 py-2 text-gray-600">{formatDate(ev.start_date)}</td>
                        <td className="px-2 py-2 text-gray-500">{daysUntil(ev.start_date)}</td>
                        <td className="px-2 py-2 text-right text-gray-600">{ev.favorited_users}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedEventIds.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Recipients for {selectedEventIds.length} selected event{selectedEventIds.length !== 1 ? "s" : ""}
                {eventRecipients ? ` (${eventRecipients.length})` : ""}
              </p>
              {eventRecipientsLoading ? (
                <p className="text-sm text-gray-400">Loading recipients...</p>
              ) : eventRecipients && eventRecipients.length === 0 ? (
                <p className="text-sm text-gray-400">No users have favorited these universities yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {eventRecipients?.map((u) => (
                    <span key={u.id} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1">
                      {u.name ? `${u.name} · ` : ""}{u.email}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
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
            ) : selectedEventIds.length > 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                Using {selectedEventIds.length} selected event{selectedEventIds.length !== 1 ? "s" : ""} from the table above.
              </p>
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
                  No events selected above — pulls up to 10 real upcoming events in this window instead.
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
                <button
                  type="button"
                  disabled={selectedEventIds.length === 0}
                  onClick={() => setRecipientMode("event-users")}
                  className={`flex-1 border rounded-lg px-3 py-2 text-sm font-medium transition ${
                    selectedEventIds.length === 0
                      ? "border-gray-200 text-gray-300 cursor-not-allowed"
                      : recipientMode === "event-users"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Users of selected event(s){eventRecipients ? ` (${eventRecipients.length})` : ""}
                </button>
              </div>

              {recipientMode === "custom" && (
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  placeholder="one@example.com, two@example.com&#10;or one per line"
                  rows={3}
                />
              )}

              {recipientMode === "users" && (
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

              {recipientMode === "event-users" && (
                <p className="text-xs text-gray-400">
                  See the recipients list above the form — it shows exactly who will receive this email.
                </p>
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
