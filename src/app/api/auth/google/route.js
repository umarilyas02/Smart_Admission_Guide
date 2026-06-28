import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import pool from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

const clientId = process.env.GOOGLE_CLIENT_ID;
const oauthClient = clientId ? new OAuth2Client(clientId) : null;
const jwtSecret = process.env.JWT_SECRET;

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ error: 'Missing Google credential' }, { status: 400 });
    }

    if (!oauthClient) {
      console.error('GOOGLE_CLIENT_ID is not configured');
      return NextResponse.json({ error: 'Google login is not configured' }, { status: 500 });
    }

    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json({ error: 'Server auth is not configured' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const email = payload?.email?.trim().toLowerCase();
    const name = payload?.name || email?.split('@')[0] || 'Google User';

    if (!email) {
      return NextResponse.json({ error: 'Google account does not provide an email' }, { status: 400 });
    }

    if (payload?.email_verified === false) {
      return NextResponse.json({ error: 'Google account email is not verified' }, { status: 400 });
    }

    // Find or create user in local DB
    let rows;
    try {
      ({ rows } = await pool.query(
        'SELECT id, name, email FROM users WHERE email = $1',
        [email]
      ));
    } catch (dbError) {
      console.error('Failed to load Google user from database:', dbError);
      return NextResponse.json({ error: 'Database query failed during Google login' }, { status: 500 });
    }

    let user = rows[0];

    if (!user) {
      // Create a random password to satisfy NOT NULL constraint
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await hashPassword(randomPassword);
      try {
        const { rows: inserted } = await pool.query(
          'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
          [name, email, hashedPassword]
        );
        user = inserted[0];
      } catch (insertError) {
        if (insertError?.code === '23505') {
          const { rows: existing } = await pool.query(
            'SELECT id, name, email FROM users WHERE email = $1',
            [email]
          );
          user = existing[0];
        } else {
          console.error('Failed to create Google user:', insertError);
          return NextResponse.json({ error: 'Database insert failed during Google login' }, { status: 500 });
        }
      }
    }

    // Issue our JWT for downstream usage
    let token;
    try {
      token = generateToken(user.id, user.email);
    } catch (tokenError) {
      console.error('Failed to sign auth token for Google login:', tokenError);
      return NextResponse.json({ error: 'Token signing failed during Google login' }, { status: 500 });
    }

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user,
        token,
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
