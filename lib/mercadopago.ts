// lib/mercadopago.ts
// Helper centralizado para Mercado Pago

const MP_BASE_URL = 'https://api.mercadopago.com';

/**
 * Fetch autenticado a la API de Mercado Pago
 */
export async function mpFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${MP_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID(), // Evita cobros duplicados
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Mercado Pago API error:', data);
    throw new Error(data.message || 'Error en Mercado Pago API');
  }

  return data;
}

/**
 * Crear una suscripción para un usuario
 * https://www.mercadopago.com.uy/developers/es/reference/subscriptions/_preapproval/post
 */
export async function createSubscription(params: {
  planId: string;
  payerEmail: string;
  cardTokenId: string;
  externalReference: string; // userId de Supabase
}) {
  return mpFetch('/preapproval', {
    method: 'POST',
    body: JSON.stringify({
      preapproval_plan_id: params.planId,
      payer_email: params.payerEmail,
      card_token_id: params.cardTokenId,
      external_reference: params.externalReference,
      status: 'authorized',
      back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    }),
  });
}

/**
 * Obtener estado de una suscripción
 */
export async function getSubscription(subscriptionId: string) {
  return mpFetch(`/preapproval/${subscriptionId}`);
}

/**
 * Cancelar una suscripción
 */
export async function cancelSubscription(subscriptionId: string) {
  return mpFetch(`/preapproval/${subscriptionId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'cancelled' }),
  });
}

/**
 * Obtener info de un plan
 */
export async function getPlan(planId: string) {
  return mpFetch(`/preapproval_plan/${planId}`);
}

/**
 * Mapear plan_id de MP al plan interno de la app
 */
export function getPlanNameFromId(planId: string): 'basic' | 'pro' | 'free' {
  if (planId === process.env.MP_PLAN_PRO_ID) return 'pro';
  if (planId === process.env.MP_PLAN_BASIC_ID) return 'basic';
  return 'free';
}
