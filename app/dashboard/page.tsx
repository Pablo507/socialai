'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  const [usageCount, setUsageCount] = useState(0);
  const maxUsage = 10;
  const [activePanel, setActivePanel] = useState('copy');
  const [copyResult, setCopyResult] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [sharePlatform, setSharePlatform] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewContent, setPreviewContent] = useState('Tu contenido aparecerá aquí...');
  const [user, setUser] = useState<any>(null);
  const [imagePrompt, setImagePrompt] = useState('');
  const [copyPrompt, setCopyPrompt] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Facebook']);
  const [industry, setIndustry] = useState('Restaurante / Gastronomía');
  const [goal, setGoal] = useState('Vender un producto');
  const [tone, setTone] = useState('Amigable');
  const [history, setHistory] = useState<any[]>([]);
  const [shareToast, setShareToast] = useState('');
  const [copied, setCopied] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{success?: boolean; error?: string; platform?: string} | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoStatus, setVideoStatus] = useState<'idle'|'processing'|'completed'|'failed'>('idle');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoQueuePosition, setVideoQueuePosition] = useState<number|null>(null);
  const pollingRef = useRef<NodeJS.Timeout|null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      // 1. Obtener usuario
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        loadHistory(currentUser.id);

        // ✅ NUEVO: Verificar si ya tiene Facebook conectado en Supabase
        // Esto hace que al recargar la página, el estado de conexión persista
        // Sin esto, facebookConnected vuelve a false en cada recarga
        const { data: conn } = await supabase
          .from('social_connections')
          .select('id')
          .eq('user_id', currentUser.id)
          .single();

        if (conn) setFacebookConnected(true);
      }

      // 2. Detectar si volvió de conectar Facebook exitosamente
      const params = new URLSearchParams(window.location.search);
      if (params.get('facebook_connected') === 'true') {
        setFacebookConnected(true);
        showToast('✅ Facebook conectado correctamente');
        window.history.replaceState({}, '', '/dashboard');
      }

      if (params.get('error') === 'facebook_auth_failed') {
        showToast('❌ Error conectando Facebook. Intentá de nuevo.');
        window.history.replaceState({}, '', '/dashboard');
      }
    }

    init();

    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  async function loadHistory(userId: string) {
    try {
      const res = await fetch(`/api/get-history?userId=${userId}`);
      const data = await res.json();
      setHistory(data.posts || []);
      setUsageCount(data.posts?.length || 0);
    } catch {}
  }

  function checkUsage() {
    if (usageCount >= maxUsage) { setShowModal(true); return true; }
    return false;
  }

  function togglePlatform(name: string) {
    setSelectedPlatforms(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  }

  function showToast(msg: string) {
    setShareToast(msg);
    setTimeout(() => setShareToast(''), 3500);
  }

  function connectFacebook() {
    window.location.href = '/api/auth/facebook';
  }

  function openShareModal(platform: string) {
    setSharePlatform(platform);
    setShowShareModal(true);
    setCopied(false);
  }

  // Sube imagen base64 a Supabase Storage → devuelve URL pública para WhatsApp
  async function uploadImageForSharing(): Promise<string | null> {
    if (!previewImage || !previewImage.startsWith('data:')) return null;
    try {
      setUploadingImage(true);
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: previewImage, userId: user?.id }),
      });
      const data = await res.json();
      return data.publicUrl ?? null;
    } catch {
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function copyAndOpen() {
    const text = copyResult || previewContent;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(async () => {
      if (sharePlatform === 'Facebook') {
        window.open('https://www.facebook.com/', '_blank');
      } else if (sharePlatform === 'Instagram') {
        window.open('https://www.instagram.com/', '_blank');
      } else if (sharePlatform === 'WhatsApp') {
        let waText = text;
        if (previewImage) {
          showToast('⏳ Preparando imagen...');
          const publicUrl = await uploadImageForSharing();
          if (publicUrl) waText = publicUrl + '

' + text;
        }
        window.open('https://wa.me/?text=' + encodeURIComponent(waText), '_blank');
      }
      setShowShareModal(false);
      showToast('✅ ¡Listo para publicar!');
    }, 800);
  }

  async function publishDirect(platform: 'facebook' | 'instagram') {
    if (!user) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          text: copyResult || previewContent,
          imageUrl: previewImage || null,
          facebookUserId: user.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishResult({ success: true, platform });
        showToast(`✅ Publicado en ${platform === 'facebook' ? 'Facebook' : 'Instagram'}`);
      } else {
        setPublishResult({ error: data.error });
        showToast('❌ Error al publicar: ' + data.error);
      }
    } catch {
      showToast('❌ Error de conexión');
    }
    setPublishing(false);
    setShowPublishModal(false);
  }

  async function shareNative() {
    const text = copyResult || previewContent;
    if (navigator.share) {
      try { await navigator.share({ text }); showToast('✅ Compartido'); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      showToast('📋 Copiado al portapapeles');
    }
  }

  async function downloadImage() {
    if (!previewImage) { showToast('⚠️ Seleccioná una imagen primero'); return; }
    const link = document.createElement('a');
    link.href = previewImage;
    link.download = `socialai-${Date.now()}.jpg`;
    link.click();
    showToast('⬇️ Descargando imagen...');
  }

  async function generateCopy() {
    if (checkUsage()) return;
    if (!copyPrompt.trim()) { alert('Describí tu producto o idea'); return; }
    setCopyLoading(true);
    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: copyPrompt, industry, goal, tone, platforms: selectedPlatforms }),
      });
      const data = await res.json();
      if (data.copy) {
        setCopyResult(data.copy);
        setPreviewContent(data.copy.substring(0, 150) + '...');
        setUsageCount(c => c + 1);
        if (user) loadHistory(user.id);
      } else { alert('Error: ' + data.error); }
    } catch { alert('Error de conexión'); }
    setCopyLoading(false);
  }

  async function generateImages() {
    if (checkUsage()) return;
    const prompt = imagePrompt.trim() || 'producto profesional fondo blanco';
    setImageLoading(true);
    setImages([]);
    setPreviewImage('');
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userId: user?.id }),
      });
      const data = await res.json();
      if (data.images) { setImages(data.images); setUsageCount(c => c + 1); }
      else { alert('Error: ' + data.error); }
    } catch { alert('Error de conexión'); }
    setImageLoading(false);
  }

  async function generateVideo() {
    if (checkUsage()) return;
    if (!videoPrompt.trim()) { alert('Describí tu idea'); return; }
    setVideoStatus('processing'); setVideoUrl(''); setVideoQueuePosition(null);
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: videoPrompt }),
      });
      const data = await res.json();
      if (data.requestId) { setUsageCount(c => c + 1); startPolling(data.requestId); }
      else { setVideoStatus('failed'); }
    } catch { setVideoStatus('failed'); }
  }

  function startPolling(requestId: string) {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-status?requestId=${requestId}`);
        const data = await res.json();
        if (data.status === 'completed' && data.videoUrl) {
          setVideoUrl(data.videoUrl); setVideoStatus('completed');
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (data.status === 'failed') {
          setVideoStatus('failed');
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else { setVideoQueuePosition(data.queuePosition ?? null); }
      } catch {}
    }, 5000);
  }

  function loadPost(post: any) {
    if (post.copy_text) { setCopyResult(post.copy_text); setPreviewContent(post.copy_text.substring(0, 150) + '...'); setActivePanel('copy'); }
    if (post.image_url) setPreviewImage(post.image_url);
  }

  const remaining = maxUsage - usageCount;
  const hasContent = !!(copyResult || previewImage);
  const currentText = copyResult || previewContent;

  const C = {
    bg: '#1C1814', surface: '#242018', surfaceHover: '#2C2820',
    border: '#3A3228', borderLight: '#4A4238',
    text: '#F5EDD8', textMuted: '#9A8E7A', textDim: '#5A5248',
    accent: '#E8935A', accentGlow: '#E8935A33',
    gold: '#D4A853', goldSoft: '#D4A85322',
    rose: '#C96B6B', roseSoft: '#C96B6B22',
    green: '#7AB87A', greenSoft: '#7AB87A22',
    grad: 'linear-gradient(135deg, #E8935A, #D4A853)',
  };

  const inputStyle = { width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, padding:'10px 14px', fontSize:14, fontFamily:'inherit', outline:'none' } as React.CSSProperties;
  const labelStyle = { display:'block', fontSize:12, color:C.textMuted, marginBottom:6, fontWeight:600, letterSpacing:.5, textTransform:'uppercase' } as React.CSSProperties;

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:C.bg, color:C.text, minHeight:'100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}
        select option{background:#1C1814;color:#F5EDD8}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#3A3228;border-radius:3px}
        textarea:focus,select:focus{border-color:#E8935A!important;box-shadow:0 0 0 3px #E8935A18!important}
        @keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn .3s ease forwards}
        .slide-up{animation:slideUp .3s ease forwards}
        .btn:hover{opacity:.85;transform:translateY(-1px);transition:all .15s}
        .card:hover{border-color:#4A4238!important;transition:border-color .2s}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* TOAST */}
      {shareToast && (
        <div className="slide-up" style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:'11px 22px', fontSize:14, color:C.text, zIndex:999, boxShadow:'0 8px 32px rgba(0,0,0,.5)', whiteSpace:'nowrap' }}>
          {shareToast}
        </div>
      )}

      {/* SHARE MODAL (manual) */}
      {showShareModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(8px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e => e.target===e.currentTarget && setShowShareModal(false)}>
          <div className="slide-up" style={{ background:C.surface, border:`1px solid ${C.borderLight}`, borderRadius:20, padding:28, maxWidth:460, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,.6)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700 }}>
                {sharePlatform === 'Facebook' ? '📘' : sharePlatform === 'Instagram' ? '📸' : '💬'} Publicar en {sharePlatform}
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ background:'transparent', border:'none', color:C.textMuted, cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:14, marginBottom:18, maxHeight:180, overflowY:'auto' }}>
              <pre style={{ fontSize:13, lineHeight:1.7, color:C.text, whiteSpace:'pre-wrap', fontFamily:'inherit', margin:0 }}>{currentText}</pre>
            </div>
            <div style={{ marginBottom:18 }}>
              {[
                { n:'1', text: copied ? '✅ Texto copiado' : 'Copiá el texto', done: copied },
                { n:'2', text: `Abrí ${sharePlatform} y creá una publicación`, done: false },
                { n:'3', text: 'Pegá con Ctrl+V (o mantené presionado en móvil)', done: false },
              ].map(s => (
                <div key={s.n} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:s.done?C.green:C.accentGlow, border:`1px solid ${s.done?C.green:C.accent}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:s.done?'#fff':C.accent, flexShrink:0, marginTop:1 }}>
                    {s.done ? '✓' : s.n}
                  </div>
                  <span style={{ fontSize:13, color:s.done?C.green:C.textMuted, lineHeight:1.5 }}>{s.text}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <button onClick={copyAndOpen} className="btn"
                style={{ background:copied?C.green:C.grad, border:'none', color:'#fff', padding:'11px 14px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {copied ? '✅ Abriendo...' : '📋 Copiar y abrir'}
              </button>
              <button onClick={() => setShowShareModal(false)} className="btn"
                style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.textMuted, padding:'11px 14px', borderRadius:10, fontSize:13, cursor:'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PUBLISH DIRECT MODAL */}
      {showPublishModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(8px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e => e.target===e.currentTarget && setShowPublishModal(false)}>
          <div className="slide-up" style={{ background:C.surface, border:`1px solid ${C.borderLight}`, borderRadius:20, padding:28, maxWidth:440, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,.6)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700 }}>🚀 Publicar directamente</div>
              <button onClick={() => setShowPublishModal(false)} style={{ background:'transparent', border:'none', color:C.textMuted, cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            {/* Preview del contenido */}
            <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:14, marginBottom:18 }}>
              {previewImage && <img src={previewImage} style={{ width:'100%', height:120, objectFit:'cover', borderRadius:7, marginBottom:10 }} alt="" />}
              <pre style={{ fontSize:12, lineHeight:1.6, color:C.textMuted, whiteSpace:'pre-wrap', fontFamily:'inherit', margin:0, maxHeight:80, overflow:'hidden' }}>
                {currentText.substring(0, 120)}...
              </pre>
            </div>
            {/* Botones de publicación directa */}
            <div style={{ display:'grid', gap:10, marginBottom:12 }}>
              <button onClick={() => publishDirect('facebook')} disabled={publishing} className="btn"
                style={{ background:'#1877f2', border:'none', color:'#fff', padding:'13px 16px', borderRadius:10, fontSize:14, fontWeight:600, cursor:publishing?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:publishing?.7:1 }}>
                {publishing ? <span style={{ width:16, height:16, border:'2px solid #ffffff44', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 1s linear infinite' }} /> : '📘'}
                {publishing ? 'Publicando...' : 'Publicar en Facebook'}
              </button>
              <button onClick={() => publishDirect('instagram')} disabled={publishing || !previewImage} className="btn"
                style={{ background:'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', border:'none', color:'#fff', padding:'13px 16px', borderRadius:10, fontSize:14, fontWeight:600, cursor:(publishing||!previewImage)?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:(publishing||!previewImage)?.6:1 }}>
                {publishing ? <span style={{ width:16, height:16, border:'2px solid #ffffff44', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 1s linear infinite' }} /> : '📸'}
                {publishing ? 'Publicando...' : 'Publicar en Instagram'}
              </button>
            </div>
            {!previewImage && (
              <div style={{ fontSize:11, color:C.textMuted, textAlign:'center', padding:'8px', background:C.accentGlow, borderRadius:8, marginBottom:12 }}>
                ⚠️ Instagram requiere una imagen. Generá una en la sección Imágenes.
              </div>
            )}
            <div style={{ fontSize:11, color:C.textDim, textAlign:'center' }}>
              Publicación directa via Meta API
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 32px', borderBottom:`1px solid ${C.border}`, background:C.surface, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, background:C.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>SocialAI</div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ background:C.accentGlow, border:`1px solid ${C.accent}55`, borderRadius:20, padding:'4px 14px', fontSize:12, color:C.accent, fontWeight:600 }}>
            ✦ {remaining} generaciones restantes
          </div>
          {user
            ? <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13, color:C.textMuted }}>👤 {user.email}</span>
                <button onClick={async () => { const s=createClient(); await s.auth.signOut(); window.location.href='/auth/login'; }}
                  style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.textMuted, padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13 }}>Salir</button>
              </div>
            : <button onClick={() => window.location.href='/auth/login'}
                style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.textMuted, padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:13 }}>Iniciar sesión</button>
          }
          <button onClick={() => setShowModal(true)} className="btn"
            style={{ background:C.grad, border:'none', color:'#fff', padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}>Upgrade Pro</button>
        </div>
      </nav>

      {/* USAGE BAR */}
      <div style={{ padding:'8px 32px', background:C.bg, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:14 }}>
        <span style={{ fontSize:11, color:C.textDim }}>Plan gratuito</span>
        <div style={{ flex:1, height:4, background:C.surface, borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${(usageCount/maxUsage)*100}%`, background:C.grad, borderRadius:2, transition:'width .5s' }} />
        </div>
        <span style={{ fontSize:11, color:C.textDim }}><strong style={{ color:C.accent }}>{usageCount}</strong> / {maxUsage}</span>
      </div>

      {/* LAYOUT */}
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 272px', minHeight:'calc(100vh - 97px)' }}>

        {/* SIDEBAR */}
        <aside style={{ borderRight:`1px solid ${C.border}`, padding:'20px 10px' }}>
          {[['✍️','Copywriting','copy'],['🖼️','Imágenes','images'],['🎬','Videos','videos'],['📅','Calendario','calendar']].map(([icon,label,id]) => (
            <button key={id} onClick={() => setActivePanel(id)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, cursor:'pointer', color:activePanel===id?C.accent:C.textMuted, fontSize:13, border:activePanel===id?`1px solid ${C.accent}44`:'1px solid transparent', background:activePanel===id?C.accentGlow:'transparent', width:'100%', textAlign:'left', fontFamily:'inherit', marginBottom:2 }}>
              <span style={{ fontSize:15 }}>{icon}</span> {label}
            </button>
          ))}
          <div style={{ borderTop:`1px solid ${C.border}`, marginTop:16, paddingTop:16 }}>
            <button onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, cursor:'pointer', color:C.gold, fontSize:13, border:'1px solid transparent', background:'transparent', width:'100%', textAlign:'left', fontFamily:'inherit' }}>
              <span>⚡</span> Upgrade Pro
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ padding:28, overflowY:'auto', background:C.bg }}>

          {activePanel === 'copy' && (
            <div className="fade-in">
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, marginBottom:4 }}>✍️ Copywriting con IA</h1>
              <p style={{ color:C.textMuted, fontSize:13, marginBottom:24 }}>Textos persuasivos listos para publicar</p>

              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:22, marginBottom:18 }}>
                <div style={{ marginBottom:14 }}>
                  <label style={labelStyle}>Red social</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {[['📘','Facebook','#6B9FD4'],['📸','Instagram','#D4836B'],['🎵','TikTok','#7AB8C8']].map(([icon,name,color]) => {
                      const active = selectedPlatforms.includes(name);
                      return <button key={name} onClick={() => togglePlatform(name)}
                        style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${active?color:C.border}`, background:active?`${color}22`:'transparent', color:active?color:C.textMuted, fontSize:13, cursor:'pointer' }}>{icon} {name}</button>;
                    })}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                  <div>
                    <label style={labelStyle}>Industria</label>
                    <select value={industry} onChange={e => setIndustry(e.target.value)} style={inputStyle}>
                      {['Restaurante / Gastronomía','Moda y Ropa','Fitness y Salud','Tecnología','E-commerce','Inmobiliaria','Turismo','Educación'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Objetivo</label>
                    <select value={goal} onChange={e => setGoal(e.target.value)} style={inputStyle}>
                      {['Vender un producto','Generar engagement','Dar a conocer la marca','Promoción especial','Conseguir seguidores','Anunciar evento'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom:14 }}>
                  <label style={labelStyle}>Tono</label>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {[['😊','Amigable'],['💼','Profesional'],['😂','Divertido'],['🔥','Urgente'],['✨','Inspirador']].map(([emoji,name]) => (
                      <button key={name} onClick={() => setTone(name)}
                        style={{ padding:'5px 12px', borderRadius:8, border:tone===name?`1px solid ${C.accent}`:`1px solid ${C.border}`, background:tone===name?C.accentGlow:'transparent', color:tone===name?C.accent:C.textMuted, fontSize:12, cursor:'pointer' }}>
                        {emoji} {name}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom:16 }}>
                  <label style={labelStyle}>Tu producto o idea</label>
                  <textarea value={copyPrompt} onChange={e => setCopyPrompt(e.target.value)} style={{ ...inputStyle, resize:'vertical' } as React.CSSProperties}
                    rows={3} placeholder="Ej: Auriculares inalámbricos negros, sonido HD, $2500..." />
                </div>

                <button onClick={generateCopy} disabled={copyLoading} className="btn"
                  style={{ width:'100%', background:copyLoading?C.border:C.grad, border:'none', color:'#fff', padding:13, borderRadius:11, fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, cursor:'pointer' }}>
                  {copyLoading ? '⏳ Generando...' : '⚡ Generar Copy con IA'}
                </button>
              </div>

              {copyResult && (
                <div className="fade-in" style={{ background:C.surface, border:`1px solid ${C.borderLight}`, borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:C.surfaceHover }}>
                    <span style={{ fontSize:13, fontWeight:600, color:C.gold }}>✦ Copy generado</span>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => { navigator.clipboard.writeText(copyResult); showToast('📋 Copiado'); }}
                        style={{ padding:'5px 11px', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:C.textMuted, fontSize:11, cursor:'pointer' }}>📋 Copiar</button>
                      <button onClick={generateCopy}
                        style={{ padding:'5px 11px', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:C.textMuted, fontSize:11, cursor:'pointer' }}>🔄 Regenerar</button>
                    </div>
                  </div>
                  <div style={{ padding:18 }}>
                    <pre style={{ fontSize:14, lineHeight:1.75, color:C.text, whiteSpace:'pre-wrap', fontFamily:'inherit', margin:0 }}>{copyResult}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {activePanel === 'images' && (
            <div className="fade-in">
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, marginBottom:4 }}>🖼️ Generador de Imágenes</h1>
              <p style={{ color:C.textMuted, fontSize:13, marginBottom:24 }}>4 variaciones únicas generadas con IA</p>

              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:22, marginBottom:18 }}>
                <label style={labelStyle}>Descripción</label>
                <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} style={{ ...inputStyle, marginBottom:14, resize:'vertical' } as React.CSSProperties}
                  rows={3} placeholder="Ej: taza de café humeante sobre mesa de madera..." />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  <div><label style={labelStyle}>Formato</label>
                    <select style={inputStyle}><option>📱 Cuadrado (1:1)</option><option>📱 Vertical (9:16)</option><option>🖥️ Horizontal (16:9)</option></select>
                  </div>
                  <div><label style={labelStyle}>Estilo</label>
                    <select style={inputStyle}><option>Fotografía realista</option><option>Ilustración digital</option><option>Minimalista</option><option>3D Render</option></select>
                  </div>
                </div>
                <button onClick={generateImages} disabled={imageLoading} className="btn"
                  style={{ width:'100%', background:imageLoading?C.border:C.grad, border:'none', color:'#fff', padding:13, borderRadius:11, fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, cursor:'pointer' }}>
                  {imageLoading ? '⏳ Generando (~10s)...' : '🎨 Generar 4 Imágenes'}
                </button>
              </div>

              {images.length > 0 && (
                <div className="fade-in" style={{ background:C.surface, border:`1px solid ${C.borderLight}`, borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:C.surfaceHover }}>
                    <span style={{ fontSize:13, fontWeight:600, color:C.gold }}>✦ Imágenes generadas</span>
                    <span style={{ fontSize:11, color:C.textMuted }}>Click para seleccionar →</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:16 }}>
                    {images.map((src, i) => (
                      <div key={i} onClick={() => setPreviewImage(src)} className="card"
                        style={{ background:C.bg, border:previewImage===src?`2px solid ${C.accent}`:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', cursor:'pointer', boxShadow:previewImage===src?`0 0 16px ${C.accentGlow}`:'none' }}>
                        <img src={src} alt="" style={{ width:'100%', height:150, objectFit:'cover' }} />
                        <div style={{ padding:'7px 10px', fontSize:11, color:previewImage===src?C.accent:C.textMuted, fontWeight:previewImage===src?600:400 }}>
                          {previewImage===src?'✓ ':''}Versión {String.fromCharCode(65+i)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activePanel === 'videos' && (
            <div className="fade-in">
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, marginBottom:4 }}>🎬 Generador de Videos</h1>
              <p style={{ color:C.textMuted, fontSize:13, marginBottom:24 }}>Videos cortos para Reels y TikTok</p>

              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:22, marginBottom:18 }}>
                <label style={labelStyle}>Describe tu video</label>
                <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} style={{ ...inputStyle, marginBottom:14, resize:'vertical' } as React.CSSProperties}
                  rows={3} placeholder="Ej: café siendo servido en cámara lenta, vapor y luz cálida..." />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  <div><label style={labelStyle}>Formato</label>
                    <select style={inputStyle}><option>📱 Vertical 9:16</option><option>⬜ Cuadrado 1:1</option><option>🖥️ Horizontal 16:9</option></select>
                  </div>
                  <div><label style={labelStyle}>Duración</label>
                    <select style={inputStyle}><option>5 segundos</option><option>10 segundos</option></select>
                  </div>
                </div>
                <button onClick={generateVideo} disabled={videoStatus==='processing'} className="btn"
                  style={{ width:'100%', background:videoStatus==='processing'?C.border:C.grad, border:'none', color:'#fff', padding:13, borderRadius:11, fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, cursor:videoStatus==='processing'?'not-allowed':'pointer' }}>
                  {videoStatus==='processing' ? '⏳ Generando video...' : '🎬 Generar Video con IA'}
                </button>
              </div>

              {videoStatus==='processing' && (
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:32, textAlign:'center' }}>
                  <div style={{ fontSize:36, marginBottom:12, animation:'shimmer 2s infinite' }}>⏳</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:600, marginBottom:8 }}>Generando con IA...</div>
                  <div style={{ fontSize:13, color:C.textMuted, marginBottom:16 }}>{videoQueuePosition!==null?`Cola: #${videoQueuePosition} · `:''}30–60 segundos</div>
                  <div style={{ height:3, background:C.border, borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:'55%', background:C.grad, borderRadius:2, animation:'shimmer 2s infinite' }} />
                  </div>
                </div>
              )}

              {videoStatus==='completed' && videoUrl && (
                <div style={{ background:C.surface, border:`1px solid ${C.borderLight}`, borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:C.surfaceHover }}>
                    <span style={{ fontSize:13, fontWeight:600, color:C.gold }}>✦ Video listo</span>
                    <a href={videoUrl} download target="_blank" rel="noreferrer" style={{ padding:'5px 11px', borderRadius:6, border:`1px solid ${C.border}`, background:'transparent', color:C.textMuted, fontSize:11, textDecoration:'none' }}>⬇️ Descargar</a>
                  </div>
                  <div style={{ padding:16 }}>
                    <video controls style={{ width:'100%', borderRadius:8, maxHeight:360 }}><source src={videoUrl} type="video/mp4" /></video>
                  </div>
                </div>
              )}

              {videoStatus==='failed' && (
                <div style={{ background:C.roseSoft, border:`1px solid ${C.rose}44`, borderRadius:16, padding:24, textAlign:'center' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>❌</div>
                  <div style={{ fontSize:13, color:C.rose, marginBottom:12 }}>Error al generar el video.</div>
                  <button onClick={() => setVideoStatus('idle')} style={{ padding:'8px 18px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.textMuted, cursor:'pointer', fontSize:13 }}>Reintentar</button>
                </div>
              )}
            </div>
          )}

          {activePanel === 'calendar' && (
            <div className="fade-in">
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, marginBottom:4 }}>📅 Calendario Editorial</h1>
              <p style={{ color:C.textMuted, fontSize:13, marginBottom:24 }}>Planificá tus publicaciones del mes</p>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:22 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, marginBottom:16 }}>Marzo 2026</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                  {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                    <div key={d} style={{ textAlign:'center', fontSize:10, color:C.textDim, padding:'5px 0', fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>{d}</div>
                  ))}
                  {[1,2,3,4,5,6,7].map(d => (
                    <div key={d} className="card" style={{ background:d===1?C.accentGlow:C.bg, border:d===1?`1px solid ${C.accent}55`:`1px solid ${C.border}`, borderRadius:8, minHeight:68, padding:6, cursor:'pointer' }}>
                      <div style={{ fontSize:11, color:d===1?C.accent:C.textMuted, fontWeight:d===1?700:400 }}>{d}</div>
                    </div>
                  ))}
                  {Array.from({length:24},(_,i)=>i+8).map(d => (
                    <div key={d} className="card" style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, minHeight:68, padding:6, cursor:'pointer' }}>
                      <div style={{ fontSize:11, color:C.textDim }}>{d}</div>
                      {d===10 && <div style={{ background:C.roseSoft, borderRadius:4, padding:'2px 5px', fontSize:9, color:C.rose, marginTop:3 }}>📸 Post</div>}
                      {d===15 && <div style={{ background:'#6B9FD422', borderRadius:4, padding:'2px 5px', fontSize:9, color:'#6B9FD4', marginTop:3 }}>📘 Reel</div>}
                      {d===20 && <div style={{ background:C.goldSoft, borderRadius:4, padding:'2px 5px', fontSize:9, color:C.gold, marginTop:3 }}>🎵 TikTok</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT PANEL */}
        <aside style={{ borderLeft:`1px solid ${C.border}`, padding:'20px 14px', overflowY:'auto', background:C.surface }}>

          {/* CONEXIÓN FACEBOOK */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:700, marginBottom:10, color:C.textDim, textTransform:'uppercase', letterSpacing:1.5 }}>Cuenta conectada</div>
            {facebookConnected ? (
              <div style={{ background:C.greenSoft, border:`1px solid ${C.green}44`, borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18 }}>✅</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:C.green }}>Facebook conectado</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>Listo para publicar directo</div>
                </div>
              </div>
            ) : (
              <button onClick={connectFacebook} className="btn"
                style={{ width:'100%', background:'#1877f2', border:'none', color:'#fff', padding:'11px 14px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ fontSize:16 }}>📘</span> Conectar Facebook
              </button>
            )}
          </div>

          <div style={{ fontSize:10, fontWeight:700, marginBottom:10, color:C.textDim, textTransform:'uppercase', letterSpacing:1.5 }}>Vista previa</div>

          {/* MOCK POST */}
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', marginBottom:14 }}>
            <div style={{ background:C.surfaceHover, padding:'9px 12px', display:'flex', alignItems:'center', gap:8, borderBottom:`1px solid ${C.border}` }}>
              <div style={{ width:26, height:26, background:C.grad, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>👤</div>
              <div style={{ fontSize:12, fontWeight:600 }}>@tuempresa</div>
              <div style={{ marginLeft:'auto', fontSize:9, color:C.textMuted, background:C.surface, padding:'2px 7px', borderRadius:4, border:`1px solid ${C.border}` }}>
                {selectedPlatforms[0]==='Instagram'?'📸 IG':selectedPlatforms[0]==='TikTok'?'🎵 TT':'📘 FB'}
              </div>
            </div>
            <div style={{ height:150, overflow:'hidden', position:'relative', background:`linear-gradient(135deg,${C.accentGlow},${C.goldSoft})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {previewImage ? <img src={previewImage} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" /> : <span style={{ fontSize:32, opacity:.4 }}>🖼️</span>}
              {previewImage && (
                <button onClick={() => setPreviewImage('')}
                  style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,.5)', border:'none', color:'white', borderRadius:'50%', width:20, height:20, fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              )}
            </div>
            <div style={{ padding:11, fontSize:12, lineHeight:1.65, color:hasContent?C.text:C.textDim, minHeight:56 }}>
              {hasContent ? currentText.substring(0,100)+'...' : 'Generá contenido para ver la preview...'}
            </div>
            <div style={{ padding:'8px 12px', borderTop:`1px solid ${C.border}`, display:'flex', gap:14 }}>
              {['❤️','💬','↗️'].map(a => <span key={a} style={{ fontSize:13, cursor:'pointer' }}>{a}</span>)}
            </div>
          </div>

          {/* PUBLISH BUTTONS */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, fontWeight:700, marginBottom:10, color:C.textDim, textTransform:'uppercase', letterSpacing:1.5 }}>Publicar</div>

            {/* PUBLICACIÓN DIRECTA — solo si está conectado */}
            {facebookConnected ? (
              <button onClick={() => hasContent && setShowPublishModal(true)} className="btn"
                style={{ width:'100%', background:hasContent?C.grad:C.border, border:'none', color:hasContent?'#fff':C.textDim, padding:'11px 14px', borderRadius:10, fontSize:13, fontWeight:700, cursor:hasContent?'pointer':'not-allowed', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                🚀 Publicar directamente
              </button>
            ) : (
              <button onClick={shareNative} className="btn"
                style={{ width:'100%', background:hasContent?C.grad:C.border, border:'none', color:hasContent?'#fff':C.textDim, padding:'11px 14px', borderRadius:10, fontSize:13, fontWeight:700, cursor:hasContent?'pointer':'not-allowed', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                📱 Compartir ahora
              </button>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:6 }}>
              <button onClick={() => hasContent && openShareModal('Facebook')} className="btn"
                style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${hasContent?'#6B9FD444':C.border}`, background:hasContent?'#6B9FD411':'transparent', color:hasContent?'#6B9FD4':C.textDim, fontSize:12, cursor:hasContent?'pointer':'not-allowed', fontWeight:600 }}>
                📘 Facebook
              </button>
              <button onClick={() => hasContent && openShareModal('Instagram')} className="btn"
                style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${hasContent?'#D4836B44':C.border}`, background:hasContent?'#D4836B11':'transparent', color:hasContent?'#D4836B':C.textDim, fontSize:12, cursor:hasContent?'pointer':'not-allowed', fontWeight:600 }}>
                📸 Instagram
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              <button onClick={() => hasContent && !uploadingImage && openShareModal('WhatsApp')} className="btn"
                style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${hasContent?C.green+'44':C.border}`, background:hasContent?C.greenSoft:'transparent', color:hasContent?C.green:C.textDim, fontSize:12, cursor:(hasContent&&!uploadingImage)?'pointer':'not-allowed', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                {uploadingImage ? <span style={{ width:10, height:10, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 1s linear infinite' }} /> : '💬'}
                {uploadingImage ? 'Subiendo...' : 'WhatsApp'}
              </button>
              <button onClick={downloadImage} className="btn"
                style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:previewImage?C.textMuted:C.textDim, fontSize:12, cursor:previewImage?'pointer':'not-allowed', fontWeight:600 }}>
                ⬇️ Imagen
              </button>
            </div>
            {!hasContent && <div style={{ fontSize:11, color:C.textDim, textAlign:'center', marginTop:10 }}>Generá contenido para habilitar</div>}
          </div>

          {/* HISTORIAL */}
          <div style={{ fontSize:10, fontWeight:700, marginBottom:10, color:C.textDim, textTransform:'uppercase', letterSpacing:1.5 }}>Historial</div>
          {history.length===0 && <div style={{ fontSize:12, color:C.textDim, textAlign:'center', padding:'14px 0' }}>Sin historial aún</div>}
          {history.slice(0,8).map(post => (
            <div key={post.id} onClick={() => loadPost(post)} className="card"
              style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:11, marginBottom:7, cursor:'pointer' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                <span style={{ fontSize:9, padding:'2px 7px', borderRadius:4, fontWeight:700, background:post.image_url?C.goldSoft:C.accentGlow, color:post.image_url?C.gold:C.accent }}>
                  {post.image_url?'IMAGEN':'COPY'}
                </span>
                <span style={{ fontSize:10, color:C.textDim, marginLeft:'auto' }}>
                  {new Date(post.created_at).toLocaleDateString('es-UY',{day:'2-digit',month:'short'})}
                </span>
              </div>
              {post.image_url && <img src={post.image_url} alt="" style={{ width:'100%', height:44, objectFit:'cover', borderRadius:5, marginBottom:5 }} />}
              <div style={{ fontSize:11, color:C.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {post.copy_text?post.copy_text.substring(0,44)+'...':post.prompt}
              </div>
            </div>
          ))}
        </aside>
      </div>

      {/* UPGRADE MODAL */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(8px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="slide-up" style={{ background:C.surface, border:`1px solid ${C.borderLight}`, borderRadius:24, padding:40, maxWidth:460, width:'100%', textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,.6)' }}>
            <div style={{ fontSize:44, marginBottom:14 }}>🚀</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, marginBottom:10, background:C.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Potenciá tu contenido</h2>
            <p style={{ fontSize:13, color:C.textMuted, lineHeight:1.7, marginBottom:24 }}>
              {remaining===0?'Alcanzaste el límite gratuito.':`Te quedan ${remaining} generaciones gratuitas.`}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
              <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:16 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, marginBottom:4 }}>Básico</div>
                <div style={{ fontSize:22, fontWeight:800, color:C.accent }}>$360 <span style={{ fontSize:12, color:C.textMuted, fontWeight:400 }}>UYU/mes</span></div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:6 }}>✓ 100 generaciones/mes</div>
              </div>
              <div style={{ background:`linear-gradient(135deg,${C.accentGlow},${C.goldSoft})`, border:`1px solid ${C.accent}55`, borderRadius:14, padding:16 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, marginBottom:4, color:C.gold }}>⭐ Pro</div>
                <div style={{ fontSize:22, fontWeight:800, color:C.gold }}>$1150 <span style={{ fontSize:12, color:C.textMuted, fontWeight:400 }}>UYU/mes</span></div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:6 }}>✓ Ilimitado + Videos</div>
              </div>
            </div>
            <button onClick={() => setShowModal(false)} className="btn"
              style={{ background:C.grad, border:'none', color:'#fff', padding:'12px 28px', borderRadius:10, fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, cursor:'pointer', width:'100%', marginBottom:10 }}>
              💙 Suscribirse con Mercado Pago
            </button>
            <button onClick={() => setShowModal(false)}
              style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.textMuted, padding:'9px 22px', borderRadius:8, cursor:'pointer', fontSize:13 }}>
              {remaining>0?`Continuar gratis (${remaining} restantes)`:'Cerrar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
