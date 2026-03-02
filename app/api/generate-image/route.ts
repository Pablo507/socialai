export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    // Traducir prompt al inglés con Groq
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

    // Devolver URLs directamente — el browser las carga sin pasar por el servidor
    const images = styles.map((style, i) => {
      const encoded = encodeURIComponent(style);
      const seed = Math.floor(Math.random() * 999999);
      return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&seed=${seed}&nologo=true`;
    });

    return Response.json({ images });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
