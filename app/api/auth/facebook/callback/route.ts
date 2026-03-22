import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state'); // El UUID del usuario

  // ✅ FIX #3: Usar siempre NEXT_PUBLIC_APP_URL para que coincida con el redirect_uri
  // del auth route y evitar "redirect_uri mismatch" en Vercel preview URLs
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code || !userId) {
    return NextResponse.redirect(`${appUrl}/dashboard?error=missing_parameters`);
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    // ✅ FIX #2: Fallback a FACEBOOK_APP_ID si NEXT_PUBLIC_FACEBOOK_APP_ID no está definido
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    // ✅ FIX #3: redirect_uri debe ser idéntico al usado en el auth route
    const redirectUri = `${appUrl}/api/auth/facebook/callback`;

    // 1. Intercambiar el código por el User Access Token de Facebook
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    );
    const tokenData = await tokenResponse.json();

    if (tokenData.error) throw new Error(tokenData.error.message);

    const userToken = tokenData.access_token;

    // 2. Obtener las FanPages e Instagram IDs vinculados
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=name,access_token,instagram_business_account&access_token=${userToken}`
    );
    const pagesData = await pagesResponse.json();

    const connections = (pagesData.data || []).map((page: any) => ({
      facebook_page_id: page.id,
      facebook_page_name: page.name,
      facebook_page_token: page.access_token,
      instagram_account_id: page.instagram_business_account?.id || null,
    }));

    // 3. Guardar en la tabla social_connections
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: userId,
        facebook_user_id: tokenData.user_id || userId,
        user_access_token: userToken,
        connections: connections,
        updated_at: new Date().toISOString(),
      });

    if (dbError) throw dbError;

    // ✅ FIX #1: Usar ?facebook_connected=true para que el dashboard lo detecte correctamente
    return NextResponse.redirect(`${appUrl}/dashboard?facebook_connected=true`);

  } catch (err: any) {
    console.error('Error en Facebook Callback:', err.message);
    return NextResponse.redirect(`${appUrl}/dashboard?error=facebook_auth_failed`);
  }
}
