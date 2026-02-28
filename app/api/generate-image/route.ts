export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    const styles = [
      `${prompt}, professional photo, high quality, 4k, sharp focus`,
      `${prompt}, digital art style, vibrant colors, detailed illustration`,
      `${prompt}, minimalist style, clean background, studio lighting`,
      `${prompt}, cinematic photography, dramatic lighting, professional`,
    ];

    const imagePromises = styles.map(async (styledPrompt) => {
      const response = await fetch(
        'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: styledPrompt }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HF Error: ${error}`);
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    });

    const images = await Promise.all(imagePromises);
    return Response.json({ images });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
