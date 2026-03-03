export const maxDuration = 60; // Vercel max duration en segundos

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

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

    // 2. Generar las 4 imágenes EN PARALELO
    const imagePromises = styles.map(async (styledPrompt) => {
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

      // Descargar y convertir a base64
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error('Failed to download image');
      const buffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      return `data:${contentType};base64,${base64}`;
    });

    // Esperar todas en paralelo
    const images = await Promise.all(imagePromises);

    return Response.json({ images });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
