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
      if (params.get('success') === 'connected') {
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
    if (!user) return showToast('⚠️ Inicia sesión');
    window.location.href = `/api/auth/facebook?state=${user.id}`;
  }

  // ✅ CORRECCIÓN DEL ERROR DE COMPILACIÓN
  async function publishDirect(platform: 'facebook' | 'instagram') {
    if (!user) return;
    setPublishing(true);
    try {
      let imageUrl: string | null = previewImage;

      if (previewImage?.startsWith('data:')) {
        showToast('⏳ Procesando imagen...');
        const uploadedUrl = await uploadImageForSharing();
        if (!uploadedUrl) {
            showToast('❌ Error al procesar imagen');
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
          imageUrl: imageUrl, // Aquí ya está garantizado que es string o la URL original
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (data.success) showToast(`✅ ¡Publicado en ${platform}!`);
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

  const C = {
    bg: '#FAF8F5', surface: '#FFFFFF', border: '#E8E0F0', text: '#2D2640',
    textMuted: '#7B6E99', accent: '#7C5CBF', accentSoft: '#EDE8F8',
    grad: 'linear-gradient(135deg, #7C5CBF, #B07FE8)',
  };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:C.bg, color:C.text, minHeight:'100vh' }}>
      {shareToast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:C.text, borderRadius:12, padding:'12px 22px', color:'#fff', zIndex:999 }}>
          {shareToast}
        </div>
      )}

      {showPublishModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', padding:30, borderRadius:20, maxWidth:400, width:'90%' }}>
            <h3 style={{ marginBottom:20 }}>🚀 Publicar ahora</h3>
            <button onClick={() => publishDirect('facebook')} disabled={publishing} style={{ width:'100%', padding:12, background:'#1877f2', color:'#fff', border:'none', borderRadius:10, marginBottom:10, cursor:'pointer' }}>
               {publishing ? 'Procesando...' : 'Facebook'}
            </button>
            <button onClick={() => setShowPublishModal(false)} style={{ width:'100%', marginTop:10, background:'none', border:'none', color:C.textMuted, cursor:'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 32px', borderBottom:`1px solid ${C.border}`, background:C.surface, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontSize:22, fontWeight:800, background:C.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>SocialAI</div>
        <div style={{ background:C.accentSoft, borderRadius:20, padding:'5px 14px', fontSize:12, color:C.accent, fontWeight:700 }}>
          ✦ {maxUsage - usageCount} créditos
        </div>
      </nav>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr 300px', minHeight:'calc(100vh - 70px)' }}>
        <aside style={{ borderRight:`1px solid ${C.border}`, padding:20, background:C.surface }}>
           <button style={{ width:'100%', padding:12, borderRadius:10, background:C.accentSoft, color:C.accent, border:'none', fontWeight:700 }}>✍️ Copy</button>
        </aside>

        <main style={{ padding:28 }}>
          <h1 style={{ fontSize:24, marginBottom:20 }}>Panel de Control</h1>
          <textarea 
            value={copyPrompt} 
            onChange={e => setCopyPrompt(e.target.value)} 
            style={{ width:'100%', minHeight:150, borderRadius:12, border:`1px solid ${C.border}`, padding:15 }} 
            placeholder="Describe tu publicación..."
          />
        </main>

        <aside style={{ borderLeft:`1px solid ${C.border}`, padding:20, background:'#fff' }}>
          <div style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', marginBottom:20 }}>
            {previewImage && <img src={previewImage} style={{ width:'100%' }} />}
            <div style={{ padding:15, fontSize:13 }}>{copyResult || previewContent}</div>
          </div>

          {facebookConnected ? (
            <button onClick={() => setShowPublishModal(true)} style={{ width:'100%', padding:12, background:C.grad, color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>🚀 Publicar</button>
          ) : (
            <button onClick={connectFacebook} style={{ width:'100%', padding:12, background:'#1877f2', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>📘 Conectar Facebook</button>
          )}
        </aside>
      </div>
    </div>
  );
}
