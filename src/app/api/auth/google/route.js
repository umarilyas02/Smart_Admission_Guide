import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import pool from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

const clientId = process.env.GOOGLE_CLIENT_ID;
const oauthClient = clientId ? new OAuth2Client(clientId) : null;

export async function POST(request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return Response.json({ error: 'Missing Google credential' }, { status: 400 });
    }

    if (!oauthClient) {
      console.error('GOOGLE_CLIENT_ID is not configured');
      return Response.json({ error: 'Google login is not configured' }, { status: 500 });
    }

    // Verify the Google ID token
    let payload;
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error('Failed to verify Google ID token:', err);
      return Response.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const email = payload?.email;
    const name = payload?.name || email?.split('@')[0] || 'Google User';

    if (!email) {
      return Response.json({ error: 'Google account does not provide an email' }, { status: 400 });
    }

    // Find or create user in local DB
    const { rows } = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email]
    );

    let user = rows[0];

    if (!user) {
      // Create a random password to satisfy NOT NULL constraint
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await hashPassword(randomPassword);
      const { rows: inserted } = await pool.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, hashedPassword]
      );
      user = inserted[0];
    }

    // Issue our JWT for downstream usage
    const token = generateToken(user.id, user.email);

    const response = Response.json(
      {
        message: 'Login successful',
        user,
      },
      { status: 200 }
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google login error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
