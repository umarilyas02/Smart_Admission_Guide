import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { validate } from '@/lib/validators';

export async function POST(request) {
  try {
    const { name, email, password, confirmPassword } = await request.json();

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return Response.json(
        { error: 'All fields are required' },
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

    // Check if user already exists
    const { rows: existingUser } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.length > 0) {
      return Response.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const { rows: created } = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name, normalizedEmail, hashedPassword]
    );

    // Send welcome email
    await sendWelcomeEmail(normalizedEmail, name);

    return Response.json(
      {
        message: 'User created successfully',
        userId: created[0].id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
