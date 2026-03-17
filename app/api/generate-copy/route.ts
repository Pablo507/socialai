import { createClient } from '@supabase/supabase-js';

// Inicialización segura para evitar errores si las variables no existen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MAX_FREE = 10;

async function getUsageCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_usage')
      .select('generation_count')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 es "no rows found"
      console.error('Error fetching usage:', error);
      return 0;
    }
    return data?.generation_count ?? 0;
  } catch (e) {
    console.error('Supabase getUsage error:', e);
    return 0;
  }
}

async function incrementUsage(userId: string) {
  try {
    const { error } = await supabase.rpc('increment_usage', { uid: userId });
    if (error) console.error('Error incrementing usage:', error);
  } catch (e) {
    console.error('RPC increment error:', e);
  }
}

export async function POST(request: Request) {
  try {
    // Validar que el cuerpo de la petición sea JSON válido
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return Response.json({ error: 'Cuerpo de petición inválido' }, { status: 400 });
    }

    const { prompt, industry, goal, tone, platforms, userId } = body;

    if (!prompt) {
      return Response.json({ error: 'El producto o tema es requerido' }, { status: 400 });
    }

    // 1. Verificar límite (con manejo de errores para que no bloquee la generación si falla DB)
    if (userId && supabaseUrl) {
      const count = await getUsageCount(userId);
      if (count >= MAX_FREE) {
        return Response.json({ 
          error: 'Límite alcanzado', 
          limitReached: true 
        }, { status: 403 });
      }
    }

    // 2. Configuración de Prompts e IA
    const platformList = platforms?.length > 0 ? platforms.join(', ') : 'redes sociales';
    
    const ctaMap: Record<string, string> = {
      'Amigable':    '¡Escribinos y te ayudamos!',
      'Profesional': 'Consultá sin compromiso.',
      'Divertido':    '¿A qué esperás? 👀',
      'Urgente':      'Solo por hoy — reservá ya.',
      'Inspirador':  'Empezá tu transformación hoy.',
    };
    const ctaExamples = ctaMap[tone] || ctaMap['Amigable'];

    const linesMap: Record<string, number> = {
      'Facebook': 3, 'Instagram': 2, 'WhatsApp': 2,
    };
    const maxLines = Math.max(...(platforms || ['Facebook']).map((p: string) => linesMap[p] || 2));

    const systemPrompt = `Eres un experto en copywriting SEO para redes sociales de Uruguay y Argentina.
REGLAS:
- Máximo ${maxLines} líneas + hashtags.
- CTA: ${ctaExamples}
- Idioma: Español rioplatense.`;

    // 3. Llamada a Groq
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Producto: ${prompt}. Industria: ${industry}. Objetivo: ${goal}. Tono: ${tone}.` },
        ],
        max_tokens: 250,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error('Groq API Error:', errorData);
      return Response.json({ error: 'La IA no respondió correctamente' }, { status: 502 });
    }

    const groqData = await groqResponse.json();
    const copy = groqData.choices?.[0]?.message?.content?.trim();

    if (!copy) {
      return Response.json({ error: 'La IA devolvió un resultado vacío' }, { status: 500 });
    }

    // 4. Guardar historial (en segundo plano, no bloquea la respuesta)
    if (userId && supabaseUrl) {
      incrementUsage(userId).catch(console.error);
      supabase.from('posts').insert({
        user_id: userId,
        prompt,
        copy_text: copy,
        platform: platforms?.[0]?.toLowerCase() || 'general',
        industry: industry || 'General',
        goal: goal || 'Engagement',
      }).then(({ error }) => { if (error) console.error('History Save Error:', error); });
    }

    // Respuesta final exitosa
    return Response.json({ copy });

  } catch (error: any) {
    console.error('Global API Error:', error);
    return Response.json({ 
      error: 'Error interno del servidor', 
      details: error.message 
    }, { status: 500 });
  }
}
