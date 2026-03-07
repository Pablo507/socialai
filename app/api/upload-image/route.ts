import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { imageBase64, userId } = await request.json();

    if (!imageBase64) {
      return Response.json({ error: 'imageBase64 requerido' }, { status: 400 });
    }

    // Extraer el tipo y los datos del base64
    // Formato: "data:image/jpeg;base64,/9j/4AAQ..."
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return Response.json({ error: 'Formato de imagen inválido' }, { status: 400 });
    }

    const contentType = matches[1]; // ej: "image/jpeg"
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const extension = contentType.split('/')[1] || 'jpg';

    // Nombre único para evitar colisiones
    const fileName = `${userId || 'anon'}-${Date.now()}.${extension}`;
    const filePath = `whatsapp/${fileName}`;

    // Subir al bucket "Images" de Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('Images')
      .upload(filePath, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload error: ${uploadError.message}`);
    }

    // Obtener la URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('Images')
      .getPublicUrl(filePath);

    return Response.json({ publicUrl });

  } catch (error: any) {
    console.error('Upload image error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
