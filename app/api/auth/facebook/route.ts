import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // ✅ FIX: El userId siempre llega desde el dashboard como ?state=uuid
  // ya NO usamos el fallback Math.random() que generaba strings no-UUID
  const userId = searchParams.get('state');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!userId) {
    // Si por alguna razón no hay userId, redirigir a login
    return Response.redirect(`${appUrl}/auth/login`);
  }

  const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID;
  const redirectUri = `${appUrl}/api/auth/facebook/callback`;

  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
    'public_profile',
    'email',
  ].join(',');

  const facebookAuthUrl =
    `https://www.facebook.com/v21.0/dialog/oauth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes}` +
    `&response_type=code` +
    `&state=${userId}`;

  return Response.redirect(facebookAuthUrl);
}
