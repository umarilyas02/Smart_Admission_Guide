export async function register() {
  // Only run in Node.js runtime (not Edge), and only on the server
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const cron = await import('node-cron');

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const SECRET   = process.env.REMINDER_SECRET || '';

  const sendReminders = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/reminders/send?days=7`, {
        method: 'POST',
        headers: { 'x-reminder-secret': SECRET },
      });
      const data = await res.json();
      console.log('[Reminder Cron] Done —', data);
    } catch (err) {
      console.error('[Reminder Cron] Failed —', err.message);
    }
  };

  // Run every day at 8:00 AM
  cron.default.schedule('0 8 * * *', () => {
    console.log('[Reminder Cron] Firing daily reminder job…');
    sendReminders();
  });

  console.log('[Reminder Cron] Scheduled — runs daily at 08:00 AM');
}
