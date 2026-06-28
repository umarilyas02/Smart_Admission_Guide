import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const ADMIN_EMAIL = 'smartadmissionguide@gmail.com';

export function getRequestToken(request) {
  const cookieToken = request.cookies.get('auth_token')?.value;
  if (cookieToken) return cookieToken;

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export function getAuthenticatedUser(request) {
  const token = getRequestToken(request);
  if (!token) return null;
  return verifyToken(token);
}

export function getAuthenticatedUserId(request) {
  return getAuthenticatedUser(request)?.userId || null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function requireAuthenticatedUser(request) {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return { user: null, response: unauthorizedResponse() };
  }

  return { user, response: null };
}

export function requireAdminUser(request) {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return { user: null, response: unauthorizedResponse() };
  }

  if (user.email !== ADMIN_EMAIL) {
    return { user: null, response: forbiddenResponse() };
  }

  return { user, response: null };
}
