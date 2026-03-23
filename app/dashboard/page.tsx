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
      if (params.get('facebook_connected') === 'true') {
        setFacebookConnected(true);
        showToast('✅ Facebook conectado correctamente');
        window.history.replaceState({}, '', '/dashboard');

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

  function connectFacebook() {
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
    window.location.href = '/api/auth/facebook';
  }

  function openShareModal(platform: string) {
    setSharePlatform(platform);
    setShowShareModal(true);
    setCopied(false);
  }

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

    await new Promise(r => setTimeout(r, 600));

    if (sharePlatform === 'Facebook') {
      window.open('https://www.facebook.com/', '_blank');
    } else if (sharePlatform === 'Instagram') {
      window.open('https://www.instagram.com/', '_blank');
    } else if (sharePlatform === 'WhatsApp') {
      showToast('⏳ Preparando preview...');
      try {
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: previewImage || null,
            copyText: text,
            userId: user?.id,
            platform: 'whatsapp',
          }),
        });
        const data = await res.json();
        if (data.shareUrl) {
          showToast('🔗 ' + data.shareUrl);
          await navigator.clipboard.writeText(data.shareUrl).catch(() => {});
          setTimeout(() => {
            window.open('https://wa.me/?text=' + encodeURIComponent(data.shareUrl), '_blank');
          }, 2000);
        } else {
          showToast('❌ Error: ' + (data.error || 'sin shareUrl'));
          window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
        }
      } catch (err: any) {
        showToast('❌ Excepción: ' + err.message);
        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
      }
    }

    setShowShareModal(false);
    showToast('✅ ¡Listo para publicar!');
  }

  async function publishDirect(platform: 'facebook' | 'instagram') {
    if (!user) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      let imageUrl: string | null = null;
      if (previewImage) {
        if (previewImage.startsWith('data:')) {
          showToast('⏳ Subiendo imagen...');
          imageUrl = await uploadImageForSharing();
          if (!imageUrl) {
            showToast('❌ No se pudo subir la imagen');
            setPublishing(false);
            return;
          }
        } else {
          imageUrl = previewImage;
        }
      }

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          text: copyResult || previewContent,
          imageUrl,
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
        body: JSON.stringify({ prompt: copyPrompt, industry, goal, tone, platforms: selectedPlatforms, userId: user?.id }),
      });
      const data = await res.json();
      if (data.copy) {
        setCopyResult(data.copy);
        setPreviewContent(data.copy.substring(0, 150) + '...');
        setUsageCount(c => c + 1);
        if (user) setTimeout(() => loadHistory(user.id), 1000);
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
      if (data.images) {
        setImages(data.images);
        setUsageCount(c => c + 1);
        if (user) setTimeout(() => loadHistory(user.id), 1000);
      }
      else { alert('Error: ' + data.error); }
    } catch { alert('Error de conexión'); }
    setImageLoading(false);
  }

  async function generateVideo() {
    if (checkUsage()) return;
    if (!videoPrompt.trim()) { alert('Describí tu idea'); return; }
    setVideoStatus('processing'); setVideoResults([]); setSelectedVideo('');
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: videoPrompt, userId: user?.id }),
      });
      const data = await res.json();
      if (data.limitReached) { setShowModal(true); setVideoStatus('idle'); return; }
      if (data.videos?.length > 0) {
        setVideoResults(data.videos);
        setSelectedVideo(data.videos[0].url);
        setPreviewVideo(data.videos[0].url);
        setVideoStatus('completed');
        setUsageCount(c => c + 1);
        if (user) setTimeout(() => loadHistory(user.id), 1000);
      } else { setVideoStatus('failed'); }
    } catch { setVideoStatus('failed'); }
  }

  function loadPost(post: any) {
    if (post.copy_text) { setCopyResult(post.copy_text); setPreviewContent(post.copy_text.substring(0, 150) + '...'); setActivePanel('copy'); }
    if (post.image_url) setPreviewImage(post.image_url);
  }

  const remaining = maxUsage - usageCount;
  const hasContent = !!(copyResult || previewImage || previewVideo);
  const currentText = copyResult || previewContent;

  const C = {
    bg: '#FAF8F5',
    surface: '#FFFFFF',
    surfaceHover: '#F3EFF9',
    border: '#E8E0F0',
    borderLight: '#F0EBF8',
    text: '#2D2640',
    textMuted: '#7B6E99',
    textDim: '#B5AACC',
    accent: '#7C5CBF',
    accentGlow: '#7C5CBF18',
    accentSoft: '#EDE8F8',
    gold: '#F59E6B',
    goldSoft: '#FEF0E7',
    rose: '#E87BAA',
    roseSoft: '#FDE8F2',
    green: '#5BB894',
    greenSoft: '#E6F5F0',
    blue: '#5B9BD5',
    blueSoft: '#E8F2FC',
    grad: 'linear-gradient(135deg, #7C5CBF, #B07FE8)',
    gradWarm: 'linear-gradient(135deg, #F59E6B, #E87BAA)',
  };

  const inputStyle = { width:'100%', background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:12, color:C.text, padding:'11px 14px', fontSize:14, fontFamily:'inherit', outline:'none', boxShadow:'0 1px 4px rgba(124,92,191,.06)' } as React.CSSProperties;
  const labelStyle = { display:'block', fontSize:11, color:C.textMuted, marginBottom:6, fontWeight:700, letterSpacing:.8, textTransform:'uppercase' } as React.CSSProperties;

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", background:C.bg, color:C.text, minHeight:'100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}
        body{background:#FAF8F5}
        select option{background:#FFFFFF;color:#2D2640}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#F3EFF9}
        ::-webkit-scrollbar-thumb{background:#C4B8E0;border-radius:3px}
        textarea:focus,select:focus{border-color:#7C5CBF!important;box-shadow:0 0 0 3px #7C5CBF15!important;outline:none}
        @keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn .3s ease forwards}
        .slide-up{animation:slideUp .35s cubic-bezier(.22,1,.36,1) forwards}
        .btn{transition:all .18s cubic-bezier(.22,1,.36,1)}
        .btn:hover{opacity:.88;transform:translateY(-2px);box-shadow:0 4px 16px rgba(124,92,191,.18)!important}
        .btn:active{transform:translateY(0)}
        .card{transition:box-shadow .2s,border-color .2s}
        .card:hover{border-color:#C4B8E0!important;box-shadow:0 4px 20px rgba(124,92,191,.08)!important}
        @keyframes spin{to{transform:rotate(360deg)}}
        input::placeholder,textarea::placeholder{color:#B5AACC}
      `}</style>

      {shareToast && (
        <div className="slide-up" style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:C.text, border:'none', borderRadius:12, padding:'12px 22px', fontSize:14, color:'#FAF8F5', zIndex:999, boxShadow:'0 8px 32px rgba(45,38,64,.25)', whiteSpace:'nowrap', fontWeight:500 }}>
          {shareToast}
        </div>
      )}

      {showShareModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(45,38,64,.55)', backdropFilter:'blur(10px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e => e.target===e.currentTarget && setShowShareModal(false)}>
          <div className="slide-up" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:28, maxWidth:460, width:'100%', boxShadow:'0 32px 80px rgba(45,38,64,.18)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:18, fontWeight:800 }}>
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

      {showPublishModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(45,38,64,.55)', backdropFilter:'blur(10px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e => e.target===e.currentTarget && setShowPublishModal(false)}>
          <div className="slide-up" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:28, maxWidth:440, width:'100%', boxShadow:'0 32px 80px rgba(45,38,64,.18)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:18, fontWeight:800 }}>🚀 Publicar directamente</div>
              <button onClick={() => setShowPublishModal(false)} style={{ background:'transparent', border:'none', color:C.textMuted, cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:14, marginBottom:18 }}>
              {previewImage && <img src={previewImage} style={{ width:'100%', height:120, objectFit:'cover', borderRadius:7, marginBottom:10 }} alt="" />}
              <pre style={{ fontSize:12, lineHeight:1.6, color:C.textMuted, whiteSpace:'pre-wrap', fontFamily:'inherit', margin:0, maxHeight:80, overflow:'hidden' }}>
                {currentText.substring(0, 120)}...
              </pre>
            </div>
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

      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: isMobile ? '12px 16px' : '14px 32px', borderBottom:`1px solid ${C.border}`, background:C.surface, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:22, fontWeight:800, background:C.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>SocialAI</div>
        <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 6 : 12 }}>
          {!isMobile && <div style={{ background:C.accentSoft, border:`1.5px solid ${C.accent}55`, borderRadius:20, padding:'5px 14px', fontSize:12, color:C.accent, fontWeight:700 }}>
            ✦ {remaining} generaciones restantes
          </div>}
          {user
            ? <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {!isMobile && <span style={{ fontSize:13, color:C.textMuted }}>👤 {user.email}</span>}
                <button onClick={async () => { const s=createClient(); await s.auth.signOut(); window.location.href='/auth/login'; }}
                  style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.textMuted, padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13 }}>Salir</button>
              </div>
            : <button onClick={() => window.location.href='/auth/login'}
                style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.textMuted, padding:'8px 18px', borderRadius:8, cursor:'pointer', fontSize:13 }}>Iniciar sesión</button>
          }
          {isMobile
            ? <button onClick={() => setShowRightPanel(true)} style={{ background:C.accentSoft, border:`1.5px solid ${C.accent}44`, color:C.accent, padding:'7px 12px', borderRadius:10, cursor:'pointer', fontSize:12, fontWeight:700 }}>👁️ Preview</button>
            : <button onClick={() => setShowModal(true)} className="btn"
                style={{ background:C.grad, border:'none', color:'#fff', padding:'8px 18px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700, boxShadow:'0 3px 12px rgba(124,92,191,.28)' }}>Upgrade Pro</button>
          }
        </div>
      </nav>

      <div style={{ padding: isMobile ? '8px 16px' : '8px 32px', background:'#F3EFF9', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:14 }}>
        <span style={{ fontSize:11, color:C.textDim }}>Plan gratuito</span>
        <div style={{ flex:1, height:5, background:'#E8E0F0', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${(usageCount/maxUsage)*100}%`, background:C.grad, borderRadius:2, transition:'width .5s' }} />
        </div>
        <span style={{ fontSize:11, color:C.textDim }}><strong style={{ color:C.accent }}>{usageCount}</strong> / {maxUsage}</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr 272px', minHeight:'calc(100vh - 97px)' }}>

        <aside style={{ borderRight:`1px solid ${C.border}`, padding:'20px 10px', background:C.surface, display: isMobile ? 'none' : 'block' }}>
          {([['✍️','Copywriting','copy'],['🖼️','Imágenes','images'],['🎬','Videos','videos']] as [string,string,string][]).map(([icon,label,id]) => (
            <button key={id} onClick={() => setActivePanel(id)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, cursor:'pointer', color:activePanel===id?C.accent:C.textMuted, fontSize:13, fontWeight:activePanel===id?700:500, border:activePanel===id?`1.5px solid ${C.accent}44`:'1.5px solid transparent', background:activePanel===id?C.accentSoft:'transparent', width:'100%', textAlign:'left', fontFamily:'inherit', marginBottom:3 }}>
              <span style={{ fontSize:15 }}>{icon}</span> {label}
            </button>
          ))}
          <div style={{ borderTop:`1px solid ${C.border}`, marginTop:16, paddingTop:16 }}>
            <button onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, cursor:'pointer', color:C.accent, fontSize:13, fontWeight:700, border:`1.5px solid ${C.accent}33`, background:C.accentSoft, width:'100%', textAlign:'left', fontFamily:'inherit' }}>
              <span>⚡</span> Upgrade Pro
            </button>
          </div>
        </aside>

        <main style={{ padding: isMobile ? 16 : 28, overflowY:'auto', background:C.bg, minHeight:'calc(100vh - 97px)', paddingBottom: isMobile ? 80 : 28 }}>

          {activePanel === 'copy' && (
            <div className="fade-in">
              <h1 style={{ fontFamily:"'Nunito',sans-serif", fontSize:24, fontWeight:800, marginBottom:4 }}>✍️ Copywriting con IA</h1>
              <p style={{ color:C.textMuted, fontSize:13, marginBottom:24 }}>Textos persuasivos listos para publicar</p>

              <div style={{ background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:18, padding:24, marginBottom:20, boxShadow:'0 2px 16px rgba(124,92,191,.06)' }}>
                <div style={{ marginBottom:14 }}>
                  <label style={labelStyle}>Red social</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {[['📘','Facebook','#6B9FD4'],['📸','Instagram','#D4836B'],['💬','WhatsApp','#25D366']].map(([icon,name,color]) => {
                      const active = selectedPlatforms.includes(name);
                      return <button key={name} onClick={() => togglePlatform(name)}
                        style={{ padding:'7px 16px', borderRadius:20, border:`2px solid ${active?color:C.border}`, background:active?`${color}18`:'transparent', color:active?color:C.textMuted, fontSize:13, cursor:'pointer', fontWeight:active?700:500 }}>{icon} {name}</button>;
                    })}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                  <div>
                    <label style={labelStyle}>Industria</label>
                    <select value={industry} onChange={e => setIndustry(e.target.value)} style={inputStyle}>
                      {['General / Otro rubro','Restaurante / Gastronomía','Moda y Ropa','Fitness y Salud','Tecnología','E-commerce','Inmobiliaria','Turismo','Educación'].map(o => <option key={o}>{o}</option>)}
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
                        style={{ padding:'6px 13px', borderRadius:20, border:`2px solid ${tone===name?C.accent:C.border}`, background:tone===name?C.accentSoft:'transparent', color:tone===name?C.accent:C.textMuted, fontSize:12, cursor:'pointer', fontWeight:tone===name?700:500 }}>
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
                  style={{ width:'100%', background:copyLoading?C.border:C.grad, border:'none', color:'#fff', padding:14, borderRadius:14, fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:copyLoading?'none':'0 4px 18px rgba(124,92,191,.32)' }}>
                  {copyLoading ? '⏳ Generando...' : '⚡ Generar Copy con IA'}
                </button>
              </div>

              {copyResult && (
                <div className="fade-in" style={{ background:C.surface, border:`1px solid ${C.borderLight}`, borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:'#F8F5FF' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:C.accent }}>✦ Copy generado</span>
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
              <h1 style={{ fontFamily:"'Nunito',sans-serif", fontSize:24, fontWeight:800, marginBottom:4 }}>🖼️ Generador de Imágenes</h1>
              <p style={{ color:C.textMuted, fontSize:13, marginBottom:24 }}>4 variaciones únicas generadas con IA</p>

              <div style={{ background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:18, padding:24, marginBottom:20, boxShadow:'0 2px 16px rgba(124,92,191,.06)' }}>
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
                  style={{ width:'100%', background:imageLoading?C.border:C.grad, border:'none', color:'#fff', padding:14, borderRadius:14, fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:imageLoading?'none':'0 4px 18px rgba(124,92,191,.32)' }}>
                  {imageLoading ? '⏳ Generando (~10s)...' : '🎨 Generar 4 Imágenes'}
                </button>
              </div>

              {images.length > 0 && (
                <div className="fade-in" style={{ background:C.surface, border:`1px solid ${C.borderLight}`, borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:'#F8F5FF' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:C.accent }}>✦ Imágenes generadas</span>
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
              <h1 style={{ fontFamily:"'Nunito',sans-serif", fontSize:24, fontWeight:800, marginBottom:4 }}>🎬 Generador de Videos</h1>
              <p style={{ color:C.textMuted, fontSize:13, marginBottom:24 }}>Videos stock listos para Reels y TikTok · powered by Pexels</p>

              <div style={{ background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:18, padding:24, marginBottom:20, boxShadow:'0 2px 16px rgba(124,92,191,.06)' }}>
                <label style={labelStyle}>Describí tu video</label>
                <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} style={{ ...inputStyle, marginBottom:16, resize:'vertical' } as React.CSSProperties}
                  rows={3} placeholder="Ej: café siendo servido en cámara lenta, vapor y luz cálida..." />
                <button onClick={generateVideo} disabled={videoStatus==='processing'} className="btn"
                  style={{ width:'100%', background:videoStatus==='processing'?C.border:C.grad, border:'none', color:'#fff', padding:14, borderRadius:14, fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:800, cursor:videoStatus==='processing'?'not-allowed':'pointer', boxShadow:videoStatus==='processing'?'none':'0 4px 18px rgba(124,92,191,.32)' }}>
                  {videoStatus==='processing' ? '⏳ Buscando videos...' : '🎬 Generar Videos con IA'}
                </button>
              </div>

              {videoStatus==='processing' && (
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:32, textAlign:'center' }}>
                  <div style={{ fontSize:36, marginBottom:12, animation:'shimmer 2s infinite' }}>🎬</div>
                  <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:16, fontWeight:700, marginBottom:8 }}>Buscando videos...</div>
                  <div style={{ fontSize:13, color:C.textMuted }}>Unos segundos</div>
                </div>
              )}

              {videoStatus==='completed' && videoResults.length > 0 && (
                <div className="fade-in" style={{ background:C.surface, border:`1px solid ${C.borderLight}`, borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', background:'#F8F5FF' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:C.accent }}>✦ {videoResults.length} videos encontrados</span>
                    <span style={{ fontSize:11, color:C.textMuted }}>Click para seleccionar →</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:16 }}>
                    {videoResults.map((v, i) => (
                      <div key={i} onClick={() => { setSelectedVideo(v.url); setPreviewVideo(v.url); }} className="card"
                        style={{ background:C.bg, border:selectedVideo===v.url?`2px solid ${C.accent}`:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', cursor:'pointer', boxShadow:selectedVideo===v.url?`0 0 16px ${C.accentGlow}`:'none' }}>
                        <div style={{ position:'relative', height:120 }}>
                          <img src={v.thumbnail} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          <div style={{ position:'absolute', bottom:5, right:5, background:'rgba(0,0,0,.65)', borderRadius:4, padding:'2px 6px', fontSize:10, color:'#fff' }}>
                            {v.duration}s
                          </div>
                          {selectedVideo===v.url && (
                            <div style={{ position:'absolute', inset:0, background:'rgba(124,92,191,.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <span style={{ fontSize:24, color:'#fff' }}>✓</span>
                            </div>
                          )}
                        </div>
                        <div style={{ padding:'7px 10px', fontSize:10, color:selectedVideo===v.url?C.accent:C.textMuted, fontWeight:selectedVideo===v.url?600:400 }}>
                          {selectedVideo===v.url?'✓ Seleccionado':'Versión '}{String.fromCharCode(65+i)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedVideo && (
                    <div style={{ padding:'0 16px 16px' }}>
                      <video key={selectedVideo} controls style={{ width:'100%', borderRadius:10, maxHeight:300 }}>
                        <source src={selectedVideo} type="video/mp4" />
                      </video>
                      <div style={{ display:'flex', gap:8, marginTop:10 }}>
                        <a href={selectedVideo} download target="_blank" rel="noreferrer" className="btn"
                          style={{ flex:1, background:C.grad, color:'#fff', padding:'10px 14px', borderRadius:10, fontSize:13, fontWeight:700, textAlign:'center' as const, textDecoration:'none', display:'block' }}>
                          ⬇️ Descargar
                        </a>
                        <button onClick={generateVideo} className="btn"
                          style={{ flex:1, background:'transparent', border:`1px solid ${C.border}`, color:C.textMuted, padding:'10px 14px', borderRadius:10, fontSize:13, cursor:'pointer' }}>
                          🔄 Buscar más
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {videoStatus==='failed' && (
                <div style={{ background:C.roseSoft, border:`1px solid ${C.rose}44`, borderRadius:16, padding:24, textAlign:'center' }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>❌</div>
                  <div style={{ fontSize:13, color:C.rose, marginBottom:12 }}>No se encontraron videos. Intentá con otro término.</div>
                  <button onClick={() => setVideoStatus('idle')} style={{ padding:'8px 18px', borderRadius:8, border:`1px solid ${C.border}`, background:'transparent', color:C.textMuted, cursor:'pointer', fontSize:13 }}>Reintentar</button>
                </div>
              )}
            </div>
          )}
        </main>

        {isMobile && showRightPanel && (
          <div onClick={() => setShowRightPanel(false)}
            style={{ position:'fixed', inset:0, background:'rgba(45,38,64,.5)', zIndex:400 }} />
        )}
        <aside style={ isMobile ? {
          position:'fixed' as const, bottom:0, left:0, right:0, zIndex:401,
          background:C.surface,
          transform: showRightPanel ? 'translateY(0)' : 'translateY(110%)',
          transition:'transform 0.3s ease',
          maxHeight:'85vh', overflowY:'auto' as const,
          borderRadius:'20px 20px 0 0',
          padding:'16px 14px 90px',
          boxShadow:'0 -8px 40px rgba(45,38,64,.15)',
        } : { borderLeft:`1px solid ${C.border}`, padding:'20px 14px', overflowY:'auto' as const, background:C.surface }}>
          {isMobile && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Vista previa y publicar</div>
              <button onClick={() => setShowRightPanel(false)} style={{ background:'transparent', border:'none', fontSize:22, cursor:'pointer', color:C.textMuted, lineHeight:1 }}>✕</button>
            </div>
          )}

          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:700, marginBottom:12, color:C.textDim, textTransform:'uppercase', letterSpacing:1.5 }}>Cuenta conectada</div>
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
                style={{ width:'100%', background:'#1877f2', border:'none', color:'#fff', padding:'12px 14px', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 14px rgba(24,119,242,.30)' }}>
                <span style={{ fontSize:16 }}>📘</span> Conectar Facebook
              </button>
            )}
          </div>

          <div style={{ fontSize:10, fontWeight:700, marginBottom:12, color:C.textDim, textTransform:'uppercase', letterSpacing:1.5 }}>Vista previa</div>

          <div style={{ background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:16, overflow:'hidden', marginBottom:14, boxShadow:'0 2px 12px rgba(124,92,191,.07)' }}>
            <div style={{ background:'#F3EFF9', padding:'9px 12px', display:'flex', alignItems:'center', gap:8, borderBottom:`1px solid ${C.border}` }}>
              <div style={{ width:26, height:26, background:C.grad, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>👤</div>
              <div style={{ fontSize:12, fontWeight:600 }}>@tuempresa</div>
              <div style={{ marginLeft:'auto', fontSize:9, color:C.textMuted, background:C.surface, padding:'2px 7px', borderRadius:4, border:`1px solid ${C.border}` }}>
                {selectedPlatforms[0]==='Instagram'?'📸 IG':selectedPlatforms[0]==='WhatsApp'?'💬 WA':'📘 FB'}
              </div>
            </div>
            <div style={{ height:150, overflow:'hidden', position:'relative', background:'linear-gradient(135deg,#EDE8F8,#FEF0E7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {previewVideo
                ? <video src={previewVideo} autoPlay muted loop playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : previewImage
                  ? <img src={previewImage} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
                  : <span style={{ fontSize:32, opacity:.4 }}>🖼️</span>
              }
              {(previewImage || previewVideo) && (
                <button onClick={() => { setPreviewImage(''); setPreviewVideo(''); setSelectedVideo(''); }}
                  style={{ position:'absolute', top:6, right:6, background:'rgba(45,38,64,.65)', border:'none', color:'white', borderRadius:'50%', width:20, height:20, fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              )}
            </div>
            <div style={{ padding:11, fontSize:12, lineHeight:1.65, color:hasContent?C.text:C.textDim, minHeight:56 }}>
              {hasContent ? currentText.substring(0,100)+'...' : 'Generá contenido para ver la preview...'}
            </div>
            <div style={{ padding:'8px 12px', borderTop:`1px solid ${C.border}`, display:'flex', gap:14 }}>
              {['❤️','💬','↗️'].map(a => <span key={a} style={{ fontSize:13, cursor:'pointer' }}>{a}</span>)}
            </div>
          </div>

          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, fontWeight:700, marginBottom:12, color:C.textDim, textTransform:'uppercase', letterSpacing:1.5 }}>Publicar</div>

            {facebookConnected ? (
              <button onClick={() => hasContent && setShowPublishModal(true)} className="btn"
                style={{ width:'100%', background:hasContent?C.grad:C.border, border:'none', color:hasContent?'#fff':C.textDim, padding:'12px 14px', borderRadius:14, fontSize:13, fontWeight:700, cursor:hasContent?'pointer':'not-allowed', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:hasContent?'0 4px 14px rgba(124,92,191,.28)':'none' }}>
                🚀 Publicar directamente
              </button>
            ) : (
              <button onClick={shareNative} className="btn"
                style={{ width:'100%', background:hasContent?C.grad:C.border, border:'none', color:hasContent?'#fff':C.textDim, padding:'12px 14px', borderRadius:14, fontSize:13, fontWeight:700, cursor:hasContent?'pointer':'not-allowed', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:hasContent?'0 4px 14px rgba(124,92,191,.28)':'none' }}>
                📱 Compartir ahora
              </button>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:6 }}>
              <button onClick={() => hasContent && openShareModal('Facebook')} className="btn"
                style={{ padding:'9px 10px', borderRadius:10, border:`1.5px solid ${hasContent?'#5B9BD5':C.border}`, background:hasContent?C.blueSoft:'transparent', color:hasContent?C.blue:C.textDim, fontSize:12, cursor:hasContent?'pointer':'not-allowed', fontWeight:700 }}>
                📘 Facebook
              </button>
              <button onClick={() => hasContent && openShareModal('Instagram')} className="btn"
                style={{ padding:'9px 10px', borderRadius:10, border:`1.5px solid ${hasContent?C.rose:C.border}`, background:hasContent?C.roseSoft:'transparent', color:hasContent?C.rose:C.textDim, fontSize:12, cursor:hasContent?'pointer':'not-allowed', fontWeight:700 }}>
                📸 Instagram
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              <button onClick={() => hasContent && !uploadingImage && openShareModal('WhatsApp')} className="btn"
                style={{ padding:'9px 10px', borderRadius:10, border:`1.5px solid ${hasContent?C.green:C.border}`, background:hasContent?C.greenSoft:'transparent', color:hasContent?C.green:C.textDim, fontSize:12, cursor:(hasContent&&!uploadingImage)?'pointer':'not-allowed', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                {uploadingImage ? <span style={{ width:10, height:10, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 1s linear infinite' }} /> : '💬'}
                {uploadingImage ? 'Subiendo...' : 'WhatsApp'}
              </button>
              <button onClick={downloadImage} className="btn"
                style={{ padding:'9px 10px', borderRadius:10, border:`1.5px solid ${previewImage?C.accent:C.border}`, background:previewImage?C.accentSoft:'transparent', color:previewImage?C.accent:C.textDim, fontSize:12, cursor:previewImage?'pointer':'not-allowed', fontWeight:700 }}>
                ⬇️ Imagen
              </button>
            </div>
            {!hasContent && <div style={{ fontSize:11, color:C.textDim, textAlign:'center', marginTop:10 }}>Generá contenido para habilitar</div>}
          </div>

          <div style={{ fontSize:10, fontWeight:700, marginBottom:12, color:C.textDim, textTransform:'uppercase', letterSpacing:1.5 }}>Historial</div>
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

      {isMobile && (
        <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:'flex', zIndex:300 }}>
          {([['✍️','Copy','copy'],['🖼️','Imágenes','images'],['🎬','Videos','videos']] as [string,string,string][]).map(([icon,label,id]) => (
            <button key={id} onClick={() => { setActivePanel(id); setShowRightPanel(false); }}
              style={{ flex:1, padding:'10px 4px 8px', background:'transparent', border:'none', cursor:'pointer', display:'flex', flexDirection:'column' as const, alignItems:'center', gap:2, color:activePanel===id?C.accent:C.textMuted, fontFamily:'inherit' }}>
              <span style={{ fontSize:18 }}>{icon}</span>
              <span style={{ fontSize:9, fontWeight:activePanel===id?700:500 }}>{label}</span>
            </button>
          ))}
          <button onClick={() => { setShowRightPanel(true); }}
            style={{ flex:1, padding:'10px 4px 8px', background:'transparent', border:'none', cursor:'pointer', display:'flex', flexDirection:'column' as const, alignItems:'center', gap:2, color:showRightPanel?C.accent:C.textMuted, fontFamily:'inherit' }}>
            <span style={{ fontSize:18 }}>👁️</span>
            <span style={{ fontSize:9, fontWeight:700 }}>Preview</span>
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ flex:1, padding:'10px 4px 8px', background:'transparent', border:'none', cursor:'pointer', display:'flex', flexDirection:'column' as const, alignItems:'center', gap:2, color:C.accent, fontFamily:'inherit' }}>
            <span style={{ fontSize:18 }}>⚡</span>
            <span style={{ fontSize:9, fontWeight:700 }}>Pro</span>
          </button>
        </nav>
      )}

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(45,38,64,.50)', backdropFilter:'blur(12px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e => e.target===e.currentTarget && setShowModal(false)}>
          <div className="slide-up" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:24, padding:40, maxWidth:460, width:'100%', textAlign:'center', boxShadow:'0 32px 80px rgba(45,38,64,.18)' }}>
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
            <button onClick={async () => {
                if (!user) { window.location.href='/auth/login'; return; }
                const r = await fetch('/api/create-subscription', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({plan:'pro'}) });
                const d = await r.json();
                if (d.checkout_url) window.location.href = d.checkout_url;
                else alert('Error: ' + (d.error || 'No se pudo iniciar el pago'));
              }} className="btn"
              style={{ background:C.grad, border:'none', color:'#fff', padding:'12px 28px', borderRadius:10, fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:700, cursor:'pointer', width:'100%', marginBottom:10 }}>
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
