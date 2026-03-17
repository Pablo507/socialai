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

    const ctaByTone: Record<string, string> = {
      'Amigable':     '¡Escribinos y te ayudamos! / Contanos qué necesitás 👇 / Mandanos un mensaje hoy',
      'Profesional':  'Consultá sin compromiso / Solicitá tu presupuesto / Coordiná una reunión →',
      'Divertido':    '¿A qué esperás? 👀 / Tu billetera te lo agradece 😅 / Spoiler: te va a encantar 🙌',
      'Urgente':      'Solo por hoy — reservá ya / Últimas unidades disponibles / Oferta termina esta noche ⏰',
      'Inspirador':   'Empezá tu transformación hoy / El cambio empieza con un paso / Tu mejor versión te espera →',
    };
    const ctaExamples = ctaByTone[tone] || ctaByTone['Amigable'];

    const linesByPlatform: Record<string, string> = {
      'Facebook':  '3 líneas + hashtags (Facebook permite algo más de contexto)',
      'Instagram': '2 líneas + hashtags (solo se ven 2 antes del "más")',
      'WhatsApp':  '2 líneas sin hashtags (mensaje directo y personal)',
    };
    const platformGuide = platforms?.map((p: string) => linesByPlatform[p] || '3 líneas + hashtags').join(' / ') || '3 líneas + hashtags';

    const ctaByTone: Record<string, string> = {
      'Amigable':     '¡Escribinos y te ayudamos! / Contanos qué necesitás 👇 / Mandanos un mensaje hoy',
      'Profesional':  'Consultá sin compromiso / Solicitá tu presupuesto / Coordiná una reunión →',
      'Divertido':    '¿A qué esperás? 👀 / Tu billetera te lo agradece 😅 / Spoiler: te va a encantar 🙌',
      'Urgente':      'Solo por hoy — reservá ya / Últimas unidades disponibles / Oferta termina esta noche ⏰',
      'Inspirador':   'Empezá tu transformación hoy / El cambio empieza con un paso / Tu mejor versión te espera →',
    };
    const ctaExamples = ctaByTone[tone] || ctaByTone['Amigable'];

    const linesByPlatform: Record<string, string> = {
      'Facebook':  '3 líneas + hashtags (feed amplio, permite algo de contexto)',
      'Instagram': '2 líneas + hashtags (solo se ven 2 antes del "más")',
      'WhatsApp':  '2 líneas sin hashtags (mensaje directo y personal)',
    };
    const formatGuide = platforms?.map((p: string) => linesByPlatform[p] || '3 líneas + hashtags').join(' | ') || '3 líneas + hashtags';

    const ctaByTone: Record<string, string> = {
      'Amigable':     '¡Escribinos y te ayudamos! / Contanos qué necesitás 👇 / Mandanos un mensaje hoy',
      'Profesional':  'Consultá sin compromiso / Solicitá tu presupuesto / Coordiná una reunión →',
      'Divertido':    '¿A qué esperás? 👀 / Tu billetera te lo agradece 😅 / Spoiler: te va a encantar 🙌',
      'Urgente':      'Solo por hoy — reservá ya / Últimas unidades disponibles / Oferta termina esta noche ⏰',
      'Inspirador':   'Empezá tu transformación hoy / El cambio empieza con un paso / Tu mejor versión te espera →',
    };
    const ctaExamples = ctaByTone[tone || 'Amigable'] || ctaByTone['Amigable'];

    const linesByPlatform: Record<string, string> = {
      'Facebook':  '3 líneas + hashtags (Facebook permite algo más de contexto)',
      'Instagram': '2 líneas + hashtags (solo se ven 2 antes del "más")',
      'WhatsApp':  '2-3 líneas sin hashtags (mensaje directo y personal)',
    };
    const formatGuide = platforms?.map((p: string) => linesByPlatform[p] || '3 líneas + hashtags').join(' / ') || '3 líneas + hashtags';

    const ctaByTone: Record<string, string> = {
      'Amigable':    '¡Escribinos y te ayudamos! / Contanos qué necesitás 👇 / Mandanos un mensaje hoy',
      'Profesional': 'Consultá sin compromiso / Solicitá tu presupuesto / Coordiná una reunión →',
      'Divertido':   '¿A qué esperás? 👀 / Tu billetera te lo agradece 😅 / Spoiler: te va a encantar 🙌',
      'Urgente':     'Solo por hoy — reservá ya / Últimas unidades disponibles / Oferta termina esta noche ⏰',
      'Inspirador':  'Empezá tu transformación hoy / El cambio empieza con un paso / Tu mejor versión te espera →',
    };
    const ctaExamples = ctaByTone[tone] || ctaByTone['Amigable'];

    const linesByPlatform: Record<string, string> = {
      'Facebook':  '3 líneas + hashtags (Facebook permite más contexto)',
      'Instagram': '2 líneas + hashtags (solo se ven 2 antes del "más")',
      'WhatsApp':  '2 líneas sin hashtags (mensaje directo y personal)',
    };
    const platformGuide = platforms?.map((p: string) => linesByPlatform[p] || '3 líneas + hashtags').join(' | ') || '3 líneas + hashtags';

    const ctaByTone: Record<string, string> = {
      'Amigable':     '¡Escribinos y te ayudamos! / Contanos qué necesitás 👇 / Mandanos un mensaje hoy',
      'Profesional':  'Consultá sin compromiso / Solicitá tu presupuesto / Coordiná una reunión →',
      'Divertido':    '¿A qué esperás? 👀 / Tu billetera te lo agradece 😅 / Spoiler: te va a encantar 🙌',
      'Urgente':      'Solo por hoy — reservá ya / Últimas unidades disponibles / Oferta termina esta noche ⏰',
      'Inspirador':   'Empezá tu transformación hoy / El cambio empieza con un paso / Tu mejor versión te espera →',
    };
    const ctaExamples = ctaByTone[tone] || ctaByTone['Amigable'];

    const linesByPlatform: Record<string, number> = {
      'Facebook': 4, 'Instagram': 3, 'WhatsApp': 3,
    };
    const maxLines = Math.max(...(platforms || ['Facebook']).map((p: string) => linesByPlatform[p] || 3));

    const systemPrompt = `Eres un experto en copywriting SEO para redes sociales. Escribís en español rioplatense (Uruguay/Argentina).
REGLAS ABSOLUTAS:
- Exactamente ${maxLines} líneas de texto + 1 línea de hashtags
- Línea 1: hook de máximo 8 palabras (pregunta, dato sorpresa o emoción fuerte)
- Línea 2: beneficio concreto en máximo 8 palabras
${maxLines >= 3 ? `- Línea 3: refuerzo o prueba social en máximo 8 palabras\n` : ``}- Última línea de texto: CTA corto usando este estilo: ${ctaExamples}
- Línea final: exactamente 3 hashtags relevantes para ${platformList}
- Máximo 1 emoji por línea, solo si suma valor
- NUNCA superar 55 palabras en total
- Tono ${tone}: mantenerlo en cada línea`;

    const userPrompt = `Copy SEO para ${platformList}:
Industria: ${industry || 'General'} | Objetivo: ${goal || 'Engagement'} | Tono: ${tone || 'Amigable'}
Producto: ${prompt}

Respondé SOLO con el copy, sin explicaciones ni títulos.`;

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
