import { NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { requireAdminUser } from '@/lib/serverAuth';
import { sendCustomTestEmail, sendReminderDigest } from '@/lib/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 50;
const MAX_EVENT_RECIPIENTS = 200;

export async function GET(req) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const [{ count: usersCount }] = await queryMany('SELECT COUNT(*)::int AS count FROM users');
    const [{ count: upcomingEvents }] = await queryMany(
      `SELECT COUNT(*)::int AS count FROM university_events
       WHERE start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`
    );

    let remindersSentTotal = 0;
    let lastReminderSentAt = null;
    try {
      const rows = await queryMany('SELECT COUNT(*)::int AS count, MAX(sent_at) AS last_sent FROM reminder_logs');
      remindersSentTotal = rows[0]?.count ?? 0;
      lastReminderSentAt = rows[0]?.last_sent ?? null;
    } catch {
      // reminder_logs table is created lazily on first real send job
    }

    return NextResponse.json({
      smtpConfigured: Boolean(
        (process.env.SMTP_HOST || 'smtp.gmail.com') &&
        (process.env.SMTP_PASS || process.env.EMAIL_PASSWORD) &&
        (process.env.EMAIL_MAIL || process.env.EMAIL_USER)
      ),
      reminderSecretConfigured: Boolean(process.env.REMINDER_SECRET),
      cronSecretConfigured: Boolean(process.env.CRON_SECRET),
      autoSendSchedule: 'Daily at 08:00 (server time), in-process scheduler, window = 7 days',
      usersCount,
      upcomingEvents,
      remindersSentTotal,
      lastReminderSentAt,
    });
  } catch (err) {
    console.error('GET /api/admin/test-email error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req) {
  const { response } = requireAdminUser(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { type, recipientMode, emails, userLimit, subject, message, days, eventIds } = body;

    const eventIdList = Array.isArray(eventIds)
      ? eventIds.map((id) => parseInt(id, 10)).filter((id) => Number.isInteger(id))
      : [];

    let recipients = [];
    if (recipientMode === 'users') {
      const limit = Math.max(1, Math.min(parseInt(userLimit, 10) || 1, MAX_RECIPIENTS));
      const users = await queryMany('SELECT name, email FROM users ORDER BY id LIMIT $1', [limit]);
      if (users.length === 0) {
        return NextResponse.json({ error: 'No users found in the database' }, { status: 400 });
      }
      recipients = users.map((u) => ({ email: u.email, name: u.name }));
    } else if (recipientMode === 'event-users') {
      if (eventIdList.length === 0) {
        return NextResponse.json({ error: 'Select at least one event' }, { status: 400 });
      }
      const users = await queryMany(
        `SELECT DISTINCT us.id, us.name, us.email
         FROM university_events e
         JOIN user_university_favorites f ON f.university_id = e.university_id
         JOIN users us ON us.id = f.user_id
         WHERE e.id = ANY($1::int[])
         LIMIT $2`,
        [eventIdList, MAX_EVENT_RECIPIENTS]
      );
      if (users.length === 0) {
        return NextResponse.json(
          { error: 'No users have favorited the universities for the selected events' },
          { status: 400 }
        );
      }
      recipients = users.map((u) => ({ email: u.email, name: u.name }));
    } else {
      const list = String(emails || '')
        .split(/[\n,]/)
        .map((e) => e.trim())
        .filter(Boolean);
      if (list.length === 0) {
        return NextResponse.json({ error: 'Enter at least one email address' }, { status: 400 });
      }
      if (list.length > MAX_RECIPIENTS) {
        return NextResponse.json({ error: `Max ${MAX_RECIPIENTS} recipients at a time` }, { status: 400 });
      }
      const invalid = list.find((e) => !EMAIL_RE.test(e));
      if (invalid) {
        return NextResponse.json({ error: `Invalid email address: ${invalid}` }, { status: 400 });
      }
      recipients = list.map((email) => ({ email, name: null }));
    }

    const results = [];

    if (type === 'deadline') {
      let events;
      if (eventIdList.length > 0) {
        events = await queryMany(
          `SELECT e.id, e.event_type, e.start_date, e.end_date, e.status, e.details,
                  u.name AS university_name
           FROM university_events e
           JOIN universities u ON u.id = e.university_id
           WHERE e.id = ANY($1::int[])
           ORDER BY e.start_date ASC`,
          [eventIdList]
        );
        if (events.length === 0) {
          return NextResponse.json({ error: 'Selected events could not be found' }, { status: 400 });
        }
      } else {
        const windowDays = Math.max(1, Math.min(parseInt(days, 10) || 30, 365));
        events = await queryMany(
          `SELECT e.id, e.event_type, e.start_date, e.end_date, e.status, e.details,
                  u.name AS university_name
           FROM university_events e
           JOIN universities u ON u.id = e.university_id
           WHERE e.start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' days')::INTERVAL
           ORDER BY e.start_date ASC
           LIMIT 10`,
          [windowDays]
        );
        if (events.length === 0) {
          return NextResponse.json(
            { error: `No upcoming events in the next ${windowDays} days — add a university event first, or increase the days window` },
            { status: 400 }
          );
        }
      }

      for (const r of recipients) {
        const ok = await sendReminderDigest(r.email, r.name || 'there', events);
        results.push({ email: r.email, success: ok });
      }
    } else {
      if (!subject?.trim() || !message?.trim()) {
        return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
      }
      for (const r of recipients) {
        const ok = await sendCustomTestEmail(r.email, subject.trim(), message.trim());
        results.push({ email: r.email, success: ok });
      }
    }

    const sent = results.filter((r) => r.success).length;
    return NextResponse.json({ sent, total: results.length, results });
  } catch (err) {
    console.error('POST /api/admin/test-email error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
