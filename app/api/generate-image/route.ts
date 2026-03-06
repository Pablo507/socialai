export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    // Buscar 4 fotos relacionadas al prompt
    const queries = [
      prompt,
      `${prompt} business`,
      `${prompt} professional`,
      `${prompt} marketing`,
    ];

    const imagePromises = queries.map(async (query) => {
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=squarish`,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Unsplash error: ${res.status}`);
      const data = await res.json();
      const imageUrl = data.urls?.regular;
      if (!imageUrl) throw new Error('No image URL from Unsplash');

      // Descargar y convertir a base64
      const imgRes = await fetch(imageUrl);
      const buffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      return `data:${contentType};base64,${base64}`;
    });

    const images = await Promise.all(imagePromises);
    return Response.json({ images });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}


