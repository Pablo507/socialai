export async function POST(request: Request) {
  try {
    const { prompt, industry, goal, tone, platforms } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    const platformList = platforms?.join(', ') || 'redes sociales';

    const systemPrompt = `Eres un experto en marketing digital y copywriting para redes sociales latinoamericanas.
Escribes copies persuasivos, creativos y adaptados al español rioplatense (Uruguay/Argentina).
Siempre incluís emojis relevantes, hashtags populares y llamados a la acción efectivos.
Tu escritura es natural, auténtica y conecta emocionalmente con la audiencia.`;

    const userPrompt = `Crea un copy para redes sociales con estas especificaciones:

- Plataforma(s): ${platformList}
- Industria: ${industry || 'General'}
- Objetivo: ${goal || 'Generar engagement'}
- Tono: ${tone || 'Amigable'}
- Producto/Idea: ${prompt}

Escribe UN copy completo y listo para publicar. Incluí emojis, saltos de línea para mejor lectura, y hashtags al final.
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

    return Response.json({ copy });

  } catch (error: any) {
    console.error('Copy generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

