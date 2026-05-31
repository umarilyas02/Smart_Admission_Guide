import { NextResponse } from 'next/server';
import { query, queryMany } from '@/lib/db';
import { sendReminderDigest } from '@/lib/email';

async function ensureReminderLogsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS reminder_logs (
      id         SERIAL PRIMARY KEY,
      user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_id   INT REFERENCES university_events(id) ON DELETE SET NULL,
      sent_at    TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, event_id)
    )
  `);
}

export async function POST(req) {
  // Protect with a secret so only authorised callers can trigger sends
  const secret = req.headers.get('x-reminder-secret') || new URL(req.url).searchParams.get('secret');
  if (process.env.REMINDER_SECRET && secret !== process.env.REMINDER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureReminderLogsTable();

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get('days') || '14'), 60);

  // Fetch upcoming events within the window
  const events = await queryMany(
    `SELECT e.id, e.event_type, e.start_date, e.end_date, e.status, e.details,
            u.name AS university_name, u.website AS university_website
     FROM university_events e
     JOIN universities u ON u.id = e.university_id
     WHERE e.start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' days')::INTERVAL
     ORDER BY e.start_date ASC`,
    [days]
  );

  if (events.length === 0) {
    return NextResponse.json({ message: 'No upcoming events in window', sent: 0, skipped: 0 });
  }

  const users = await queryMany('SELECT id, name, email FROM users ORDER BY id');

  let sent = 0;
  let skipped = 0;
  const errors = [];

  for (const user of users) {
    try {
      // Find which events this user hasn't been reminded about yet
      const alreadySent = await queryMany(
        `SELECT event_id FROM reminder_logs WHERE user_id=$1 AND event_id = ANY($2::int[])`,
        [user.id, events.map(e => e.id)]
      );
      const sentIds = new Set(alreadySent.map(r => r.event_id));
      const newEvents = events.filter(e => !sentIds.has(e.id));

      if (newEvents.length === 0) {
        skipped++;
        continue;
      }

      const ok = await sendReminderDigest(user.email, user.name, newEvents);

      if (ok) {
        // Mark each event as reminded for this user
        for (const ev of newEvents) {
          await query(
            `INSERT INTO reminder_logs (user_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [user.id, ev.id]
          );
        }
        sent++;
      } else {
        errors.push(user.email);
      }
    } catch (err) {
      console.error(`Reminder failed for ${user.email}:`, err.message);
      errors.push(user.email);
    }
  }

  return NextResponse.json({
    message: 'Reminder job complete',
    events_found: events.length,
    total_users: users.length,
    sent,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export const runtime = 'nodejs';
