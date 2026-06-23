import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.EMAIL_MAIL || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const FROM = `"Smart Admission Guide" <${SMTP_USER}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/* ── Shared HTML shell ── */
function emailShell(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Smart Admission Guide</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
              Smart Admission Guide
            </h1>
            <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Your path to the right university</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          ${bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">
              © ${new Date().getFullYear()} Smart Admission Guide &nbsp;·&nbsp;
              <a href="${APP_URL}" style="color:#2563eb;text-decoration:none;">Visit Platform</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ── Password reset OTP ── */
export const sendPasswordResetEmail = async (email, otp) => {
  const html = emailShell(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Password Reset</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
      You requested a password reset. Use the OTP below — it expires in <strong>10 minutes</strong>.
    </p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#2563eb;">${otp}</span>
    </div>
    <p style="margin:0;color:#94a3b8;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
  `);

  try {
    await transporter.sendMail({ from: FROM, to: email, subject: 'Your Password Reset OTP — SAG', html });
    return true;
  } catch (err) {
    console.error('sendPasswordResetEmail error:', err.message);
    return false;
  }
};

/* ── Welcome email ── */
export const sendWelcomeEmail = async (email, name) => {
  const html = emailShell(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Welcome, ${name}! 🎓</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
      Your account has been created successfully. Start exploring universities and get
      personalised AI-powered recommendations.
    </p>
    <a href="${APP_URL}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;">
      Get Started →
    </a>
  `);

  try {
    await transporter.sendMail({ from: FROM, to: email, subject: 'Welcome to Smart Admission Guide!', html });
    return true;
  } catch (err) {
    console.error('sendWelcomeEmail error:', err.message);
    return false;
  }
};

/* ── Reminder digest ── */
const EVENT_TYPE_LABELS = {
  admission:    'Admissions Open',
  test:         'Entry Test',
  deadline:     'Application Deadline',
  merit:        'Merit List',
  result:       'Result Announced',
  interview:    'Interview',
  orientation:  'Orientation',
};

function eventLabel(type) {
  return EVENT_TYPE_LABELS[type?.toLowerCase()] || type || 'Event';
}

function eventBadgeColor(type) {
  const t = type?.toLowerCase();
  if (t === 'deadline')  return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' };
  if (t === 'test')      return { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c' };
  if (t === 'admission') return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' };
  if (t === 'merit')     return { bg: '#f5f3ff', border: '#ddd6fe', text: '#7c3aed' };
  return                        { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' };
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysUntil(d) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - new Date()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

function buildEventCard(ev) {
  const badge  = eventBadgeColor(ev.event_type);
  const label  = eventLabel(ev.event_type);
  const urgent = daysUntil(ev.start_date);
  const isUrgent = urgent === 'Today' || urgent === 'Tomorrow';

  return `
    <tr>
      <td style="padding:0 0 12px;">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border:1px solid ${isUrgent ? '#fecaca' : '#e2e8f0'};
                      border-radius:12px;overflow:hidden;
                      background:${isUrgent ? '#fff5f5' : '#ffffff'};">
          <tr>
            <td style="padding:16px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background:${badge.bg};color:${badge.text};
                                 border:1px solid ${badge.border};border-radius:20px;
                                 font-size:11px;font-weight:600;padding:3px 10px;">
                      ${label}
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size:12px;font-weight:700;color:${isUrgent ? '#dc2626' : '#64748b'};">
                      ${urgent || ''}
                    </span>
                  </td>
                </tr>
                <tr><td colspan="2" style="padding-top:8px;">
                  <strong style="font-size:15px;color:#1e293b;">${ev.university_name}</strong>
                </td></tr>
                <tr><td colspan="2" style="padding-top:6px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right:16px;">
                        <span style="font-size:12px;color:#94a3b8;">Start</span><br/>
                        <span style="font-size:13px;color:#334155;font-weight:500;">${formatDate(ev.start_date)}</span>
                      </td>
                      ${ev.end_date ? `
                      <td>
                        <span style="font-size:12px;color:#94a3b8;">End</span><br/>
                        <span style="font-size:13px;color:#334155;font-weight:500;">${formatDate(ev.end_date)}</span>
                      </td>` : ''}
                    </tr>
                  </table>
                </td></tr>
                ${ev.status ? `
                <tr><td colspan="2" style="padding-top:6px;">
                  <span style="font-size:12px;color:#64748b;">Status: <strong>${ev.status}</strong></span>
                </td></tr>` : ''}
                ${ev.details ? `
                <tr><td colspan="2" style="padding-top:6px;">
                  <span style="font-size:12px;color:#64748b;">${ev.details}</span>
                </td></tr>` : ''}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export const sendReminderDigest = async (email, name, events) => {
  const eventCards = events.map(buildEventCard).join('');
  const urgentCount = events.filter(e => {
    const d = daysUntil(e.start_date);
    return d === 'Today' || d === 'Tomorrow';
  }).length;

  const html = emailShell(`
    <h2 style="margin:0 0 4px;color:#1e293b;font-size:20px;">
      Hi ${name || 'there'}, you have upcoming deadlines!
    </h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
      Here's a summary of <strong>${events.length} upcoming university event${events.length !== 1 ? 's' : ''}</strong>
      ${urgentCount > 0 ? `— <span style="color:#dc2626;font-weight:600;">${urgentCount} urgent</span>` : ''}.
      Don't miss your deadlines!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${eventCards}
    </table>

    <div style="margin-top:24px;text-align:center;">
      <a href="${APP_URL}/universities"
         style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;
                padding:13px 30px;border-radius:10px;font-size:14px;font-weight:600;">
        View All Universities →
      </a>
    </div>

    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;text-align:center;">
      You're receiving this because you're registered on Smart Admission Guide.
    </p>
  `);

  try {
    const subject = urgentCount > 0
      ? `⚠️ Urgent: ${urgentCount} deadline${urgentCount !== 1 ? 's' : ''} soon — SAG Reminder`
      : `📅 Upcoming university events — SAG Reminder`;

    await transporter.sendMail({ from: FROM, to: email, subject, html });
    return true;
  } catch (err) {
    console.error('sendReminderDigest error:', err.message);
    return false;
  }
};
