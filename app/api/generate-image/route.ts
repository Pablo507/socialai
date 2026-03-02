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

    const images: string[] = [];

    for (const styledPrompt of styles) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: styledPrompt }]
            }],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini error: ${err}`);
      }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData);

      if (!imagePart?.inlineData?.data) {
        throw new Error('No image returned from Gemini');
      }

      const mimeType = imagePart.inlineData.mimeType || 'image/png';
      images.push(`data:${mimeType};base64,${imagePart.inlineData.data}`);
    }

    return Response.json({ images });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

