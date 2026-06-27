import { cookies } from 'next/headers';
import { verifyToken } from './auth';

export async function getAuthToken(request) {
  try {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('auth_token')?.value;

    if (cookieToken) {
      const payload = verifyToken(cookieToken);
      if (payload) return { token: cookieToken, payload };
    }
  } catch (error) {
    console.error('Error reading cookie:', error);
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.slice(7);
    const payload = verifyToken(headerToken);
    if (payload) return { token: headerToken, payload };
  }

  return null;
}
