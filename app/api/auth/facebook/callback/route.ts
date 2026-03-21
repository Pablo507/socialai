import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();

  // 1. Configuración de Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // 2. Obtener el ID del usuario para el parámetro 'state' (Seguridad CSRF)
  const { data: { user } } = await supabase.auth.getUser();
  const state = user?.id ?? Math.random().toString(36).substring(2);

  // 3. Configuración de variables de Meta
  const clientId = process.env.FACEBOOK_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;
  
  // Scopes necesarios para SocialAI (Instagram + Facebook Pages)
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
    'public_profile',
    'email',
  ].join(',');

  // 4. Construcción de la URL de Facebook
  // Usamos 'reauthenticate' para forzar el login manual en el video de Meta
  const facebookAuthUrl =
    `https://www.facebook.com/v21.0/dialog/oauth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes}` +
    `&response_type=code` +
    `&state=${state}` +
    `&auth_type=reauthenticate`; 

  // 5. Redirección al flujo de Meta
  return Response.redirect(facebookAuthUrl);
}
