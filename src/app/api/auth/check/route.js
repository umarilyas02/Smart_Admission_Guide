import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return Response.json({ authenticated: false }, { status: 200 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({ authenticated: false }, { status: 200 });
    }

    return Response.json(
      {
        authenticated: true,
        user: {
          id: payload.userId,
          email: payload.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json({ authenticated: false }, { status: 200 });
  }
}
