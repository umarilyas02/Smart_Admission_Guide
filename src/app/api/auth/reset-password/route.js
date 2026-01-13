import pool from '@/lib/db';
import { hashPassword, verifyToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { token, password, confirmPassword } = await request.json();

    // Validation
    if (!token || !password || !confirmPassword) {
      return Response.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
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

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return Response.json(
        { error: 'Invalid or expired reset token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Hash new password
    const hashedPassword = await hashPassword(password);

    const connection = await pool.getConnection();

    // Update password
    await connection.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    connection.release();

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
