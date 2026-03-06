import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Obtener el usuario desde la cookie de Supabase
  const accessToken = cookieStore.get('sb-access-token')?.value 
    ?? cookieStore.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')?.[0]?.split('//')?.[1]}-auth-token`)?.value;

  let userId = '';
  if (accessToken) {
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    userId = user?.id ?? '';
  }

  const clientId = process.env.FACEBOOK_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
    'email',
  ].join(',');

  const state = userId || Math.random().toString(36).substring(2);

  const facebookAuthUrl =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes}` +
    `&response_type=code` +
    `&state=${state}`;

  return Response.redirect(facebookAuthUrl);
}
