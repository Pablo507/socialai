import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Meta envía una signed_request con los datos del usuario a eliminar
function parseSignedRequest(signedRequest: string, appSecret: string) {
  const [encodedSig, payload] = signedRequest.split('.');

  const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const data = JSON.parse(
    Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
  );

  const expectedSig = createHmac('sha256', appSecret)
    .update(payload)
    .digest();

  if (!sig.equals(expectedSig)) {
    throw new Error('Invalid signature');
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let signedRequest: string;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = await request.text();
      const params = new URLSearchParams(body);
      signedRequest = params.get('signed_request') || '';
    } else {
      const body = await request.json();
      signedRequest = body.signed_request || '';
    }

    if (!signedRequest) {
      return Response.json({ error: 'Missing signed_request' }, { status: 400 });
    }

    const appSecret = process.env.FACEBOOK_APP_SECRET!;
    const data = parseSignedRequest(signedRequest, appSecret);
    const facebookUserId = data.user_id;

    // Generar un código de confirmación único
    const confirmationCode = `del_${facebookUserId}_${Date.now()}`;

    // Eliminar los datos del usuario de Supabase
    if (facebookUserId) {
      await supabase
        .from('social_connections')
        .delete()
        .eq('facebook_user_id', facebookUserId);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://socialai-iota.vercel.app';

    // Meta requiere esta respuesta exacta con url y confirmation_code
    return Response.json({
      url: `${appUrl}/data-deletion?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });

  } catch (err: any) {
    console.error('Data deletion error:', err);
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
}
