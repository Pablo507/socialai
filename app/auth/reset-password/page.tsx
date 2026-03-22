'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Supabase maneja la sesión automáticamente desde el link del email
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Sesión lista, el usuario puede cambiar su contraseña
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleReset() {
    setError('');
    setMessage('');

    if (!password || !confirm) {
      setError('Completá ambos campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setMessage('¡Contraseña actualizada correctamente!');
      setTimeout(() => router.push('/dashboard'), 2000);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:24, padding:40, width:'100%', maxWidth:420 }}>

        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:800, background:'linear-gradient(135deg,#7c5cfc,#e040fb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:8 }}>
            SocialAI
          </div>
          <p style={{ color:'#8888aa', fontSize:14 }}>Nueva contraseña</p>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Nueva contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'12px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }}
          />
        </div>

        <div style={{ marginBottom:24 }}>
          <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Confirmar contraseña</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReset()}
            placeholder="Repetí la contraseña"
            style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'12px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }}
          />
        </div>

        {error && (
          <div style={{ background:'rgba(255,59,48,.1)', border:'1px solid rgba(255,59,48,.3)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#ff6b6b', marginBottom:16 }}>
            ❌ {error}
          </div>
        )}
        {message && (
          <div style={{ background:'rgba(0,230,118,.1)', border:'1px solid rgba(0,230,118,.3)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#00e676', marginBottom:16 }}>
            ✅ {message}
          </div>
        )}

        <button
          onClick={handleReset}
          disabled={loading}
          style={{ width:'100%', background:'linear-gradient(135deg,#7c5cfc,#e040fb)', border:'none', color:'white', padding:'14px', borderRadius:12, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, cursor:'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '⏳ Actualizando...' : '🔒 Guardar nueva contraseña'}
        </button>
      </div>
    </div>
  );
}
