// app/api/auth/facebook/route.ts
// Paso 1: Redirigir al usuario a Facebook para autorizar

export async function GET() {
  const clientId = process.env.FACEBOOK_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;

 const scopes = [
  'instagram_basic',
  'instagram_content_publish',  // ✅ para publicar posts
  'pages_show_list',            // ✅ para listar páginas vinculadas
  'pages_read_engagement',      // ✅ para leer la página de FB asociada
  'email',
].join(',');
  
  const facebookAuthUrl =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${scopes}` +
    `&response_type=code` +
    `&state=${Math.random().toString(36).substring(2)}`;

  return Response.redirect(facebookAuthUrl);
}
