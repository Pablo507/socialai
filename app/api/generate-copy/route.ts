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

export async function POST(request: Request) {
  try {
    const { prompt, industry, goal, tone, platforms, userId } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    // Verificar límite si hay usuario autenticado
    if (userId) {
      const count = await getUsageCount(userId);
      if (count >= MAX_FREE) {
        return Response.json({ limitReached: true });
      }
    }

    const platformList = platforms?.join(', ') || 'redes sociales';

    const systemPrompt = `Eres un experto en marketing digital y copywriting para redes sociales latinoamericanas.
Escribís copies persuasivos, creativos y adaptados al español rioplatense (Uruguay/Argentina).
Siempre incluís emojis relevantes, hashtags populares y llamados a la acción efectivos.
Tu escritura es natural, auténtica y conecta emocionalmente con la audiencia.`;

    const userPrompt = `Crea un copy para redes sociales con estas especificaciones:

- Plataforma(s): ${platformList}
- Industria: ${industry || 'General'}
- Objetivo: ${goal || 'Generar engagement'}
- Tono: ${tone || 'Amigable'}
- Producto/Idea: ${prompt}

Escribí UN copy completo y listo para publicar. Incluí emojis, saltos de línea para mejor lectura, y hashtags al final.
No incluyas explicaciones ni comentarios, solo el copy.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq Error: ${error}`);
    }

    const data = await response.json();
    const copy = data.choices?.[0]?.message?.content?.trim();

    if (!copy) throw new Error('No se generó contenido');

    // Incrementar contador después de generación exitosa
    if (userId) {
      await incrementUsage(userId);

      // Guardar en historial
      await supabase.from('posts').insert({
        user_id: userId,
        prompt,
        copy_text: copy,
        platform: platforms?.[0]?.toLowerCase() || 'general',
        industry: industry || 'General',
        goal: goal || 'Generar engagement',
        created_at: new Date().toISOString(),
      });
    }

    return Response.json({ copy });

  } catch (error: any) {
    console.error('Copy generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
