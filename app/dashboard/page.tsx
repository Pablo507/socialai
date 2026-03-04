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

  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoStatus, setVideoStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoQueuePosition, setVideoQueuePosition] = useState<number | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadHistory(data.user.id);
    });
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
    setTimeout(() => setShareToast(''), 3000);
  }

  async function shareNative() {
    const text = copyResult || previewContent;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        showToast('✅ Compartido exitosamente');
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      showToast('📋 Texto copiado al portapapeles');
    }
  }

  function shareToFacebook() {
    const text = encodeURIComponent(copyResult || previewContent);
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}`, '_blank', 'width=600,height=400');
    showToast('📘 Abriendo Facebook...');
  }

  function shareToInstagram() {
    // Instagram no tiene API de compartir por web, copiamos el texto y abrimos Instagram
    navigator.clipboard.writeText(copyResult || previewContent);
    window.open('https://www.instagram.com/', '_blank');
    showToast('📋 Texto copiado — pegalo en Instagram');
  }

  function shareToWhatsApp() {
    const text = encodeURIComponent(copyResult || previewContent);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    showToast('💬 Abriendo WhatsApp...');
  }

  async function downloadImage() {
    if (!previewImage) { showToast('⚠️ Seleccioná una imagen primero'); return; }
    const link = document.createElement('a');
    link.href = previewImage;
    link.download = `socialai-imagen-${Date.now()}.jpg`;
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
      if (data.images) {
        setImages(data.images);
        setUsageCount(c => c + 1);
      } else { alert('Error generando imágenes: ' + data.error); }
    } catch { alert('Error de conexión'); }
    setImageLoading(false);
  }

  async function generateVideo() {
    if (checkUsage()) return;
    if (!videoPrompt.trim()) { alert('Describí tu idea de video'); return; }
    setVideoStatus('processing');
    setVideoUrl('');
    setVideoQueuePosition(null);
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: videoPrompt }),
      });
      const data = await res.json();
      if (data.requestId) {
        setUsageCount(c => c + 1);
        startPolling(data.requestId);
      } else { setVideoStatus('failed'); alert('Error: ' + data.error); }
    } catch { setVideoStatus('failed'); alert('Error de conexión'); }
  }

  function startPolling(requestId: string) {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-status?requestId=${requestId}`);
        const data = await res.json();
        if (data.status === 'completed' && data.videoUrl) {
          setVideoUrl(data.videoUrl);
          setVideoStatus('completed');
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (data.status === 'failed') {
          setVideoStatus('failed');
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else {
          setVideoQueuePosition(data.queuePosition ?? null);
        }
      } catch {}
    }, 5000);
  }

  function loadPost(post: any) {
    if (post.copy_text) {
      setCopyResult(post.copy_text);
      setPreviewContent(post.copy_text.substring(0, 150) + '...');
      setActivePanel('copy');
    }
    if (post.image_url) setPreviewImage(post.image_url);
  }

  const remaining = maxUsage - usageCount;
  const hasContent = !!(copyResult || previewImage);
  const platformColors: Record<string, string> = {
    'Facebook': '#1877f2', 'Instagram': '#e1306c', 'TikTok': '#00e5ff'
  };

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', background: '#0a0a0f', color: '#f0f0fa', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* TOAST */}
      {shareToast && (
        <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', background:'#18181f', border:'1px solid #2a2a38', borderRadius:12, padding:'10px 20px', fontSize:14, color:'#f0f0fa', zIndex:999, boxShadow:'0 4px 20px rgba(0,0,0,.5)', whiteSpace:'nowrap' }}>
          {shareToast}
        </div>
      )}

      {/* NAV */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 32px', borderBottom:'1px solid #2a2a38', background:'rgba(10,10,15,0.9)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, background:'linear-gradient(135deg,#7c5cfc,#e040fb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>SocialAI</div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ background:'rgba(124,92,252,.2)', border:'1px solid rgba(124,92,252,.4)', borderRadius:20, padding:'4px 12px', fontSize:12, color:'#7c5cfc', fontWeight:600 }}>
            ✨ {remaining} generaciones restantes
          </div>
          {user
            ? <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:14, color:'#8888aa' }}>👤 {user.email}</span>
                <button onClick={async () => { const s = createClient(); await s.auth.signOut(); window.location.href = '/auth/login'; }}
                  style={{ background:'transparent', border:'1px solid #2a2a38', color:'#8888aa', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13 }}>Salir</button>
              </div>
            : <button onClick={() => window.location.href='/auth/login'}
                style={{ background:'transparent', border:'1px solid #2a2a38', color:'#8888aa', padding:'8px 20px', borderRadius:8, cursor:'pointer', fontSize:14 }}>Iniciar sesión</button>
          }
          <button onClick={() => setShowModal(true)} style={{ background:'linear-gradient(135deg,#7c5cfc,#e040fb)', border:'none', color:'white', padding:'8px 20px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:500 }}>Upgrade Pro</button>
        </div>
      </nav>

      {/* USAGE BAR */}
      <div style={{ padding:'10px 32px', background:'#111118', borderBottom:'1px solid #2a2a38', display:'flex', alignItems:'center', gap:16 }}>
        <span style={{ fontSize:12, color:'#8888aa' }}>Uso gratuito</span>
        <div style={{ flex:1, height:6, background:'#2a2a38', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${(usageCount/maxUsage)*100}%`, background:'linear-gradient(90deg,#7c5cfc,#e040fb)', borderRadius:3, transition:'width .5s' }} />
        </div>
        <span style={{ fontSize:12, color:'#8888aa' }}><strong style={{ color:'#e040fb' }}>{usageCount}</strong> / {maxUsage}</span>
      </div>

      {/* LAYOUT */}
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 280px', minHeight:'calc(100vh - 100px)' }}>

        {/* SIDEBAR */}
        <aside style={{ borderRight:'1px solid #2a2a38', padding:'24px 12px' }}>
          {[['✍️','Copywriting','copy'],['🖼️','Imágenes','images'],['🎬','Videos','videos'],['📅','Calendario','calendar']].map(([icon,label,id]) => (
            <button key={id} onClick={() => setActivePanel(id)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, cursor:'pointer', color: activePanel===id ? '#7c5cfc' : '#8888aa', fontSize:14, border: activePanel===id ? '1px solid rgba(124,92,252,.25)' : '1px solid transparent', background: activePanel===id ? 'rgba(124,92,252,.12)' : 'transparent', width:'100%', textAlign:'left', fontFamily:'inherit', marginBottom:2 }}>
              <span>{icon}</span> {label}
            </button>
          ))}
          <div style={{ borderTop:'1px solid #2a2a38', marginTop:16, paddingTop:16 }}>
            <button onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, cursor:'pointer', color:'#8888aa', fontSize:14, border:'1px solid transparent', background:'transparent', width:'100%', textAlign:'left', fontFamily:'inherit' }}>
              <span>⚡</span> Upgrade Pro
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ padding:32, overflowY:'auto' }}>

          {/* COPYWRITING */}
          {activePanel === 'copy' && (
            <div>
              <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, marginBottom:6 }}>✍️ Generador de Copywriting</h1>
              <p style={{ color:'#8888aa', fontSize:14, marginBottom:24 }}>Crea textos persuasivos para cualquier red social con IA</p>
              <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:16, padding:24, marginBottom:20 }}>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Red social destino</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {[['📘 Facebook','Facebook'],['📸 Instagram','Instagram'],['🎵 TikTok','TikTok']].map(([label, name]) => {
                      const active = selectedPlatforms.includes(name);
                      const color = platformColors[name];
                      return <button key={name} onClick={() => togglePlatform(name)}
                        style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${active ? color : '#2a2a38'}`, background: active ? `${color}22` : 'transparent', color: active ? color : '#8888aa', fontSize:13, cursor:'pointer' }}>{label}</button>;
                    })}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Industria</label>
                    <select value={industry} onChange={e => setIndustry(e.target.value)}
                      style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14 }}>
                      {['Restaurante / Gastronomía','Moda y Ropa','Fitness y Salud','Tecnología','E-commerce','Inmobiliaria','Turismo','Educación'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Objetivo</label>
                    <select value={goal} onChange={e => setGoal(e.target.value)}
                      style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14 }}>
                      {['Vender un producto','Generar engagement','Dar a conocer la marca','Promoción especial','Conseguir seguidores','Anunciar evento'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Tono</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {[['😊','Amigable'],['💼','Profesional'],['😂','Divertido'],['🔥','Urgente'],['✨','Inspirador']].map(([emoji, name]) => (
                      <button key={name} onClick={() => setTone(name)}
                        style={{ padding:'6px 14px', borderRadius:8, border: tone===name ? '1px solid #7c5cfc' : '1px solid #2a2a38', background: tone===name ? 'rgba(124,92,252,.15)' : 'transparent', color: tone===name ? '#7c5cfc' : '#8888aa', fontSize:12, cursor:'pointer' }}>
                        {emoji} {name}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Describe tu producto o idea</label>
                  <textarea value={copyPrompt} onChange={e => setCopyPrompt(e.target.value)}
                    style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14, resize:'vertical', fontFamily:'inherit', outline:'none' }}
                    rows={3} placeholder="Ej: Auriculares Sony negros con carga rápida, precio $2500..." />
                </div>
                <button onClick={generateCopy} disabled={copyLoading}
                  style={{ width:'100%', background:'linear-gradient(135deg,#7c5cfc,#e040fb)', border:'none', color:'white', padding:14, borderRadius:12, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, cursor:'pointer', opacity: copyLoading ? 0.7 : 1 }}>
                  {copyLoading ? '⏳ Generando copy con IA...' : '⚡ Generar Copy con IA'}
                </button>
              </div>
              {copyResult && (
                <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid #2a2a38', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#18181f' }}>
                    <span style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:600 }}>✅ Contenido generado</span>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => { navigator.clipboard.writeText(copyResult); showToast('📋 Copiado'); }} style={{ padding:'5px 12px', borderRadius:6, border:'1px solid #2a2a38', background:'transparent', color:'#8888aa', fontSize:12, cursor:'pointer' }}>📋 Copiar</button>
                      <button onClick={generateCopy} style={{ padding:'5px 12px', borderRadius:6, border:'1px solid #2a2a38', background:'transparent', color:'#8888aa', fontSize:12, cursor:'pointer' }}>🔄 Regenerar</button>
                    </div>
                  </div>
                  <div style={{ padding:20 }}>
                    <pre style={{ fontSize:14, lineHeight:1.7, color:'#f0f0fa', whiteSpace:'pre-wrap', fontFamily:'inherit', margin:0 }}>{copyResult}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* IMAGES */}
          {activePanel === 'images' && (
            <div>
              <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, marginBottom:6 }}>🖼️ Generador de Imágenes</h1>
              <p style={{ color:'#8888aa', fontSize:14, marginBottom:24 }}>Crea imágenes únicas con IA</p>
              <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:16, padding:24, marginBottom:20 }}>
                <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Descripción</label>
                <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)}
                  style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14, resize:'vertical', fontFamily:'inherit', outline:'none', marginBottom:14 }}
                  rows={3} placeholder="Ej: niño feliz comiendo helado, parque soleado..." />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Formato</label>
                    <select style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14 }}>
                      <option>📱 Cuadrado (1:1)</option><option>📱 Vertical (9:16)</option><option>🖥️ Horizontal (16:9)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Estilo</label>
                    <select style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14 }}>
                      <option>Fotografía realista</option><option>Ilustración digital</option><option>Minimalista</option><option>3D Render</option>
                    </select>
                  </div>
                </div>
                <button onClick={generateImages} disabled={imageLoading}
                  style={{ width:'100%', background:'linear-gradient(135deg,#7c5cfc,#e040fb)', border:'none', color:'white', padding:14, borderRadius:12, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, cursor:'pointer', opacity: imageLoading ? 0.7 : 1 }}>
                  {imageLoading ? '⏳ Generando imágenes (~10s)...' : '🎨 Generar 4 Imágenes'}
                </button>
              </div>
              {images.length > 0 && (
                <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid #2a2a38', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#18181f' }}>
                    <span style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:600 }}>✅ Imágenes generadas</span>
                    <span style={{ fontSize:11, color:'#8888aa' }}>👆 Click para previsualizar</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:20 }}>
                    {images.map((src, i) => (
                      <div key={i} onClick={() => setPreviewImage(src)}
                        style={{ background:'#18181f', border: previewImage===src ? '2px solid #7c5cfc' : '1px solid #2a2a38', borderRadius:12, overflow:'hidden', cursor:'pointer', boxShadow: previewImage===src ? '0 0 12px rgba(124,92,252,.4)' : 'none' }}>
                        <img src={src} alt={`Versión ${String.fromCharCode(65+i)}`} style={{ width:'100%', height:160, objectFit:'cover' }} />
                        <div style={{ padding:'8px 12px', fontSize:12, color: previewImage===src ? '#7c5cfc' : '#8888aa', fontWeight: previewImage===src ? 600 : 400 }}>
                          {previewImage===src ? '✓ ' : ''}Versión {String.fromCharCode(65+i)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIDEOS */}
          {activePanel === 'videos' && (
            <div>
              <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, marginBottom:6 }}>🎬 Generador de Videos</h1>
              <p style={{ color:'#8888aa', fontSize:14, marginBottom:24 }}>Crea videos cortos para TikTok, Reels e Instagram Stories con IA</p>
              <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:16, padding:24, marginBottom:20 }}>
                <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Describe tu video</label>
                <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)}
                  style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14, resize:'vertical', fontFamily:'inherit', outline:'none', marginBottom:14 }}
                  rows={3} placeholder="Ej: producto de belleza girando sobre fondo blanco con efecto de luz..." />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Formato</label>
                    <select style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14 }}>
                      <option>📱 Vertical 9:16 (Reels/TikTok)</option><option>⬜ Cuadrado 1:1</option><option>🖥️ Horizontal 16:9</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Duración</label>
                    <select style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14 }}>
                      <option>5 segundos</option><option>10 segundos</option>
                    </select>
                  </div>
                </div>
                <button onClick={generateVideo} disabled={videoStatus==='processing'}
                  style={{ width:'100%', background:'linear-gradient(135deg,#7c5cfc,#e040fb)', border:'none', color:'white', padding:14, borderRadius:12, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, cursor: videoStatus==='processing' ? 'not-allowed' : 'pointer', opacity: videoStatus==='processing' ? 0.7 : 1 }}>
                  {videoStatus === 'processing' ? '⏳ Generando video...' : '🎬 Generar Video con IA'}
                </button>
              </div>
              {videoStatus === 'processing' && (
                <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:16, padding:32, textAlign:'center' }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
                  <div style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:600, marginBottom:8 }}>Generando tu video con IA...</div>
                  <div style={{ fontSize:13, color:'#8888aa', marginBottom:16 }}>
                    {videoQueuePosition !== null ? `Posición en cola: #${videoQueuePosition} · ` : ''}puede tardar 30-60 segundos
                  </div>
                  <div style={{ height:4, background:'#2a2a38', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:'60%', background:'linear-gradient(90deg,#7c5cfc,#e040fb)', borderRadius:2 }} />
                  </div>
                </div>
              )}
              {videoStatus === 'completed' && videoUrl && (
                <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid #2a2a38', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#18181f' }}>
                    <span style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:600 }}>✅ Video generado</span>
                    <a href={videoUrl} download target="_blank" rel="noreferrer"
                      style={{ padding:'5px 12px', borderRadius:6, border:'1px solid #2a2a38', background:'transparent', color:'#8888aa', fontSize:12, cursor:'pointer', textDecoration:'none' }}>⬇️ Descargar MP4</a>
                  </div>
                  <div style={{ padding:20 }}>
                    <video controls style={{ width:'100%', borderRadius:10, maxHeight:400 }}>
                      <source src={videoUrl} type="video/mp4" />
                    </video>
                  </div>
                </div>
              )}
              {videoStatus === 'failed' && (
                <div style={{ background:'rgba(255,50,50,.08)', border:'1px solid rgba(255,50,50,.2)', borderRadius:16, padding:24, textAlign:'center' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>❌</div>
                  <div style={{ fontSize:14, color:'#ff6666' }}>Error generando el video. Intentá de nuevo.</div>
                  <button onClick={() => setVideoStatus('idle')} style={{ marginTop:12, padding:'8px 20px', borderRadius:8, border:'1px solid #2a2a38', background:'transparent', color:'#8888aa', cursor:'pointer', fontSize:13 }}>Reintentar</button>
                </div>
              )}
            </div>
          )}

          {/* CALENDAR */}
          {activePanel === 'calendar' && (
            <div>
              <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:700, marginBottom:6 }}>📅 Calendario Editorial</h1>
              <p style={{ color:'#8888aa', fontSize:14, marginBottom:24 }}>Planifica y programa tus publicaciones</p>
              <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:16, padding:24 }}>
                <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, marginBottom:16 }}>Marzo 2026</h2>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                  {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                    <div key={d} style={{ textAlign:'center', fontSize:11, color:'#8888aa', padding:'6px 0', fontWeight:600 }}>{d}</div>
                  ))}
                  {[1,2,3,4,5,6,7].map(d => (
                    <div key={d} style={{ background: d===1 ? 'rgba(124,92,252,.08)' : '#18181f', border: d===1 ? '1px solid #7c5cfc' : '1px solid #2a2a38', borderRadius:8, minHeight:72, padding:6, cursor:'pointer' }}>
                      <div style={{ fontSize:12, color: d===1 ? '#7c5cfc' : '#8888aa', fontWeight: d===1 ? 700 : 500 }}>{d}</div>
                    </div>
                  ))}
                  {Array.from({length:24},(_,i)=>i+8).map(d => (
                    <div key={d} style={{ background:'#18181f', border:'1px solid #2a2a38', borderRadius:8, minHeight:72, padding:6, cursor:'pointer' }}>
                      <div style={{ fontSize:12, color:'#8888aa' }}>{d}</div>
                      {d===10 && <div style={{ background:'rgba(225,48,108,.2)', borderRadius:4, padding:'2px 5px', fontSize:10, color:'#f0f0fa', marginTop:2 }}>📸 Post</div>}
                      {d===15 && <div style={{ background:'rgba(24,119,242,.2)', borderRadius:4, padding:'2px 5px', fontSize:10, color:'#f0f0fa', marginTop:2 }}>📘 Reel</div>}
                      {d===20 && <div style={{ background:'rgba(0,229,255,.15)', borderRadius:4, padding:'2px 5px', fontSize:10, color:'#f0f0fa', marginTop:2 }}>🎵 TikTok</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT PANEL */}
        <aside style={{ borderLeft:'1px solid #2a2a38', padding:'24px 16px', overflowY:'auto' }}>
          <div style={{ fontSize:11, fontWeight:700, marginBottom:16, color:'#8888aa', textTransform:'uppercase', letterSpacing:1 }}>Vista previa</div>

          <div style={{ background:'#18181f', border:'1px solid #2a2a38', borderRadius:16, overflow:'hidden', marginBottom:12 }}>
            <div style={{ background:'#111118', padding:'10px 12px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid #2a2a38' }}>
              <div style={{ width:28, height:28, background:'linear-gradient(135deg,#7c5cfc,#e040fb)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>👤</div>
              <div style={{ fontSize:13, fontWeight:600 }}>@tuempresa</div>
              <div style={{ marginLeft:'auto', fontSize:10, color:'#8888aa', background:'#0a0a0f', padding:'2px 8px', borderRadius:4 }}>
                {selectedPlatforms[0] === 'Instagram' ? '📸 IG' : selectedPlatforms[0] === 'TikTok' ? '🎵 TT' : '📘 FB'}
              </div>
            </div>
            <div style={{ height:160, overflow:'hidden', position:'relative', background:'linear-gradient(135deg,rgba(124,92,252,.15),rgba(224,64,251,.1))', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {previewImage
                ? <img src={previewImage} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="Vista previa" />
                : <span style={{ fontSize:36 }}>🖼️</span>
              }
              {previewImage && (
                <button onClick={() => setPreviewImage('')}
                  style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,.6)', border:'none', color:'white', borderRadius:'50%', width:22, height:22, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              )}
            </div>
            <div style={{ padding:12, fontSize:12, lineHeight:1.6, color: hasContent ? '#f0f0fa' : '#4a4a5a', minHeight:60 }}>
              {hasContent ? (copyResult || previewContent).substring(0, 120) + '...' : 'Generá contenido para ver la preview...'}
            </div>
            <div style={{ padding:'8px 12px', borderTop:'1px solid #2a2a38', display:'flex', gap:12 }}>
              {['❤️','💬','↗️'].map(a => <span key={a} style={{ fontSize:12, color:'#8888aa' }}>{a}</span>)}
            </div>
          </div>

          {/* PUBLISH BUTTONS */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, marginBottom:10, color:'#8888aa', textTransform:'uppercase', letterSpacing:1 }}>Publicar</div>

            <button onClick={shareNative}
              style={{ width:'100%', background: hasContent ? 'linear-gradient(135deg,#7c5cfc,#e040fb)' : '#2a2a38', border:'none', color: hasContent ? 'white' : '#4a4a5a', padding:'11px 14px', borderRadius:10, fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:700, cursor: hasContent ? 'pointer' : 'not-allowed', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              📱 Compartir ahora
            </button>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:6 }}>
              <button onClick={shareToFacebook}
                style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #1877f233', background:'#1877f211', color: hasContent ? '#1877f2' : '#4a4a5a', fontSize:12, cursor: hasContent ? 'pointer' : 'not-allowed', fontWeight:600 }}>
                📘 Facebook
              </button>
              <button onClick={shareToInstagram}
                style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #e1306c33', background:'#e1306c11', color: hasContent ? '#e1306c' : '#4a4a5a', fontSize:12, cursor: hasContent ? 'pointer' : 'not-allowed', fontWeight:600 }}>
                📸 Instagram
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              <button onClick={shareToWhatsApp}
                style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #25d36633', background:'#25d36611', color: hasContent ? '#25d366' : '#4a4a5a', fontSize:12, cursor: hasContent ? 'pointer' : 'not-allowed', fontWeight:600 }}>
                💬 WhatsApp
              </button>
              <button onClick={downloadImage}
                style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #2a2a38', background:'transparent', color: previewImage ? '#8888aa' : '#4a4a5a', fontSize:12, cursor: previewImage ? 'pointer' : 'not-allowed', fontWeight:600 }}>
                ⬇️ Imagen
              </button>
            </div>

            {!hasContent && (
              <div style={{ fontSize:11, color:'#4a4a5a', textAlign:'center', marginTop:8 }}>
                Generá un copy o imagen para publicar
              </div>
            )}

            {/* NOTA INSTAGRAM */}
            {selectedPlatforms.includes('Instagram') && hasContent && (
              <div style={{ marginTop:10, background:'rgba(225,48,108,.08)', border:'1px solid rgba(225,48,108,.2)', borderRadius:8, padding:'8px 12px', fontSize:11, color:'#e1306c', lineHeight:1.5 }}>
                📸 Instagram: el texto se copia automáticamente. Solo pegalo al abrir la app.
              </div>
            )}
          </div>

          {/* HISTORIAL */}
          <div style={{ fontSize:11, fontWeight:700, marginBottom:12, color:'#8888aa', textTransform:'uppercase', letterSpacing:1 }}>Historial</div>
          {history.length === 0 && (
            <div style={{ fontSize:12, color:'#4a4a5a', textAlign:'center', padding:'16px 0' }}>Sin historial aún</div>
          )}
          {history.slice(0, 8).map((post) => (
            <div key={post.id} onClick={() => loadPost(post)}
              style={{ background:'#18181f', border:'1px solid #2a2a38', borderRadius:10, padding:12, marginBottom:8, cursor:'pointer' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, fontWeight:600, background: post.image_url ? '#e040fb33' : '#7c5cfc33', color: post.image_url ? '#e040fb' : '#7c5cfc' }}>
                  {post.image_url ? 'Imagen' : 'Copy'}
                </span>
                <span style={{ fontSize:11, color:'#8888aa', marginLeft:'auto' }}>
                  {new Date(post.created_at).toLocaleDateString('es-UY', { day:'2-digit', month:'short' })}
                </span>
              </div>
              {post.image_url && (
                <img src={post.image_url} alt="" style={{ width:'100%', height:50, objectFit:'cover', borderRadius:6, marginBottom:6 }} />
              )}
              <div style={{ fontSize:12, color:'#8888aa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {post.copy_text ? post.copy_text.substring(0, 45) + '...' : post.prompt}
              </div>
            </div>
          ))}
        </aside>
      </div>

      {/* PAYWALL MODAL */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(8px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:24, padding:40, maxWidth:480, width:'90%', textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🚀</div>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, marginBottom:10, background:'linear-gradient(135deg,#7c5cfc,#e040fb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Potencia tu contenido
            </h2>
            <p style={{ fontSize:14, color:'#8888aa', lineHeight:1.6, marginBottom:24 }}>
              {remaining === 0 ? 'Alcanzaste el límite gratuito. Suscríbete para continuar.' : `Te quedan ${remaining} generaciones. Suscríbete para tener más.`}
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
              <div style={{ background:'#18181f', border:'1px solid #2a2a38', borderRadius:14, padding:16 }}>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, marginBottom:4 }}>Básico</div>
                <div style={{ fontSize:24, fontWeight:800, color:'#7c5cfc' }}>$360 <span style={{ fontSize:13, color:'#8888aa', fontWeight:400 }}>UYU/mes</span></div>
                <div style={{ fontSize:12, color:'#8888aa', marginTop:6 }}>✓ 100 generaciones/mes</div>
              </div>
              <div style={{ background:'linear-gradient(135deg,rgba(124,92,252,.15),rgba(224,64,251,.15))', border:'1px solid #7c5cfc', borderRadius:14, padding:16 }}>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:15, fontWeight:700, marginBottom:4, color:'#7c5cfc' }}>⭐ Pro</div>
                <div style={{ fontSize:24, fontWeight:800, color:'#e040fb' }}>$1150 <span style={{ fontSize:13, color:'#8888aa', fontWeight:400 }}>UYU/mes</span></div>
                <div style={{ fontSize:12, color:'#8888aa', marginTop:6 }}>✓ Ilimitado + Videos</div>
              </div>
            </div>
            <button onClick={() => setShowModal(false)} style={{ background:'linear-gradient(135deg,#7c5cfc,#e040fb)', border:'none', color:'white', padding:'12px 32px', borderRadius:10, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, cursor:'pointer', width:'100%', marginBottom:10 }}>
              💙 Suscribirse con Mercado Pago
            </button>
            <button onClick={() => setShowModal(false)} style={{ background:'transparent', border:'1px solid #2a2a38', color:'#8888aa', padding:'10px 24px', borderRadius:8, cursor:'pointer', fontSize:14 }}>
              {remaining > 0 ? `Continuar gratis (${remaining} restantes)` : 'Cerrar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
