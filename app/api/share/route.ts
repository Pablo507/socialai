import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { imageBase64, copyText, userId, platform } = await request.json();

    if (!copyText) {
      return Response.json({ error: 'copyText requerido' }, { status: 400 });
    }

    // 1. Subir imagen a Supabase Storage si viene en base64
    let imageUrl: string | null = null;

    if (imageBase64 && imageBase64.startsWith('data:')) {
      const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const extension = contentType.split('/')[1] || 'jpg';
        const fileName = `${userId || 'anon'}-${Date.now()}.${extension}`;
        const filePath = `shares/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('Images')
          .upload(filePath, buffer, { contentType, upsert: false });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('Images')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
        }
      }
    }

    // 2. Generar un share_id único (8 chars, URL-friendly)
    const shareId = randomBytes(4).toString('hex'); // ej: "a3f9c1d2"

    // 3. Guardar en la tabla posts con share_id e is_public
    const { error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: userId || null,
        share_id: shareId,
        is_public: true,
        copy_text: copyText,
        image_url: imageUrl,
        platform: platform || 'whatsapp',
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      throw new Error(`No se pudo guardar: ${insertError.message}`);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://socialai-iota.vercel.app';
    const shareUrl = `${appUrl}/share/${shareId}`;

    return Response.json({ shareUrl, shareId });

  } catch (error: any) {
    console.error('Share error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
