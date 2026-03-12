import * as fal from '@fal-ai/serverless-client';

fal.config({ credentials: process.env.FAL_KEY });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return Response.json({ error: 'requestId requerido' }, { status: 400 });
    }

    const status = await fal.queue.status('fal-ai/kling-video/v1.5/standard/text-to-video', {
      requestId,
      logs: false,
    });

    if (status.status === 'COMPLETED') {
      const result = await fal.queue.result('fal-ai/kling-video/v1.5/standard/text-to-video', {
        requestId,
      });
      const videoUrl = (result as any)?.video?.url ?? null;
      return Response.json({ status: 'completed', videoUrl });
    }

    if (status.status === 'FAILED') {
      return Response.json({ status: 'failed' });
    }

    // IN_QUEUE o IN_PROGRESS
    return Response.json({
      status: 'processing',
      queuePosition: (status as any).queue_position ?? null,
    });

  } catch (error: any) {
    console.error('Video status error:', error);
    return Response.json({ status: 'failed', error: error.message }, { status: 500 });
  }
}
