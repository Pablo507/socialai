import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { prompt, userId } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    // 1. Traducir prompt al inglés con Groq
    let englishPrompt = prompt;
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{
            role: 'user',
            content: `Translate this image description to English. Reply ONLY with the translation, nothing else: "${prompt}"`,
          }],
          max_tokens: 100,
        }),
      });
      const groqData = await groqRes.json();
      englishPrompt = groqData.choices?.[0]?.message?.content?.trim() || prompt;
    } catch {
      console.log('Translation failed, using original prompt');
    }

    const styles = [
      `${englishPrompt}, professional photo, high quality, 4k, sharp focus, realistic`,
      `${englishPrompt}, digital art style, vibrant colors, detailed illustration`,
      `${englishPrompt}, minimalist style, clean white background, studio lighting`,
      `${englishPrompt}, cinematic photography, dramatic lighting, bokeh`,
    ];

    const images: string[] = [];

    // 2. Generar cada imagen con Fal.ai FLUX Schnell
    for (let i = 0; i < styles.length; i++) {
      const styledPrompt = styles[i];

      const falRes = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: styledPrompt,
          image_size: 'square_hd',
          num_inference_steps: 4,
          num_images: 1,
          enable_safety_checker: true,
        }),
      });

      if (!falRes.ok) {
        const err = await falRes.text();
        throw new Error(`Fal.ai error: ${err}`);
      }

      const falData = await falRes.json();
      const imageUrl = falData.images?.[0]?.url;

      if (!imageUrl) throw new Error('No image URL from Fal.ai');

      // 3. Descargar imagen
      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) throw new Error('Failed to download image from Fal.ai');
      const imgBuffer = await imgResponse.arrayBuffer();

      // 4. Subir a Supabase Storage
      const fileName = `${userId || 'anon'}/${Date.now()}-style${i}.webp`;
      const { error: uploadError } = await supabase.storage
        .from('Images')
        .upload(fileName, Buffer.from(imgBuffer), {
          contentType: 'image/webp',
          upsert: false,
        });

      if (uploadError) throw new Error(`Supabase upload error: ${uploadError.message}`);

      // 5. Obtener URL pública
      const { data: publicData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      images.push(publicData.publicUrl);
    }

    return Response.json({ images });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
