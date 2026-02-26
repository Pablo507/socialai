-- =============================================
-- SocialAI — Actualización de schema para Mercado Pago
-- Agrega estas columnas a la tabla profiles existente
-- =============================================

-- Reemplaza las columnas de Stripe por Mercado Pago
ALTER TABLE public.profiles
  -- Eliminar columnas de Stripe (si las tenías)
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,

  -- Agregar columnas de Mercado Pago
  ADD COLUMN IF NOT EXISTS mp_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- =============================================
-- Si estás creando la tabla DESDE CERO, usa esto:
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Plan actual: free / basic / pro
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro')),

  -- Mercado Pago
  mp_subscription_id TEXT,       -- ID de la preapproval en MP
  mp_customer_id TEXT,           -- payer_id de MP
  subscription_status TEXT DEFAULT 'inactive',
  -- Posibles valores de subscription_status:
  -- 'inactive'  → nunca pagó
  -- 'active'    → suscripción activa
  -- 'paused'    → pago falló, reintentando
  -- 'cancelled' → canceló

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar por mp_subscription_id en webhooks
CREATE INDEX IF NOT EXISTS idx_profiles_mp_sub
  ON public.profiles(mp_subscription_id)
  WHERE mp_subscription_id IS NOT NULL;
