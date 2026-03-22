import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const { searchParams } = new URL(request.url);
  
  // 1. Intentar obtener el ID del usuario desde el parámetro 'state' que enviamos del botón
  // o desde la sesión de Supabase como respaldo.
  let userId = searchParams.get('state');

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Si no venía en la URL, lo buscamos en la sesión activa
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || null;
  }

  // Si después de todo no hay ID, generamos un random (aunque para guardar tokens DEBE haber un ID)
  const state = userId ?? Math.random().toString(36).substring(2);

  const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;
  
  // Scopes necesarios para SocialAI (Lectura de páginas y publicación en Instagram/FB)
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts', // <--- IMPORTANTE para publicar
    'public_profile',
    'email',
  ].join(',');

  const facebookAuthUrl =
    `https://www.facebook.com/v21.0/dialog/oauth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes}` +
    `&response_type=code` +
    `&state=${state}`;

  return Response.redirect(facebookAuthUrl);
}
