import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const supabaseUserId = searchParams.get('state'); // ← user_id de Supabase

  if (error || !code) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=facebook_auth_cancelled`
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;

  try {
    // 1. Intercambiar code por short-lived access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token` +
      `?client_id=${process.env.FACEBOOK_APP_ID}` +
      `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error('No access token received: ' + JSON.stringify(tokenData));
    }

    // 2. Extender a long-lived token (~60 días)
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${process.env.FACEBOOK_APP_ID}` +
      `&client_secret=${process.env.FACEBOOK_APP_SECRET}` +
      `&fb_exchange_token=${tokenData.access_token}`
    );
    const longLivedData = await longLivedRes.json();
    const userAccessToken = longLivedData.access_token ?? tokenData.access_token;

    // 3. Obtener ID del usuario de Facebook
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${userAccessToken}`
    );
    const meData = await meRes.json();
    const facebookUserId = meData.id;

    // 4. Obtener páginas de Facebook que administra
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`
    );
    const pagesData = await pagesRes.json();
    const pages = pagesData.data || [];

    // 5. Para cada página, buscar cuenta de Instagram asociada
    const connections: any[] = [];
    for (const page of pages) {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}` +
        `?fields=instagram_business_account` +
        `&access_token=${page.access_token}`
      );
      const igData = await igRes.json();
      connections.push({
        facebook_page_id: page.id,
        facebook_page_name: page.name,
        facebook_page_token: page.access_token,
        instagram_account_id: igData.instagram_business_account?.id ?? null,
      });
    }

    // 6. Guardar en Supabase vinculado al usuario de Supabase
    await supabase.from('social_connections').upsert({
      user_id: supabaseUserId,
      facebook_user_id: facebookUserId,
      user_access_token: userAccessToken,
      connections: JSON.stringify(connections),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'facebook_user_id' });

    // 7. Redirect al dashboard con éxito
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?facebook_connected=true&pages=${pages.length}`
    );

  } catch (err: any) {
    console.error('Facebook OAuth error:', err);
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=facebook_auth_failed`
    );
  }
}
