import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendReminderDigest } from '@/lib/email';

// Secured with CRON_SECRET — Vercel sets Authorization: Bearer $CRON_SECRET on cron invocations.
function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all user-favorite + upcoming event combos that need a reminder today.
    // - within 7 days of start_date  → remind every 3 days
    // - more than 7 days away        → remind every 7 days
    const { rows } = await pool.query(`
      SELECT
        u.id              AS user_id,
        u.name            AS user_name,
        u.email           AS user_email,
        univ.id           AS university_id,
        univ.name         AS university_name,
        e.id              AS event_id,
        e.event_type,
        e.start_date,
        e.end_date,
        e.status,
        e.details,
        EXTRACT(DAY FROM (e.start_date - NOW()))  AS days_until,
        COALESCE(MAX(rl.sent_at), '1970-01-01'::timestamptz) AS last_sent
      FROM user_university_favorites f
      JOIN users       u    ON u.id   = f.user_id
      JOIN universities univ ON univ.id = f.university_id
      JOIN university_events e ON e.university_id = univ.id
      LEFT JOIN favorite_reminder_log rl
             ON rl.user_id = u.id AND rl.event_id = e.id
      WHERE e.start_date > NOW()
      GROUP BY u.id, u.name, u.email,
               univ.id, univ.name,
               e.id, e.event_type, e.start_date, e.end_date, e.status, e.details
      HAVING
        (
          EXTRACT(DAY FROM (e.start_date - NOW())) <= 7
          AND NOW() - COALESCE(MAX(rl.sent_at), '1970-01-01'::timestamptz) >= INTERVAL '3 days'
        ) OR (
          EXTRACT(DAY FROM (e.start_date - NOW())) > 7
          AND NOW() - COALESCE(MAX(rl.sent_at), '1970-01-01'::timestamptz) >= INTERVAL '7 days'
        )
      ORDER BY u.id, e.start_date
    `);

    if (rows.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No reminders due' });
    }

    // Group events by user
    const byUser = {};
    for (const row of rows) {
      if (!byUser[row.user_id]) {
        byUser[row.user_id] = {
          user_id: row.user_id,
          name: row.user_name,
          email: row.user_email,
          events: [],
        };
      }
      byUser[row.user_id].events.push({
        event_id:        row.event_id,
        university_id:   row.university_id,
        university_name: row.university_name,
        event_type:      row.event_type,
        start_date:      row.start_date,
        end_date:        row.end_date,
        status:          row.status,
        details:         row.details,
      });
    }

    let sent = 0;
    const errors = [];

    for (const userData of Object.values(byUser)) {
      const ok = await sendReminderDigest(userData.email, userData.name, userData.events);

      if (ok) {
        // Log each event reminder so we don't re-send too soon
        for (const ev of userData.events) {
          await pool.query(
            `INSERT INTO favorite_reminder_log (user_id, university_id, event_id)
             VALUES ($1, $2, $3)`,
            [userData.user_id, ev.university_id, ev.event_id]
          );
        }
        sent++;
      } else {
        errors.push(userData.email);
      }
    }

    return NextResponse.json({
      sent,
      total_users: Object.keys(byUser).length,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error('Cron send-reminders error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
