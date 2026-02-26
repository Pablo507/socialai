# 💙 Integración Mercado Pago — SocialAI Uruguay

> Reemplaza Stripe por Mercado Pago para procesar suscripciones en Uruguay (UYU o USD).

---

## 📁 Archivos incluidos en este paquete

```
app/api/
├── create-subscription/route.ts  ← Inicia el checkout de MP
└── mp-webhook/route.ts           ← Recibe notificaciones de MP

components/
└── PaywallModal.tsx              ← Modal de upgrade con botones de MP

lib/
└── mercadopago.ts                ← Helper con funciones de la API de MP

scripts/
└── setup-mp-plans.ts             ← Crea los planes (ejecutar UNA vez)

supabase-mp-migration.sql         ← Migración de DB (columnas de MP)
.env.example                      ← Variables de entorno
```

---

## 🚀 Configuración paso a paso

### 1. Crear tu app en Mercado Pago

1. Ve a [https://www.mercadopago.com.uy/developers/panel/app](https://www.mercadopago.com.uy/developers/panel/app)
2. Click en **"Crear aplicación"**
3. Nombre: "SocialAI" → Modelo de pago: **"Pagos online"**
4. Activa **"Suscripciones"** en las capacidades
5. Ve a **"Credenciales de producción"** y copia:
   - `Public Key` → `NEXT_PUBLIC_MP_PUBLIC_KEY`
   - `Access Token` → `MP_ACCESS_TOKEN`

> ⚠️ Para probar usa las **credenciales de prueba** (tienen el prefijo `TEST-`).
> Para producción usa las credenciales reales.

### 2. Crear los planes de suscripción (una sola vez)

```bash
# Agrega tus credenciales al .env.local primero
cp .env.example .env.local
# Edita .env.local con tu MP_ACCESS_TOKEN

# Luego ejecuta:
npx ts-node scripts/setup-mp-plans.ts
```

El script imprimirá los IDs de los planes. Agrégalos al `.env.local`:
```
MP_PLAN_BASIC_ID=2c938084xxxxx
MP_PLAN_PRO_ID=2c938084yyyyy
```

### 3. Correr la migración de Supabase

Ejecuta `supabase-mp-migration.sql` en el **SQL Editor de Supabase**.

### 4. Configurar el Webhook en Mercado Pago

1. Ve a tu app en el panel de MP → **"Webhooks"**
2. Agrega la URL: `https://tu-app.vercel.app/api/mp-webhook`
3. Suscríbete al evento: **`subscription_preapproval`**
4. Copia el **"Secret"** del webhook → `MP_WEBHOOK_SECRET`

### 5. Deploy en Vercel

```bash
# Agregar variables de entorno en Vercel:
# Settings → Environment Variables

NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-...
MP_ACCESS_TOKEN=APP_USR-...
MP_PLAN_BASIC_ID=2c938084...
MP_PLAN_PRO_ID=2c938084...
MP_WEBHOOK_SECRET=tu-secret
```

---

## 💰 Flujo de suscripción

```
Usuario hace click en "Suscribirse"
          ↓
POST /api/create-subscription
(crea preapproval en MP con status: pending)
          ↓
Devuelve init_point (URL de checkout MP)
          ↓
Usuario va a mercadopago.com.uy
(ingresa tarjeta, OCA, etc.)
          ↓
MP procesa el pago
          ↓
MP envía webhook → POST /api/mp-webhook
(actualiza plan en Supabase: free → basic/pro)
          ↓
MP redirige a /dashboard?payment=success
```

---

## 🧪 Probar en modo sandbox

MP tiene tarjetas de prueba:
- **Visa aprobada**: 4509 9535 6623 3704
- **Mastercard aprobada**: 5031 7557 3453 0604
- **OCA aprobada**: 4917 4843 6569 7068
- CVV: cualquier 3 dígitos
- Vencimiento: cualquier fecha futura

Cuentas de prueba: [https://www.mercadopago.com.uy/developers/es/docs/your-integrations/test/accounts](https://www.mercadopago.com.uy/developers/es/docs/your-integrations/test/accounts)

---

## 💵 Precios sugeridos

| Plan | UYU/mes | USD aprox |
|------|---------|-----------|
| Básico | $360 | ~$9 |
| Pro | $1.150 | ~$29 |

> Ajusta según el tipo de cambio del día. El tipo de cambio en `scripts/setup-mp-plans.ts`.

---

## 📊 Comisiones de Mercado Pago Uruguay

- Tarjetas de crédito: ~3.99%
- Tarjetas de débito: ~1.99%
- Sin cuotas adicionales para suscripciones

Más info: [https://www.mercadopago.com.uy/ayuda](https://www.mercadopago.com.uy/ayuda)
