// Route dedicada para servir imágenes OG a WhatsApp y otras redes sociales
// WhatsApp tiene requisitos específicos:
// - La imagen debe responder con 200 (sin redirects)
// - Content-Type debe ser image/jpeg o image/png explícitamente
// - No puede ser mayor a 5MB
// - Debe responder en menos de 5 segundos

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing url param', { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(imageUrl);

    // Fetch con timeout de 4 segundos para no exceder el límite de WhatsApp
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const imageRes = await fetch(decodedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SocialAI/1.0)',
        'Accept': 'image/*',
      },
      // Seguir redirects automáticamente
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!imageRes.ok) {
      return new Response(`Upstream error: ${imageRes.status}`, { status: 502 });
    }

    const imageBuffer = await imageRes.arrayBuffer();

    // Detectar content-type real del buffer si el header no es confiable
    let contentType = imageRes.headers.get('content-type') || '';

    // Normalizar — WhatsApp es estricto con esto
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      contentType = 'image/jpeg';
    } else if (contentType.includes('png')) {
      contentType = 'image/png';
    } else if (contentType.includes('webp')) {
      contentType = 'image/webp';
    } else {
      // Detectar por magic bytes
      const bytes = new Uint8Array(imageBuffer.slice(0, 4));
      if (bytes[0] === 0xFF && bytes[1] === 0xD8) contentType = 'image/jpeg';
      else if (bytes[0] === 0x89 && bytes[1] === 0x50) contentType = 'image/png';
      else contentType = 'image/jpeg'; // fallback
    }

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(imageBuffer.byteLength),
        // Cache largo — la imagen no cambia una vez subida
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        // WhatsApp verifica este header
        'Accept-Ranges': 'bytes',
      },
    });

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new Response('Timeout fetching image', { status: 504 });
    }
    console.error('OG image error:', error);
    return new Response('Error fetching image', { status: 500 });
  }
}
