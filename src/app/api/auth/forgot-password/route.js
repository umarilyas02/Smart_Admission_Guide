import pool from '@/lib/db';
import { generateResetToken } from '@/lib/auth';
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

    const connection = await pool.getConnection();

    // Check if user exists
    const [users] = await connection.query(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );

    connection.release();

    if (users.length === 0) {
      // Don't reveal if email exists (security best practice)
      return Response.json(
        { message: 'If an account exists with this email, a reset link has been sent' },
        { status: 200 }
      );
    }

    const user = users[0];

    // Generate reset token
    const resetToken = generateResetToken(user.id);

    // Send email with reset link
    const emailSent = await sendPasswordResetEmail(email, resetToken);

    if (!emailSent) {
      return Response.json(
        { error: 'Failed to send reset email. Please try again later.' },
        { status: 500 }
      );
    }

    return Response.json(
      { message: 'If an account exists with this email, a reset link has been sent' },
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
