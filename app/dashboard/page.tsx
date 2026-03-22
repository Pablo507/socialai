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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoStatus, setVideoStatus] = useState<'idle'|'processing'|'completed'|'failed'>('idle');
  const [videoResults, setVideoResults] = useState<{url:string,thumbnail:string}[]>([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [previewVideo, setPreviewVideo] = useState('');
  const pollingRef = useRef<NodeJS.Timeout|null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  const C = {
    bg: '#FAF8F5',
    surface: '#FFFFFF',
    border: '#E8E0F0',
    borderLight: '#F0EBF8',
    text: '#2D2640',
    textMuted: '#7B6E99',
    textDim: '#B5AACC',
    accent: '#7C5CBF',
    accentSoft: '#EDE8F8',
    gold: '#F59E6B',
    grad: 'linear-gradient(135deg, #7C5CBF, #B07FE8)',
    green: '#5BB894',
    greenSoft: '#E6F5F0',
    accentGlow: '#7C5CBF18',
  };

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
        const { data: conn } = await supabase.from('social_connections').select('id').eq('user_id', currentUser.id).maybeSingle();
        if (conn) setFacebookConnected(true);
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('facebook_connected') === 'true') {
        setFacebookConnected(true);
        showToast('✅ Facebook conectado');
        window.history.replaceState({}, '', '/dashboard');
      }
    }
    init();
  }, []);

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
    window.location.href = '/api/auth/facebook';
  }

  async function generateCopy() {
    if (usageCount >= maxUsage) { setShowModal(true); return; }
    setCopyLoading(true);
    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: copyPrompt, industry, goal, tone, platforms: selectedPlatforms, userId: user?.id }),
      });
      const data = await res.json();
      if (data.copy) {
        setCopyResult(data.copy);
        setPreviewContent(data.copy.substring(0, 150) + '...');
        setUsageCount(c => c + 1);
      }
    } catch { alert('Error'); } finally { setCopyLoading(false); }
  }

  async function generateImages() {
    if (usageCount >= maxUsage) { setShowModal(true); return; }
    setImageLoading(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt, userId: user?.id }),
      });
      const data = await res.json();
      if (data.images) {
        setImages(data.images);
        setUsageCount(c => c + 1);
      }
    } catch { alert('Error'); } finally { setImageLoading(false); }
  }

  async function generateVideo() {
    if (usageCount >= maxUsage) { setShowModal(true); return; }
    setVideoStatus('processing');
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: videoPrompt, userId: user?.id }),
      });
      const data = await res.json();
      if (data.videos) {
        setVideoResults(data.videos);
        setSelectedVideo(data.videos[0].url);
        setPreviewVideo(data.videos[0].url);
        setVideoStatus('completed');
        setUsageCount(c => c + 1);
      } else { setVideoStatus('failed'); }
    } catch { setVideoStatus('failed'); }
  }

  const inputStyle = { width:'100%', background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:12, padding:'11px', fontSize:14, outline:'none' } as React.CSSProperties;
  const labelStyle = { display:'block', fontSize:11, color:C.textMuted, marginBottom:6, fontWeight:700, textTransform:'uppercase' } as React.CSSProperties;

  const remaining = maxUsage - usageCount;
  const currentText = copyResult || previewContent;

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:C.bg, color:C.text, minHeight:'100vh' }}>
      {shareToast && <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:C.text, borderRadius:12, padding:'12px 22px', color:'#fff', zIndex:999 }}>{shareToast}</div>}

      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 32px', borderBottom:`1px solid ${C.border}`, background:C.surface, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontSize:22, fontWeight:800, background:C.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>SocialAI</div>
        <div style={{ background:C.accentSoft, borderRadius:20, padding:'5px 14px', fontSize:12, color:C.accent, fontWeight:700 }}>✦ {remaining} créditos</div>
      </nav>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr 280px', minHeight:'calc(100vh - 70px)' }}>
        <aside style={{ borderRight:`1px solid ${C.border}`, padding:20, background:C.surface, display: isMobile ? 'none' : 'block' }}>
          <button onClick={() => setActivePanel('copy')} style={{ width:'100%', padding:12, textAlign:'left', borderRadius:10, marginBottom:8, border:'none', cursor:'pointer', background:activePanel==='copy'?C.accentSoft:'transparent', color:activePanel==='copy'?C.accent:C.textMuted, fontWeight:700 }}>✍️ Copy</button>
          <button onClick={() => setActivePanel('images')} style={{ width:'100%', padding:12, textAlign:'left', borderRadius:10, marginBottom:8, border:'none', cursor:'pointer', background:activePanel==='images'?C.accentSoft:'transparent', color:activePanel==='images'?C.accent:C.textMuted, fontWeight:700 }}>🖼️ Imágenes</button>
          <button onClick={() => setActivePanel('videos')} style={{ width:'100%', padding:12, textAlign:'left', borderRadius:10, marginBottom:8, border:'none', cursor:'pointer', background:activePanel==='videos'?C.accentSoft:'transparent', color:activePanel==='videos'?C.accent:C.textMuted, fontWeight:700 }}>🎬 Videos</button>
        </aside>

        <main style={{ padding: isMobile ? 16 : 32, overflowY:'auto' }}>
          {activePanel === 'copy' && (
            <div>
              <h1 style={{ fontSize:24, fontWeight:800, marginBottom:20 }}>✍️ Generar Copy</h1>
              <div style={{ background:C.surface, padding:24, borderRadius:20, border:`1px solid ${C.border}` }}>
                <label style={labelStyle}>Tu idea</label>
                <textarea value={copyPrompt} onChange={e => setCopyPrompt(e.target.value)} style={{ ...inputStyle, minHeight:100, marginBottom:16 }} placeholder="Ej: Oferta de pizzas 2x1..." />
                <button onClick={generateCopy} disabled={copyLoading} style={{ width:'100%', padding:14, background:C.grad, color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer' }}>{copyLoading ? 'Generando...' : 'Crear Texto ✨'}</button>
              </div>
              {copyResult && <div style={{ marginTop:20, padding:20, background:C.surface, borderRadius:16, border:`1px solid ${C.border}` }}>{copyResult}</div>}
            </div>
          )}

          {activePanel === 'images' && (
            <div>
              <h1 style={{ fontSize:24, fontWeight:800, marginBottom:20 }}>🖼️ Imágenes AI</h1>
              <div style={{ background:C.surface, padding:24, borderRadius:20, border:`1px solid ${C.border}` }}>
                <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} style={{ ...inputStyle, minHeight:80, marginBottom:16 }} placeholder="Describí la imagen..." />
                <button onClick={generateImages} disabled={imageLoading} style={{ width:'100%', padding:14, background:C.grad, color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer' }}>{imageLoading ? 'Procesando...' : 'Generar Fotos'}</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:20 }}>
                {images.map((img, i) => <img key={i} src={img} onClick={() => setPreviewImage(img)} style={{ width:'100%', borderRadius:12, cursor:'pointer', border:previewImage===img?`3px solid ${C.accent}`:'none' }} />)}
              </div>
            </div>
          )}

          {activePanel === 'videos' && (
            <div>
              <h1 style={{ fontSize:24, fontWeight:800, marginBottom:20 }}>🎬 Videos Stock</h1>
              <div style={{ background:C.surface, padding:24, borderRadius:20, border:`1px solid ${C.border}` }}>
                <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} style={{ ...inputStyle, minHeight:80, marginBottom:16 }} placeholder="Ej: Café humeante..." />
                <button onClick={generateVideo} disabled={videoStatus==='processing'} style={{ width:'100%', padding:14, background:C.grad, color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer' }}>{videoStatus==='processing' ? 'Buscando...' : 'Buscar Videos'}</button>
              </div>
            </div>
          )}
        </main>

        <aside style={{ borderLeft:`1px solid ${C.border}`, padding:24, background:C.surface }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.textDim, marginBottom:15 }}>VISTA PREVIA</div>
          <div style={{ border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden', marginBottom:20 }}>
            <div style={{ aspectRatio:'1/1', background:C.accentSoft }}>
              {previewVideo ? <video src={previewVideo} autoPlay muted loop style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (previewImage && <img src={previewImage} style={{ width:'100%', height:'100%', objectFit:'cover' }} />)}
            </div>
            <div style={{ padding:15, fontSize:13 }}>{currentText.substring(0, 100)}...</div>
          </div>
          {facebookConnected ? (
            <button style={{ width:'100%', padding:14, background:C.grad, color:'#fff', border:'none', borderRadius:12, fontWeight:700 }}>Publicar ahora</button>
          ) : (
            <button onClick={connectFacebook} style={{ width:'100%', padding:14, background:'#1877f2', color:'#fff', border:'none', borderRadius:12, fontWeight:700 }}>Conectar Facebook</button>
          )}
        </aside>
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', padding:32, borderRadius:24, textAlign:'center' }}>
            <h3>Límite alcanzado</h3>
            <button onClick={() => setShowModal(false)} style={{ marginTop:20 }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
