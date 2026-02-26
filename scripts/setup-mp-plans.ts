// scripts/setup-mp-plans.ts
// =============================================
// Ejecuta este script UNA SOLA VEZ para crear
// los planes de suscripción en Mercado Pago
//
// Uso: npx ts-node scripts/setup-mp-plans.ts
// =============================================

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

async function createPlan(name: string, amountUYU: number, description: string) {
  const response = await fetch('https://api.mercadopago.com/preapproval_plan', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: name,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',   // cobro mensual
        transaction_amount: amountUYU,
        currency_id: 'UYU',          // Pesos uruguayos
        // Si prefieres cobrar en USD:
        // currency_id: 'USD',
        // transaction_amount: amountUSD,
      },
      back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      // Periodo de prueba gratuito (opcional)
      // free_trial: {
      //   frequency: 7,
      //   frequency_type: 'days',
      // },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`❌ Error creando plan "${name}":`, data);
    return null;
  }

  console.log(`✅ Plan creado: "${name}"`);
  console.log(`   ID: ${data.id}`);
  console.log(`   Monto: ${amountUYU} UYU/mes`);
  console.log(`   → Agrega esto a tu .env.local:`);
  console.log(`   MP_PLAN_${name.toUpperCase().replace(/ /g, '_')}_ID=${data.id}\n`);

  return data.id;
}

async function main() {
  console.log('🚀 Creando planes de suscripción en Mercado Pago Uruguay...\n');

  // Precios sugeridos en pesos uruguayos (UYU)
  // Básico: ~$9 USD ≈ 360 UYU
  // Pro:    ~$29 USD ≈ 1150 UYU
  // Ajusta según el tipo de cambio del día

  await createPlan('SocialAI Básico', 360, '100 generaciones por mes');
  await createPlan('SocialAI Pro', 1150, 'Generaciones ilimitadas + Videos');

  console.log('✅ ¡Listo! Copia los IDs de arriba a tu .env.local');
}

main().catch(console.error);
