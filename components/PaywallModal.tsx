'use client';
// components/PaywallModal.tsx
// Modal de upgrade con integración Mercado Pago

import { useState } from 'react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingGenerations: number;
}

export default function PaywallModal({ isOpen, onClose, remainingGenerations }: PaywallModalProps) {
  const [loading, setLoading] = useState<'basic' | 'pro' | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubscribe(plan: 'basic' | 'pro') {
    setLoading(plan);
    setError('');

    try {
      const res = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          // No está logueado → redirigir a login
          window.location.href = '/auth/login?redirect=/dashboard';
          return;
        }
        throw new Error(data.error || 'Error al iniciar el pago');
      }

      // Redirigir al checkout de Mercado Pago
      // (sale de la app, va a mercadopago.com.uy)
      window.location.href = data.checkout_url;

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error. Intenta nuevamente.');
      setLoading(null);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#111118] border border-[#2a2a38] rounded-3xl p-8 max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="font-syne text-2xl font-bold bg-gradient-to-r from-[#7c5cfc] to-[#e040fb] bg-clip-text text-transparent">
            Potencia tu contenido
          </h2>
          <p className="text-[#8888aa] text-sm mt-2 leading-relaxed">
            {remainingGenerations === 0
              ? 'Alcanzaste el límite gratuito. Suscríbete para seguir generando.'
              : `Te quedan ${remainingGenerations} generaciones gratis. Suscríbete para tener más.`
            }
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-2 gap-3 mb-6">

          {/* Plan Básico */}
          <div className="bg-[#18181f] border border-[#2a2a38] rounded-2xl p-4">
            <div className="font-syne font-bold text-sm mb-1">Básico</div>
            <div className="text-2xl font-bold text-[#7c5cfc]">
              $360 <span className="text-sm text-[#8888aa] font-normal">UYU/mes</span>
            </div>
            <div className="text-xs text-[#8888aa] mt-2 space-y-1">
              <div>✓ 100 generaciones/mes</div>
              <div>✓ Copy + Imágenes</div>
              <div>✓ Calendario editorial</div>
            </div>
            <button
              onClick={() => handleSubscribe('basic')}
              disabled={loading !== null}
              className="mt-3 w-full py-2 rounded-xl border border-[#7c5cfc] text-[#7c5cfc] text-sm font-semibold
                         hover:bg-[#7c5cfc]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'basic' ? '⏳ Redirigiendo...' : 'Elegir Básico'}
            </button>
          </div>

          {/* Plan Pro */}
          <div className="bg-gradient-to-br from-[#7c5cfc]/10 to-[#e040fb]/10 border border-[#7c5cfc] rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-2 right-2 bg-[#7c5cfc] text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
              ⭐ POPULAR
            </div>
            <div className="font-syne font-bold text-sm mb-1 text-[#7c5cfc]">Pro</div>
            <div className="text-2xl font-bold text-[#e040fb]">
              $1150 <span className="text-sm text-[#8888aa] font-normal">UYU/mes</span>
            </div>
            <div className="text-xs text-[#8888aa] mt-2 space-y-1">
              <div>✓ Generaciones ilimitadas</div>
              <div>✓ Copy + Imágenes + Videos</div>
              <div>✓ Analytics avanzado</div>
            </div>
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={loading !== null}
              className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-[#7c5cfc] to-[#e040fb] text-white text-sm font-bold
                         hover:opacity-85 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'pro' ? '⏳ Redirigiendo...' : 'Elegir Pro'}
            </button>
          </div>
        </div>

        {/* Mercado Pago badge */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-2 bg-[#18181f] border border-[#2a2a38] rounded-xl px-4 py-2">
            <span className="text-lg">🔵</span>
            <span className="text-xs text-[#8888aa]">Pagás con</span>
            <span className="text-sm font-bold text-[#009ee3]">Mercado Pago</span>
            <span className="text-xs text-[#8888aa]">· Seguro · Uruguay</span>
          </div>
        </div>

        <div className="text-center text-xs text-[#8888aa] mb-4">
          💳 Tarjetas de débito y crédito · OCA · Visa · Mastercard<br/>
          Pagos locales · Cancela cuando quieras
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full py-2.5 border border-[#2a2a38] text-[#8888aa] rounded-xl text-sm
                     hover:border-[#8888aa] hover:text-white transition-all"
        >
          {remainingGenerations > 0
            ? `Continuar gratis (${remainingGenerations} restantes)`
            : 'Cerrar'
          }
        </button>
      </div>
    </div>
  );
}
