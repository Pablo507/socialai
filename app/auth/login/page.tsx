'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit() {
    setLoading(true);
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('Completá email y contraseña');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/dashboard` }
      });
      if (error) setError(error.message);
      else { setMessage('¡Cuenta creada exitosamente!'); router.push('/dashboard'); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError('Email o contraseña incorrectos');
      else router.push('/dashboard');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />

      <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:24, padding:40, width:'100%', maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:800, background:'linear-gradient(135deg,#7c5cfc,#e040fb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:8 }}>
            SocialAI
          </div>
          <p style={{ color:'#8888aa', fontSize:14 }}>
            {isSignUp ? 'Crea tu cuenta gratis' : 'Bienvenido de vuelta'}
          </p>
        </div>

        {/* Form */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="tu@email.com"
            style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'12px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }}
          />
        </div>

        <div style={{ marginBottom:24 }}>
          <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Mínimo 6 caracteres"
            style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'12px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }}
          />
        </div>

        {/* Error / Success */}
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

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width:'100%', background:'linear-gradient(135deg,#7c5cfc,#e040fb)', border:'none', color:'white', padding:'14px', borderRadius:12, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, cursor:'pointer', opacity: loading ? 0.7 : 1, marginBottom:16 }}
        >
          {loading ? '⏳ Procesando...' : isSignUp ? '🚀 Crear cuenta' : '→ Iniciar sesión'}
        </button>

        {/* Toggle */}
        <p style={{ textAlign:'center', fontSize:14, color:'#8888aa' }}>
          {isSignUp ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
            style={{ background:'none', border:'none', color:'#7c5cfc', cursor:'pointer', fontSize:14, fontWeight:600 }}
          >
            {isSignUp ? 'Iniciá sesión' : 'Registrate gratis'}
          </button>
        </p>

        {/* Back */}
        <p style={{ textAlign:'center', marginTop:16 }}>
          <a href="/dashboard" style={{ fontSize:13, color:'#8888aa', textDecoration:'none' }}>← Volver sin cuenta</a>
        </p>
      </div>
    </div>
  );
}
