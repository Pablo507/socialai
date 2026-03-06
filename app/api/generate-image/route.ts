export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    // Queries con fallbacks genéricos
    const queries = [
      prompt,
      `${prompt} business`,
      'marketing social media',
      'business professional',
    ];

    const imagePromises = queries.map(async (query) => {
      // Intentar con el query específico, si falla usar uno genérico
      for (const q of [query, 'business', 'technology', 'marketing']) {
        const res = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(q)}&orientation=squarish`,
          {
            headers: { Authorization: `Client-ID ${accessKey}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const imageUrl = data.urls?.regular;
          if (imageUrl) {
            const imgRes = await fetch(imageUrl);
            const buffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
            return `data:${contentType};base64,${base64}`;
          }
        }
      }
      throw new Error('No image found');
    });

    const images = await Promise.all(imagePromises);
    return Response.json({ images });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

