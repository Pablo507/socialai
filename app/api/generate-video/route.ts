import { createClient } from '@supabase/supabase-js';

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

// Traduce prompt en español a keywords en inglés para Pexels
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
          content: `Convert this Spanish video description into 2-3 English keywords for a stock video search. Return ONLY the keywords separated by spaces, nothing else. Keep it simple and visual.\n\nDescription: ${prompt}`,
        }],
        max_tokens: 20,
        temperature: 0.3,
      }),
    });
    if (!res.ok) return 'business social media';
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'business social media';
  } catch {
    return 'business social media';
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

    const keywords = await extractEnglishKeywords(prompt);

    // Buscar videos en Pexels
    const pexelsRes = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(keywords)}&per_page=4&orientation=portrait`,
      {
        headers: { Authorization: process.env.PEXELS_API_KEY! },
      }
    );

    if (!pexelsRes.ok) {
      throw new Error(`Pexels error: ${pexelsRes.status}`);
    }

    const pexelsData = await pexelsRes.json();
    const videos = pexelsData.videos || [];

    if (videos.length === 0) {
      // Fallback con query genérica
      const fallbackRes = await fetch(
        `https://api.pexels.com/videos/search?query=business+social+media&per_page=4&orientation=portrait`,
        { headers: { Authorization: process.env.PEXELS_API_KEY! } }
      );
      const fallbackData = await fallbackRes.json();
      videos.push(...(fallbackData.videos || []));
    }

    // Extraer URL del archivo HD o SD de cada video
    const videoResults = videos.slice(0, 4).map((v: any) => {
      const files = v.video_files || [];
      // Preferir HD (1280), si no SD, si no cualquiera
      const hd = files.find((f: any) => f.quality === 'hd' && f.width <= 1280);
      const sd = files.find((f: any) => f.quality === 'sd');
      const file = hd || sd || files[0];
      return {
        url: file?.link || '',
        thumbnail: v.image || '',
        duration: v.duration || 0,
        photographer: v.user?.name || 'Pexels',
      };
    }).filter((v: any) => v.url);

    if (videoResults.length === 0) {
      return Response.json({ error: 'No se encontraron videos' }, { status: 404 });
    }

    // Incrementar contador
    if (userId) {
      await incrementUsage(userId);
    }

    return Response.json({ videos: videoResults });

  } catch (error: any) {
    console.error('Video generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
