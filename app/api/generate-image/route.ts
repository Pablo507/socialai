import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_FREE = 10;

async function getUsageCount(userId: string): Promise<number> {
  const { data } = await supabase
    .from('user_usage')
    .select('generation_count')
    .eq('user_id', userId)
    .single();
  return data?.generation_count ?? 0;
}

async function incrementUsage(userId: string) {
  await supabase.rpc('increment_usage', { uid: userId });
}

// Traduce prompt en español a keywords en inglés para Unsplash
async function extractEnglishKeywords(prompt: string): Promise<string> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Convert this Spanish business description into 3-4 English visual keywords for a stock photo search. Return ONLY the keywords separated by spaces, nothing else.\n\nDescription: ${prompt}`,
        }],
        max_tokens: 30,
        temperature: 0.3,
      }),
    });
    if (!res.ok) return 'business professional marketing';
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'business professional marketing';
  } catch {
    return 'business professional marketing';
  }
}

export async function POST(request: Request) {
  try {
    const { prompt, userId } = await request.json();
    if (!prompt) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    // Verificar límite
    if (userId) {
      const count = await getUsageCount(userId);
      if (count >= MAX_FREE) {
        return Response.json({ limitReached: true });
      }
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    // Traducir prompt a keywords en inglés
    const englishKeywords = await extractEnglishKeywords(prompt);

    const queries = [
      englishKeywords,
      `${englishKeywords} product`,
      'business marketing professional',
      'social media content',
    ];

    const imagePromises = queries.map(async (query) => {
      for (const q of [query, 'business', 'technology', 'marketing']) {
        const res = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(q)}&orientation=squarish`,
          { headers: { Authorization: `Client-ID ${accessKey}` } }
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

    // Incrementar contador después de generación exitosa
    if (userId) {
      await incrementUsage(userId);

      // Guardar en historial
      await supabase.from('posts').insert({
        user_id: userId,
        prompt,
        image_url: null, // base64 no se guarda en posts, solo la URL si se sube
        platform: 'general',
        created_at: new Date().toISOString(),
      });
    }

    return Response.json({ images });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
