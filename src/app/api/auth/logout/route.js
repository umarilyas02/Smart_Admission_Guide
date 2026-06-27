export async function POST(request) {
  const response = Response.json(
    { message: 'Logged out successfully' },
    { status: 200 }
  );

  response.cookies.delete('auth_token');

  return response;
}
