import pool from '@/lib/db';
import { validate } from '@/lib/validators';

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return Response.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailError = validate('email', normalizedEmail, { required: true });
    if (emailError) {
      return Response.json({ error: emailError }, { status: 400 });
    }

    const { rows } = await pool.query(
      'SELECT expires_at, is_used FROM password_reset_otps WHERE email = $1 AND otp = $2 ORDER BY created_at DESC LIMIT 1',
      [normalizedEmail, otp]
    );

    if (rows.length === 0) {
      return Response.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    const record = rows[0];

    if (record.is_used) {
      return Response.json({ error: 'OTP has already been used' }, { status: 401 });
    }

    if (new Date() > new Date(record.expires_at)) {
      return Response.json({ error: 'OTP has expired' }, { status: 401 });
    }

    return Response.json({ message: 'OTP verified' }, { status: 200 });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
