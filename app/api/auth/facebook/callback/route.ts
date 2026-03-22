
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state'); // <--- El UUID del usuario que enviamos desde el botón

  if (!code || !userId) {
    return NextResponse.redirect(`${origin}/dashboard?error=missing_parameters`);
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  try {
    // 1. Intercambiar el código por el User Access Token de Facebook
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&redirect_uri=${origin}/api/auth/facebook/callback&code=${code}`
    );
    const tokenData = await tokenResponse.json();

    if (tokenData.error) throw new Error(tokenData.error.message);

    const userToken = tokenData.access_token;

    // 2. Obtener las FanPages e Instagram IDs vinculados
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=name,access_token,instagram_business_account&access_token=${userToken}`
    );
    const pagesData = await pagesResponse.json();

    const connections = pagesData.data.map((page: any) => ({
      facebook_page_id: page.id,
      facebook_page_name: page.name,
      facebook_page_token: page.access_token,
      instagram_account_id: page.instagram_business_account?.id || null,
    }));

    // 3. Guardar en la tabla social_connections (La que aseguramos con RLS)
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: userId,
        facebook_user_id: tokenData.user_id || userId, // Ajustar según lo que devuelva Meta
        user_access_token: userToken,
        connections: connections, // Guardamos el array directamente (JSONB)
        updated_at: new Date().toISOString(),
      });

    if (dbError) throw dbError;

    return NextResponse.redirect(`${origin}/dashboard?success=connected`);

  } catch (err: any) {
    console.error('Error en Facebook Callback:', err.message);
    return NextResponse.redirect(`${origin}/dashboard?error=token_exchange_failed`);
  }
}
