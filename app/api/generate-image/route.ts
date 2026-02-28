export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    const enhancedPrompt = `${prompt}, professional photography, high quality, 4k, detailed`;

    const seeds = [42, 123, 777, 999];
    const imagePromises = seeds.map(async (seed) => {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: enhancedPrompt,
            parameters: {
              seed,
              num_inference_steps: 20,
              width: 512,
              height: 512,
            },
          }),
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

    // Generamos las 4 imágenes en paralelo
    const images = await Promise.all(imagePromises);

    return Response.json({ images });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
