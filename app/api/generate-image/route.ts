export const maxDuration = 30;

async function getKeywordsFromGroq(prompt: string, industry: string): Promise<string[]> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at generating Unsplash search keywords. Given a business prompt, return ONLY a JSON array of 4 short English keyword phrases (2-3 words each) that would find relevant, high-quality stock photos on Unsplash. No explanations, no markdown, just the JSON array.',
        },
        {
          role: 'user',
          content: `Business prompt: "${prompt}"\nIndustry: "${industry || 'general'}"\n\nReturn 4 English Unsplash search keywords as a JSON array. Focus on visual concepts, settings, and objects — not abstract ideas.`,
        },
      ],
      max_tokens: 100,
      temperature: 0.3,
    }),
  });

  if (!response.ok) throw new Error('Groq keyword error');

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim() || '[]';

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const keywords = JSON.parse(clean);
    if (Array.isArray(keywords) && keywords.length > 0) return keywords;
  } catch {
    // fallback si Groq no devuelve JSON válido
  }

  return [prompt, `${industry} business`, 'marketing professional', 'small business'];
}

async function fetchUnsplashImage(query: string, accessKey: string): Promise<string | null> {
  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=squarish`,
    { headers: { Authorization: `Client-ID ${accessKey}` } }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const imageUrl = data.urls?.regular;
  if (!imageUrl) return null;

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) return null;

  const buffer = await imgRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
  return `data:${contentType};base64,${base64}`;
}

export async function POST(request: Request) {
  try {
    const { prompt, industry } = await request.json();
    if (!prompt) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    // 1. Groq genera keywords en inglés alineadas al negocio
    const keywords = await getKeywordsFromGroq(prompt, industry || '');

    // 2. Buscar una imagen por keyword, en paralelo
    const imagePromises = keywords.map(async (keyword) => {
      const image = await fetchUnsplashImage(keyword, accessKey!);
      if (image) return image;
      // fallback genérico si esa keyword no tiene resultados
      return fetchUnsplashImage('small business marketing', accessKey!);
    });

    const images = (await Promise.all(imagePromises)).filter(Boolean) as string[];

    if (images.length === 0) {
      return Response.json({ error: 'No se encontraron imágenes' }, { status: 500 });
    }

    return Response.json({ images });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
