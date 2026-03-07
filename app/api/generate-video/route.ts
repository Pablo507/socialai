import * as fal from '@fal-ai/serverless-client';

export const maxDuration = 60;

fal.config({ credentials: process.env.FAL_KEY });

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt requerido' }, { status: 400 });
    }

    // Enviar a la cola de Kling AI vía Fal.ai (genera ~5s de video)
    const { request_id } = await fal.queue.submit('fal-ai/kling-video/v1.5/standard/text-to-video', {
      input: {
        prompt,
        duration: '5',
        aspect_ratio: '9:16',
      },
    });

    return Response.json({ requestId: request_id });

  } catch (error: any) {
    console.error('Video generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
