'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DashboardPage() {
  // --- ESTADOS ---
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
  const [industry, setIndustry] = useState('General / Otro rubro');
  const [goal, setGoal] = useState('Vender un producto');
  const [tone, setTone] = useState('Amigable');
  const [history, setHistory] = useState<any[]>([]);
  const [shareToast, setShareToast] = useState('');
  const [copied, setCopied] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // --- EFECTOS ---
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    async function init() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        loadHistory(currentUser.id);
        const { data: conn } = await supabase
          .from('social_connections')
          .select('id')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        if (conn) setFacebookConnected(true);
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'connected') {
        setFacebookConnected(true);
        showToast('✅ Facebook conectado correctamente');
        window.history.replaceState({}, '', '/dashboard');
      }
    }
    init();
  }, []);

  // --- FUNCIONES ---
  async function loadHistory(userId: string) {
    try {
      const [histRes, usageRes] = await Promise.all([
        fetch(`/api/get-history?userId=${userId}`),
        fetch(`/api/get-usage?userId=${userId}`),
      ]);
      const histData = await histRes.json();
      const usageData = await usageRes.json();
      setHistory(histData.posts || []);
      setUsageCount(usageData.count ?? 0);
    } catch {}
  }

  function showToast(msg: string) {
    setShareToast(msg);
    setTimeout(() => setShareToast(''), 3500);
  }

  function connectFacebook() {
    if (!user) return showToast('⚠️ Debes iniciar sesión');
    window.location.href = `/api/auth/facebook?state=${user.id}`;
  }

  async function publishDirect(platform: 'facebook' | 'instagram') {
    if (!user) return;
    setPublishing(true);
    try {
      let imageUrl: string | null = previewImage;

      if (previewImage?.startsWith('data:')) {
        showToast('⏳ Procesando imagen...');
        const uploadedUrl = await uploadImageForSharing();
        if (!uploadedUrl) {
          showToast('❌ Error al subir imagen');
          setPublishing(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          text: copyResult || previewContent,
          imageUrl: imageUrl,
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (data.success) showToast(`✅ Publicado en ${platform}`);
      else showToast('❌ Error: ' + data.error);
    } catch {
      showToast('❌ Error de red');
    }
    setPublishing(false);
    setShowPublishModal(false);
  }

  async function uploadImageForSharing(): Promise<string | null> {
    if (!previewImage || !previewImage.startsWith('data:')) return previewImage;
    try {
      setUploadingImage(true);
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: previewImage, userId: user?.id }),
      });
      const data = await res.json();
      return data.publicUrl ?? null;
    } catch { return null; } finally { setUploadingImage(false); }
  }

  // --- ESTILOS (CORREGIDOS) ---
  const C = {
    bg: '#FAF8F5',
    surface: '#FFFFFF',
    border: '#E8E0F0',
    text: '#2D2640',
    textMuted: '#7B6E99',
    textDim: '#B5AACC', // <--- Agregado para corregir el error de build
    accent: '#7C5CBF',
    accentSoft: '#EDE8F8',
    grad: 'linear-gradient(135deg, #7C5CBF, #B07FE8)',
  };

  const inputStyle = { 
    width:'100%', background:C.surface, border:`1.5px solid ${C.border}`, 
    borderRadius:12, padding:'12px', fontSize:14, outline:'none', marginBottom:15 
  } as React.CSSProperties;

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:C.bg, color:C.text, minHeight:'100vh' }}>
      {shareToast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:C.text, borderRadius:12, padding:'12px 22px', color:'#fff', zIndex:999 }}>
          {shareToast}
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 32px', borderBottom:`1px solid ${C.border}`, background:C.surface, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontSize:22, fontWeight:800, background:C.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>SocialAI</div>
        <div style={{ background:C.accentSoft, borderRadius:20, padding:'5px 14px', fontSize:12, color:C.accent, fontWeight:700 }}>
          ✦ {maxUsage - usageCount} créditos libres
        </div>
      </nav>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '220px 1fr 320px', minHeight:'calc(100vh - 70px)' }}>
        
        {/* SIDEBAR IZQUIERDO */}
        <aside style={{ borderRight:`1px solid ${C.border}`, padding:20, background:C.surface }}>
          <button onClick={() => setActivePanel('copy')} style={{ width:'100%', padding:12, textAlign:'left', borderRadius:10, marginBottom:8, border:'none', cursor:'pointer', background:activePanel==='copy'?C.accentSoft:'transparent', color:activePanel==='copy'?C.accent:C.textMuted, fontWeight:700 }}>✍️ Crear Copy</button>
          <button onClick={() => setActivePanel('images')} style={{ width:'100%', padding:12, textAlign:'left', borderRadius:10, marginBottom:8, border:'none', cursor:'pointer', background:activePanel==='images'?C.accentSoft:'transparent', color:activePanel==='images'?C.accent:C.textMuted, fontWeight:700 }}>🖼️ Imágenes AI</button>
          <button onClick={() => setActivePanel('history')} style={{ width:'100%', padding:12, textAlign:'left', borderRadius:10, marginBottom:8, border:'none', cursor:'pointer', background:activePanel==='history'?C.accentSoft:'transparent', color:activePanel==='history'?C.accent:C.textMuted, fontWeight:700 }}>📜 Historial</button>
        </aside>

        {/* CONTENIDO CENTRAL */}
        <main style={{ padding:32, overflowY:'auto' }}>
          <h1 style={{ fontSize:24, fontWeight:800, marginBottom:24 }}>
            {activePanel === 'copy' ? 'Generador de contenido' : 'Creador de Imágenes'}
          </h1>
          
          <div style={{ background:C.surface, padding:24, borderRadius:20, border:`1px solid ${C.border}`, boxShadow:'0 4px 20px rgba(0,0,0,0.03)' }}>
            <label style={{ display:'block', fontSize:11, fontWeight:800, color:C.textMuted, marginBottom:8, textTransform:'uppercase' }}>Descripción de tu post</label>
            <textarea 
              value={copyPrompt} 
              onChange={e => setCopyPrompt(e.target.value)} 
              style={{ ...inputStyle, minHeight:120 }} 
              placeholder="Ej: Promo de 2x1 en hamburguesas solo por hoy..."
            />
            
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:15 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:800, color:C.textMuted, marginBottom:8 }}>TONO</label>
                <select value={tone} onChange={e => setTone(e.target.value)} style={inputStyle}>
                  <option>Amigable</option><option>Profesional</option><option>Persuasivo</option>
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:800, color:C.textMuted, marginBottom:8 }}>OBJETIVO</label>
                <select value={goal} onChange={e => setGoal(e.target.value)} style={inputStyle}>
                  <option>Vender</option><option>Informar</option><option>Interactuar</option>
                </select>
              </div>
            </div>

            <button style={{ width:'100%', padding:14, background:C.grad, color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', marginTop:10 }}>
              Generar Propuestas ✨
            </button>
          </div>
        </main>

        {/* PANEL DERECHO: PREVIEW */}
        <aside style={{ borderLeft:`1px solid ${C.border}`, padding:24, background:C.surface }}>
          <h3 style={{ fontSize:14, fontWeight:800, marginBottom:20, color:C.textMuted }}>VISTA PREVIA</h3>
          
          <div style={{ border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden', background:C.bg, marginBottom:24 }}>
            <div style={{ aspectRatio:'1/1', background:'#ddd', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {previewImage ? <img src={previewImage} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ color:C.textDim }}>Imagen del post</span>}
            </div>
            <div style={{ padding:16, fontSize:14, lineHeight:'1.5', color:C.text }}>
              {copyResult || previewContent}
            </div>
          </div>

          <div style={{ display:'grid', gap:12 }}>
            {facebookConnected ? (
              <button onClick={() => setShowPublishModal(true)} style={{ width:'100%', padding:14, background:C.grad, color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer' }}>
                🚀 Publicar en Redes
              </button>
            ) : (
              <button onClick={connectFacebook} style={{ width:'100%', padding:14, background:'#1877f2', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ fontSize:18 }}>📘</span> Conectar Facebook
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* MODAL DE PUBLICACIÓN */}
      {showPublishModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', padding:32, borderRadius:24, maxWidth:400, width:'100%', textAlign:'center' }}>
            <h3 style={{ fontSize:20, fontWeight:800, marginBottom:10 }}>¿Dónde publicamos?</h3>
            <p style={{ color:C.textMuted, fontSize:14, marginBottom:24 }}>Selecciona la plataforma de destino</p>
            <button onClick={() => publishDirect('facebook')} disabled={publishing} style={{ width:'100%', padding:14, background:'#1877f2', color:'#fff', border:'none', borderRadius:12, marginBottom:12, fontWeight:700, cursor:'pointer' }}>
               {publishing ? 'Publicando...' : 'Facebook Page'}
            </button>
            <button onClick={() => setShowPublishModal(false)} style={{ width:'100%', padding:12, background:'none', border:'none', color:C.textMuted, cursor:'pointer', fontWeight:600 }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
