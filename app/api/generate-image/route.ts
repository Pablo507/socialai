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

    // 2. Generar cada imagen con Replicate
    for (let i = 0; i < styles.length; i++) {
      const styledPrompt = styles[i];

      // Iniciar predicción
      const predResponse = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          input: {
            prompt: styledPrompt,
            num_outputs: 1,
            aspect_ratio: '1:1',
            output_format: 'webp',
            output_quality: 80,
          },
        }),
      });

      if (!predResponse.ok) {
        const err = await predResponse.text();
        throw new Error(`Replicate error: ${err}`);
      }

      const prediction = await predResponse.json();

      // Esperar resultado si no vino inmediato
      let imageUrl = prediction.output?.[0];
      if (!imageUrl) {
        const pollUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`;
        for (let attempt = 0; attempt < 30; attempt++) {
          await new Promise(r => setTimeout(r, 2000));
          const pollRes = await fetch(pollUrl, {
            headers: { 'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}` },
          });
          const pollData = await pollRes.json();
          if (pollData.status === 'succeeded') {
            imageUrl = pollData.output?.[0];
            break;
          }
          if (pollData.status === 'failed') {
            throw new Error('Replicate generation failed');
          }
        }
      }

      if (!imageUrl) throw new Error('No image URL from Replicate');

      // 3. Descargar imagen
      const imgResponse = await fetch(imageUrl);
      if (!imgResponse.ok) throw new Error('Failed to download image from Replicate');
      const imgBuffer = await imgResponse.arrayBuffer();

      // 4. Subir a Supabase Storage
      const fileName = `${userId || 'anon'}/${Date.now()}-style${i}.webp`;
      const { error: uploadError } = await supabase.storage
        .from('images')
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
