import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { validate } from '@/lib/validators';

export async function POST(request) {
  try {
    const { email, otp, password, confirmPassword } = await request.json();

    // Validation
    if (!email || !otp || !password || !confirmPassword) {
      return Response.json(
        { error: 'Email, OTP and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailError = validate('email', normalizedEmail, { required: true });
    if (emailError) {
      return Response.json({ error: emailError }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return Response.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Verify OTP
    const { rows: otpRecords } = await pool.query(
      'SELECT user_id, expires_at, is_used FROM password_reset_otps WHERE email = $1 AND otp = $2 ORDER BY created_at DESC LIMIT 1',
      [normalizedEmail, otp]
    );

    if (otpRecords.length === 0) {
      return Response.json(
        { error: 'Invalid OTP' },
        { status: 401 }
      );
    }

    const otpRecord = otpRecords[0];

    if (otpRecord.is_used) {
      return Response.json(
        { error: 'OTP has already been used' },
        { status: 401 }
      );
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      return Response.json(
        { error: 'OTP has expired' },
        { status: 401 }
      );
    }

    const userId = otpRecord.user_id;

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    // Mark OTP as used
    await pool.query(
      'UPDATE password_reset_otps SET is_used = TRUE WHERE email = $1 AND otp = $2',
      [normalizedEmail, otp]
    );

    return Response.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
