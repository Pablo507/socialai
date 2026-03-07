// app/api/mp-webhook/route.ts
// Recibe notificaciones de Mercado Pago (IPN/Webhooks)
//
// CONFIGURACIÓN en el panel de MP:
// Tu Aplicación → Webhooks → Agregar URL:
// https://tu-app.vercel.app/api/mp-webhook
// Eventos a suscribir: subscription_preapproval
//
// Documentación: https://www.mercadopago.com.uy/developers/es/docs/your-integrations/notifications/webhooks

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSubscription, getPlanNameFromId } from '@/lib/mercadopago';
import crypto from 'crypto';

// Service role para bypass de RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verificar firma del webhook de Mercado Pago
 * https://www.mercadopago.com.uy/developers/es/docs/your-integrations/notifications/webhooks#bookmark_validar_origem_das_notifica__es
 */
function verifyWebhookSignature(req: NextRequest, rawBody: string): boolean {
  const signature = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id');

  if (!signature || !requestId) return false;

  // Extraer ts y v1 del header x-signature
  const signatureParts = Object.fromEntries(
    signature.split(',').map(part => part.split('='))
  );

  const ts = signatureParts['ts'];
  const v1 = signatureParts['v1'];

  if (!ts || !v1) return false;

  // Construir el string a firmar
  const manifest = `id:${req.nextUrl.searchParams.get('data.id')};request-id:${requestId};ts:${ts};`;

  const expectedHash = crypto
    .createHmac('sha256', process.env.MP_WEBHOOK_SECRET || '')
    .update(manifest)
    .digest('hex');

  return expectedHash === v1;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    console.log('📩 Webhook MP recibido:', body.type, body.action);

    // Verificar firma en producción (protege contra webhooks falsos)
    if (process.env.NODE_ENV === 'production' && process.env.MP_WEBHOOK_SECRET) {
      if (!verifyWebhookSignature(req, rawBody)) {
        console.warn('⚠️ Webhook MP: firma inválida');
        return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
      }
    }

    // Solo procesamos eventos de suscripciones
    if (body.type !== 'subscription_preapproval') {
      return NextResponse.json({ received: true });
    }

    const subscriptionId = body.data?.id;
    if (!subscriptionId) {
      return NextResponse.json({ received: true });
    }

    // Obtener detalles de la suscripción desde MP
    const subscription = await getSubscription(subscriptionId);

    const userId = subscription.external_reference; // Lo guardamos al crear la suscripción
    const status = subscription.status;
    const planId = subscription.preapproval_plan_id;
    const planName = getPlanNameFromId(planId);

    console.log(`👤 Usuario: ${userId}`);
    console.log(`📋 Plan: ${planName}`);
    console.log(`📊 Estado: ${status}`);

    switch (body.action) {
      // Suscripción autorizada (primer pago exitoso)
      case 'created':
      case 'updated': {
        if (status === 'authorized') {
          // Activar plan en Supabase
          await supabase.from('profiles').update({
            plan: planName,
            mp_subscription_id: subscriptionId,
            mp_customer_id: subscription.payer_id?.toString(),
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          }).eq('id', userId);

          console.log(`✅ Plan ${planName} activado para usuario ${userId}`);

        } else if (status === 'paused') {
          // Suscripción pausada (pago fallido pero reintentando)
          await supabase.from('profiles').update({
            subscription_status: 'paused',
            updated_at: new Date().toISOString(),
          }).eq('id', userId);

        } else if (status === 'cancelled') {
          // Suscripción cancelada → volver a free
          await supabase.from('profiles').update({
            plan: 'free',
            subscription_status: 'cancelled',
            mp_subscription_id: null,
            updated_at: new Date().toISOString(),
          }).eq('id', userId);

          console.log(`❌ Suscripción cancelada para usuario ${userId}`);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Error procesando webhook MP:', error);
    // Siempre devolver 200 para que MP no reintente
    return NextResponse.json({ received: true });
  }
}

// MP también hace GET para verificar que el endpoint existe
export async function GET() {
  return NextResponse.json({ status: 'SocialAI MP Webhook OK' });
}
