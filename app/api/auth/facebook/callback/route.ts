// app/api/auth/facebook/callback/route.ts
// Paso 2: Facebook redirige acá con un "code", lo intercambiamos por un token

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=facebook_auth_cancelled`);
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;

  try {
    // 1. Intercambiar code por access_token de usuario
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${process.env.FACEBOOK_APP_ID}` +
      `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error('No access token received: ' + JSON.stringify(tokenData));
    }

    const userAccessToken = tokenData.access_token;

    // 2. Obtener ID del usuario de Facebook
    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me?access_token=${userAccessToken}`
    );
    const meData = await meRes.json();
    const facebookUserId = meData.id;

    // 3. Obtener páginas de Facebook que administra
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`
    );
    const pagesData = await pagesRes.json();
    const pages = pagesData.data || [];

    // 4. Para cada página, buscar cuenta de Instagram asociada
    const connections: any[] = [];

    for (const page of pages) {
      // Token de larga duración para la página
      const pageToken = page.access_token;

      // Buscar Instagram Business Account vinculada
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}` +
        `?fields=instagram_business_account` +
        `&access_token=${pageToken}`
      );
      const igData = await igRes.json();

      connections.push({
        facebook_page_id: page.id,
        facebook_page_name: page.name,
        facebook_page_token: pageToken,
        instagram_account_id: igData.instagram_business_account?.id || null,
      });
    }

    // 5. Obtener el usuario logueado en Supabase desde la cookie
    // Usamos el header de la request para identificar la sesión
    const cookieHeader = request.headers.get('cookie') || '';

    // Guardar en Supabase la conexión de Meta
    // Necesitamos el userId de Supabase — lo pasamos como state en el OAuth
    // Por simplicidad usamos una tabla social_connections
    await supabase.from('social_connections').upsert({
      facebook_user_id: facebookUserId,
      user_access_token: userAccessToken,
      connections: JSON.stringify(connections),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'facebook_user_id' });

    // 6. Redirect al dashboard con éxito
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?facebook_connected=true&pages=${pages.length}`;
    return Response.redirect(successUrl);

  } catch (err: any) {
    console.error('Facebook OAuth error:', err);
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=facebook_auth_failed`);
  }
}
