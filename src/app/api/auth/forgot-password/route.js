import pool from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { rows: users } = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists (security best practice)
      return Response.json(
        { message: 'If an account exists with this email, a reset link has been sent' },
        { status: 200 }
      );
    }

    const user = users[0];

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store OTP in database
    await pool.query(
      'INSERT INTO password_reset_otps (user_id, email, otp, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, email, otp, expiresAt]
    );

    // Send OTP via email
    const emailSent = await sendPasswordResetEmail(email, otp);

    if (!emailSent) {
      console.error('Failed to send OTP to:', email);
      return Response.json(
        { error: 'Failed to send OTP email. Please try again later.' },
        { status: 500 }
      );
    }

    console.log('OTP sent successfully to:', email);

    return Response.json(
      { message: 'If an account exists with this email, an OTP has been sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
