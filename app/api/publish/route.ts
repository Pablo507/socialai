import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { platform, text, imageUrl, facebookUserId, pageIndex = 0 } = await request.json();

    if (!platform || !text) {
      return Response.json({ error: 'platform y text son requeridos' }, { status: 400 });
    }

    // 1. Obtener tokens guardados de Supabase
    const { data: conn, error } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', facebookUserId)  // ✅ buscar por user_id de Supabase
      .single();

    if (error || !conn) {
      return Response.json({ error: 'Cuenta de Facebook no conectada' }, { status: 401 });
    }

    const connections = JSON.parse(conn.connections);
    const connection = connections[pageIndex];

    if (!connection) {
      return Response.json({ error: 'No se encontró la página' }, { status: 400 });
    }

    // ─── PUBLICAR EN FACEBOOK ──────────────────────────────
    if (platform === 'facebook') {
      const pageToken = connection.facebook_page_token;
      const pageId = connection.facebook_page_id;

      let publishRes;

      if (imageUrl) {
        const uploadRes = await fetch(
          `https://graph.facebook.com/v19.0/${pageId}/photos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: imageUrl,
              caption: text,
              access_token: pageToken,
              published: true,
            }),
          }
        );
        publishRes = await uploadRes.json();
      } else {
        const postRes = await fetch(
          `https://graph.facebook.com/v19.0/${pageId}/feed`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              access_token: pageToken,
            }),
          }
        );
        publishRes = await postRes.json();
      }

      if (publishRes.error) {
        throw new Error(`Facebook API error: ${publishRes.error.message}`);
      }

      return Response.json({
        success: true,
        platform: 'facebook',
        postId: publishRes.id,
        pageName: connection.facebook_page_name,
      });
    }

    // ─── PUBLICAR EN INSTAGRAM ────────────────────────────
    if (platform === 'instagram') {
      const igAccountId = connection.instagram_account_id;
      const pageToken = connection.facebook_page_token;

      if (!igAccountId) {
        return Response.json({
          error: 'Esta página de Facebook no tiene una cuenta de Instagram Business vinculada. Vinculala en la configuración de Facebook.',
        }, { status: 400 });
      }

      if (!imageUrl) {
        return Response.json({
          error: 'Instagram requiere una imagen para publicar.',
        }, { status: 400 });
      }

      // Paso 1: Crear contenedor de media
      const containerRes = await fetch(
        `https://graph.facebook.com/v19.0/${igAccountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: text,
            access_token: pageToken,
          }),
        }
      );
      const containerData = await containerRes.json();

      if (containerData.error) {
        throw new Error(`Instagram container error: ${containerData.error.message}`);
      }

      const creationId = containerData.id;

      // Paso 2: Publicar el contenedor
      const publishRes = await fetch(
        `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: pageToken,
          }),
        }
      );
      const publishData = await publishRes.json();

      if (publishData.error) {
        throw new Error(`Instagram publish error: ${publishData.error.message}`);
      }

      return Response.json({
        success: true,
        platform: 'instagram',
        postId: publishData.id,
      });
    }

    return Response.json({ error: 'Plataforma no soportada' }, { status: 400 });

  } catch (err: any) {
    console.error('Publish error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
