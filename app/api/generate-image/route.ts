export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    // Traducir prompt
    let englishPrompt = prompt;

    try {
      const groqRes = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'user',
                content: `Translate this image description to English. Reply ONLY with the translation: "${prompt}"`,
              },
            ],
            max_tokens: 100,
          }),
        }
      );

      const groqData = await groqRes.json();
      englishPrompt =
        groqData.choices?.[0]?.message?.content?.trim() || prompt;
    } catch {
      console.log('Translation failed, using original prompt');
    }

    const styles = [
      `${englishPrompt}, professional photo, high quality, 4k, sharp focus, realistic`,
      `${englishPrompt}, digital art style, vibrant colors, detailed illustration`,
      `${englishPrompt}, minimalist style, clean white background, studio lighting`,
      `${englishPrompt}, cinematic photography, dramatic lighting, professional`,
    ];

    const imagePromises = styles.map(async (styledPrompt) => {
      const response = await fetch(
        'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: styledPrompt,
            parameters: { num_inference_steps: 4 },
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

    const images = await Promise.all(imagePromises);

    return Response.json({ images });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
