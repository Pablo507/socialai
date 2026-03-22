
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
  const [industry, setIndustry] = useState('General / Otro rubro');
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
  const [videoResults, setVideoResults] = useState<{url:string,thumbnail:string,duration:number,photographer:string}[]>([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [previewVideo, setPreviewVideo] = useState('');
  const pollingRef = useRef<NodeJS.Timeout|null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      // 1. Obtener usuario
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        loadHistory(currentUser.id);

        // ✅ VERIFICACIÓN DE CONEXIÓN: Consultamos si existe una fila para este usuario
        const { data: conn, error } = await supabase
          .from('social_connections')
          .select('id')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (conn) {
          setFacebookConnected(true);
        }
      }

      // 2. Detectar respuesta del callback
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'connected' || params.get('facebook_connected') === 'true') {
        setFacebookConnected(true);
        showToast('✅ Facebook conectado correctamente');
        window.history.replaceState({}, '', '/dashboard');

        // Restaurar borrador
        const saved = sessionStorage.getItem('socialai_draft');
        if (saved) {
          try {
            const draft = JSON.parse(saved);
            if (draft.copyResult) setCopyResult(draft.copyResult);
            if (draft.previewImage) setPreviewImage(draft.previewImage);
            if (draft.previewContent) setPreviewContent(draft.previewContent);
            if (draft.copyPrompt) setCopyPrompt(draft.copyPrompt);
            if (draft.imagePrompt) setImagePrompt(draft.imagePrompt);
            if (draft.selectedPlatforms) setSelectedPlatforms(draft.selectedPlatforms);
            if (draft.industry) setIndustry(draft.industry);
            if (draft.goal) setGoal(draft.goal);
            if (draft.tone) setTone(draft.tone);
          } catch {}
          sessionStorage.removeItem('socialai_draft');
        }
      }

      if (params.get('error')) {
        showToast('❌ Error en la conexión. Revisa los permisos.');
        window.history.replaceState({}, '', '/dashboard');
      }
    }

    init();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // --- FUNCIONES DE LOGICA ---

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

  // ✅ FUNCIÓN CORREGIDA: Ahora envía el state para evitar user_id null
  function connectFacebook() {
    if (!user) {
      showToast('⚠️ Debes iniciar sesión primero');
      return;
    }

    const draft = {
      copyResult,
      previewImage,
      previewContent,
      copyPrompt,
      imagePrompt,
      selectedPlatforms,
      industry,
      goal,
      tone,
    };
    sessionStorage.setItem('socialai_draft', JSON.stringify(draft));
    
    // Enviamos el ID del usuario como state
    window.location.href = `/api/auth/facebook?state=${user.id}`;
  }

  async function publishDirect(platform: 'facebook' | 'instagram') {
    if (!user) return;
    setPublishing(true);
    try {
      let imageUrl = previewImage;
      if (previewImage?.startsWith('data:')) {
        showToast('⏳ Procesando imagen...');
        imageUrl = await uploadImageForSharing();
      }

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          text: copyResult || previewContent,
          imageUrl,
          userId: user.id, // Usamos el ID de Supabase para buscar el token en la API
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ ¡Publicado en ${platform}!`);
      } else {
        showToast('❌ Error: ' + data.error);
      }
    } catch {
      showToast('❌ Error de red');
    }
    setPublishing(false);
    setShowPublishModal(false);
  }

  // ... (Resto de funciones: generateCopy, generateImages, uploadImageForSharing permanecen igual) ...

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

  async function copyAndOpen() {
    const text = copyResult || previewContent;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    await new Promise(r => setTimeout(r, 600));
    if (sharePlatform === 'Facebook') window.open('https://www.facebook.com/', '_blank');
    else if (sharePlatform === 'Instagram') window.open('https://www.instagram.com/', '_blank');
    setShowShareModal(false);
    showToast('✅ ¡Texto copiado!');
  }

  const remaining = maxUsage - usageCount;
  const currentText = copyResult || previewContent;

  const C = {
    bg: '#FAF8F5',
    surface: '#FFFFFF',
    border: '#E8E0F0',
    text: '#2D2640',
    textMuted: '#7B6E99',
    textDim: '#B5AACC',
    accent: '#7C5CBF',
    accentSoft: '#EDE8F8',
    green: '#5BB894',
    grad: 'linear-gradient(135deg, #7C5CBF, #B07FE8)',
    accentGlow: '#7C5CBF18',
  };

  const inputStyle = { width:'100%', background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:12, color:C.text, padding:'11px 14px', fontSize:14, outline:'none' } as React.CSSProperties;
  const labelStyle = { display:'block', fontSize:11, color:C.textMuted, marginBottom:6, fontWeight:700, textTransform:'uppercase' } as React.CSSProperties;

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:C.bg, color:C.text, minHeight:'100vh' }}>
      <style>{`
        .btn{transition:all .18s ease}.btn:hover{transform:translateY(-2px);opacity:.9}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {shareToast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:C.text, borderRadius:12, padding:'12px 22px', color:'#fff', zIndex:999 }}>
          {shareToast}
        </div>
      )}

      {/* MODAL DE PUBLICACIÓN DIRECTA */}
      {showPublishModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', padding:30, borderRadius:20, maxWidth:400, width:'90%' }}>
            <h3 style={{ marginBottom:20 }}>🚀 Publicar ahora</h3>
            <button onClick={() => publishDirect('facebook')} disabled={publishing} style={{ width:'100%', padding:12, background:'#1877f2', color:'#fff', border:'none', borderRadius:10, marginBottom:10, cursor:'pointer' }}>
               {publishing ? 'Procesando...' : 'Facebook'}
            </button>
            <button onClick={() => publishDirect('instagram')} disabled={publishing || !previewImage} style={{ width:'100%', padding:12, background:'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer' }}>
               Instagram
            </button>
            <button onClick={() => setShowPublishModal(false)} style={{ width:'100%', marginTop:10, background:'none', border:'none', color:C.textMuted, cursor:'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 32px', borderBottom:`1px solid ${C.border}`, background:C.surface, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontSize:22, fontWeight:800, background:C.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>SocialAI</div>
        <div style={{ display:'flex', gap:12 }}>
          <div style={{ background:C.accentSoft, borderRadius:20, padding:'5px 14px', fontSize:12, color:C.accent, fontWeight:700 }}>
            ✦ {remaining} créditos
          </div>
          <button onClick={async () => { const s=createClient(); await s.auth.signOut(); window.location.href='/auth/login'; }}
            style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.textMuted, padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13 }}>Salir</button>
        </div>
      </nav>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr 300px', minHeight:'calc(100vh - 70px)' }}>
        
        {/* SIDEBAR */}
        <aside style={{ borderRight:`1px solid ${C.border}`, padding:20, background:C.surface }}>
          {['copy', 'images', 'videos'].map(id => (
            <button key={id} onClick={() => setActivePanel(id)}
              style={{ width:'100%', padding:12, textAlign:'left', borderRadius:10, marginBottom:5, border:'none', cursor:'pointer', background:activePanel===id?C.accentSoft:'transparent', color:activePanel===id?C.accent:C.textMuted, fontWeight:activePanel===id?700:500 }}>
              {id === 'copy' ? '✍️ Copy' : id === 'images' ? '🖼️ Imágenes' : '🎬 Videos'}
            </button>
          ))}
        </aside>

        {/* MAIN EDITOR */}
        <main style={{ padding:28, overflowY:'auto' }}>
          {activePanel === 'copy' && (
            <div>
              <h1 style={{ fontSize:24, marginBottom:20 }}>✍️ Crear Copy</h1>
              <div style={{ background:'#fff', padding:24, borderRadius:18, border:`1px solid ${C.border}` }}>
                <label style={labelStyle}>¿Qué quieres promocionar?</label>
                <textarea value={copyPrompt} onChange={e => setCopyPrompt(e.target.value)} style={{ ...inputStyle, minHeight:100, marginBottom:20 }} placeholder="Ej: Una oferta de café artesanal..." />
                
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:15, marginBottom:20 }}>
                   <div>
                     <label style={labelStyle}>Tono</label>
                     <select value={tone} onChange={e => setTone(e.target.value)} style={inputStyle}>
                       <option>Amigable</option><option>Profesional</option><option>Urgente</option>
                     </select>
                   </div>
                   <div>
                     <label style={labelStyle}>Objetivo</label>
                     <select value={goal} onChange={e => setGoal(e.target.value)} style={inputStyle}>
                       <option>Vender</option><option>Engagement</option>
                     </select>
                   </div>
                </div>

                <button onClick={() => {}} className="btn" style={{ width:'100%', padding:14, background:C.grad, color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer' }}>
                  Generar Texto ✨
                </button>
              </div>
            </div>
          )}
        </main>

        {/* PREVIEW PANEL */}
        <aside style={{ borderLeft:`1px solid ${C.border}`, padding:20, background:'#fff' }}>
          <h3 style={{ marginBottom:15, fontSize:14 }}>Vista Previa</h3>
          <div style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', marginBottom:20 }}>
            {previewImage ? <img src={previewImage} style={{ width:'100%' }} /> : <div style={{ height:150, background:C.bg }} />}
            <div style={{ padding:15, fontSize:13, color:C.text }}>{currentText}</div>
          </div>

          <div style={{ display:'grid', gap:10 }}>
            {facebookConnected ? (
              <button onClick={() => setShowPublishModal(true)} style={{ padding:12, background:C.grad, color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>
                🚀 Publicar ahora
              </button>
            ) : (
              <button onClick={connectFacebook} style={{ padding:12, background:'#1877f2', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>
                📘 Conectar con Facebook
              </button>
            )}
            
            <button onClick={() => openShareModal('WhatsApp')} style={{ padding:12, border:`1px solid ${C.border}`, borderRadius:10, cursor:'pointer' }}>
              💬 Compartir en WhatsApp
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
