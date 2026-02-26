// app/api/create-subscription/route.ts
// Inicia el flujo de suscripción con Mercado Pago
//
// Flujo:
// 1. Usuario elige plan → llama a este endpoint
// 2. Este endpoint crea una preferencia de suscripción en MP
// 3. Devuelve la URL de checkout de MP
// 4. Usuario completa el pago en MP
// 5. MP redirige a /dashboard?payment=success
// 6. MP envía webhook → /api/mp-webhook (activa el plan)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mpFetch } from '@/lib/mercadopago';

const PLAN_IDS: Record<string, string> = {
  basic: process.env.MP_PLAN_BASIC_ID!,
  pro:   process.env.MP_PLAN_PRO_ID!,
};

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();

    // Verificar que el usuario esté autenticado
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para suscribirte' },
        { status: 401 }
      );
    }

    const planId = PLAN_IDS[plan];
    if (!planId) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    // Verificar si ya tiene suscripción activa
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, mp_subscription_id')
      .eq('id', user.id)
      .single();

    if (profile?.plan === 'pro' || profile?.plan === 'basic') {
      return NextResponse.json(
        { error: 'Ya tienes un plan activo' },
        { status: 400 }
      );
    }

    // Crear link de suscripción en Mercado Pago
    // Con preapproval_plan_id, MP usa el Checkout de MP directamente
    // El usuario no necesita ingresar tarjeta en tu sitio (más seguro y fácil)
    const mpResponse = await mpFetch('/preapproval', {
      method: 'POST',
      body: JSON.stringify({
        preapproval_plan_id: planId,
        reason: `SocialAI Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
        external_reference: user.id, // Guardamos el userId para el webhook
        back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success&plan=${plan}`,
        payer_email: user.email,
        // status: 'pending' → MP genera el link de pago
        // El usuario completa la suscripción en la página de MP
        status: 'pending',
      }),
    });

    // mpResponse.init_point = URL de pago de Mercado Pago
    return NextResponse.json({
      checkout_url: mpResponse.init_point,
      subscription_id: mpResponse.id,
    });

  } catch (error: any) {
    console.error('Error creando suscripción:', error);
    return NextResponse.json(
      { error: 'Error creando suscripción. Intenta nuevamente.' },
      { status: 500 }
    );
  }
}
