
'use client';
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
export default function DashboardPage() {
  const [usageCount, setUsageCount] = useState(3);
  const maxUsage = 10;
  const [activePanel, setActivePanel] = useState('copy');
  const [copyResult, setCopyResult] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [showVideo, setShowVideo] = useState(false);
  const [previewContent, setPreviewContent] = useState('Tu contenido aparecerá aquí...');
  const [user, setUser] = useState<any>(null);

useEffect(() => {
  const supabase = createClient();
  supabase.auth.getUser().then(({ data }) => setUser(data.user));
}, []);
  const copies = [
    `☀️ ¡El verano llegó y nuestros precios bajaron!\n\n🌊 Aprovecha nuestra colección con hasta 30% de descuento.\n\n✅ Envío gratis en pedidos +$50\n✅ Devoluciones sin preguntas\n\nComenta "QUIERO" y te enviamos el catálogo 👇\n\n#Moda #Verano #Descuentos`,
    `💡 ¿Sabías que el 87% de las personas decide una compra viendo solo las primeras fotos?\n\nPor eso cada detalle de nuestra colección está pensado para enamorarte al primer vistazo. ✨\n\n🛒 Link en bio\n\n¿Cuál es tu favorito? 👇`,
    `POV: encontraste exactamente lo que buscabas 👀✨\n\n⚡ Solo por 48 horas\n💥 Stock limitado\n🎁 Regalo sorpresa en cada compra\n\n#TikTokModa #Outfit #GRWM`,
  ];

  function checkUsage() {
    if (usageCount >= maxUsage) { setShowModal(true); return true; }
    return false;
  }

  async function generateCopy() {
    if (checkUsage()) return;
    setCopyLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    const result = copies[Math.floor(Math.random() * copies.length)];
    setCopyResult(result);
    setPreviewContent(result.substring(0, 150) + '...');
    setUsageCount(c => c + 1);
    setCopyLoading(false);
  }

  async function generateImages() {
    if (checkUsage()) return;
    setImageLoading(true);
    await new Promise(r => setTimeout(r, 2500));
    setImages(['linear-gradient(135deg,#667eea,#764ba2)', 'linear-gradient(135deg,#f093fb,#f5576c)', 'linear-gradient(135deg,#4facfe,#00f2fe)', 'linear-gradient(135deg,#43e97b,#38f9d7)']);
    setUsageCount(c => c + 1);
    setImageLoading(false);
  }

  async function generateVideo() {
    if (checkUsage()) return;
    setVideoLoading(true);
    await new Promise(r => setTimeout(r, 3000));
    setShowVideo(true);
    setUsageCount(c => c + 1);
    setVideoLoading(false);
  }

  const remaining = maxUsage - usageCount;

  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', background: '#0a0a0f', color: '#f0f0fa', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 32px', borderBottom:'1px solid #2a2a38', background:'rgba(10,10,15,0.9)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, background:'linear-gradient(135deg,#7c5cfc,#e040fb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          SocialAI
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ background:'rgba(124,92,252,.2)', border:'1px solid rgba(124,92,252,.4)', borderRadius:20, padding:'4px 12px', fontSize:12, color:'#7c5cfc', fontWeight:600 }}>
            ✨ {remaining} generaciones restantes
          </div>
          {user 
  ? <span style={{ fontSize:14, color:'#8888aa', padding:'8px 12px' }}>👤 {user.email}</span>
  : <button onClick={() => window.location.href='/auth/login'} style={{ background:'transparent', border:'1px solid #2a2a38', color:'#8888aa', padding:'8px 20px', borderRadius:8, cursor:'pointer', fontSize:14 }}>Iniciar sesión</button>
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
                    {[['📘 Facebook','#1877f2'],['📸 Instagram','#e1306c'],['🎵 TikTok','#00e5ff']].map(([name,color]) => (
                      <button key={name} style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${color}`, background:`${color}22`, color, fontSize:13, cursor:'pointer' }}>{name}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Industria</label>
                    <select style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14 }}>
                      {['Restaurante / Gastronomía','Moda y Ropa','Fitness y Salud','Tecnología','E-commerce'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Objetivo</label>
                    <select style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14 }}>
                      {['Vender un producto','Generar engagement','Dar a conocer la marca','Promoción especial'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Tono</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {['😊 Amigable','💼 Profesional','😂 Divertido','🔥 Urgente','✨ Inspirador'].map(t => (
                      <button key={t} style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #7c5cfc', background:'rgba(124,92,252,.15)', color:'#7c5cfc', fontSize:12, cursor:'pointer' }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Describe tu producto o idea</label>
                  <textarea style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14, resize:'vertical', fontFamily:'inherit', outline:'none' }} rows={3} placeholder="Ej: Oferta de verano, 30% descuento en ropa de playa..." />
                </div>
                <button onClick={generateCopy} disabled={copyLoading} style={{ width:'100%', background:'linear-gradient(135deg,#7c5cfc,#e040fb)', border:'none', color:'white', padding:14, borderRadius:12, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, cursor:'pointer', opacity: copyLoading ? 0.7 : 1 }}>
                  {copyLoading ? '⏳ Generando...' : '⚡ Generar Copy con IA'}
                </button>
              </div>
              {copyResult && (
                <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid #2a2a38', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#18181f' }}>
                    <span style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:600 }}>✅ Contenido generado</span>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => navigator.clipboard.writeText(copyResult)} style={{ padding:'5px 12px', borderRadius:6, border:'1px solid #2a2a38', background:'transparent', color:'#8888aa', fontSize:12, cursor:'pointer' }}>📋 Copiar</button>
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
                <textarea style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14, resize:'vertical', fontFamily:'inherit', outline:'none', marginBottom:14 }} rows={3} placeholder="Ej: Producto sobre fondo minimalista, iluminación profesional..." />
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
                <button onClick={generateImages} disabled={imageLoading} style={{ width:'100%', background:'linear-gradient(135deg,#7c5cfc,#e040fb)', border:'none', color:'white', padding:14, borderRadius:12, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, cursor:'pointer', opacity: imageLoading ? 0.7 : 1 }}>
                  {imageLoading ? '⏳ Generando 4 imágenes...' : '🎨 Generar 4 Imágenes'}
                </button>
              </div>
              {images.length > 0 && (
                <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid #2a2a38', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#18181f' }}>
                    <span style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:600 }}>✅ Imágenes generadas</span>
                    <button style={{ padding:'5px 12px', borderRadius:6, border:'1px solid #2a2a38', background:'transparent', color:'#8888aa', fontSize:12, cursor:'pointer' }}>⬇️ Descargar</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:20 }}>
                    {images.map((bg, i) => (
                      <div key={i} style={{ background:'#18181f', border:'1px solid #2a2a38', borderRadius:12, overflow:'hidden', cursor:'pointer' }}>
                        <div style={{ height:160, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>🎨</div>
                        <div style={{ padding:'8px 12px', fontSize:12, color:'#8888aa' }}>Versión {String.fromCharCode(65+i)}</div>
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
              <p style={{ color:'#8888aa', fontSize:14, marginBottom:24 }}>Crea videos cortos para TikTok, Reels e Instagram Stories</p>
              <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:16, padding:24, marginBottom:20 }}>
                <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Guión / idea del video</label>
                <textarea style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14, resize:'vertical', fontFamily:'inherit', outline:'none', marginBottom:14 }} rows={3} placeholder="Ej: Tutorial de 3 pasos para el outfit perfecto..." />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Formato</label>
                    <select style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14 }}>
                      <option>📱 Short/Reel (15s)</option><option>📱 TikTok (30s)</option><option>📹 Story (15s)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:13, color:'#8888aa', marginBottom:6 }}>Música</label>
                    <select style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2a2a38', borderRadius:10, color:'#f0f0fa', padding:'10px 14px', fontSize:14 }}>
                      <option>🎵 Auto</option><option>🔥 Trending TikTok</option><option>😌 Lo-fi</option><option>⚡ Energético</option>
                    </select>
                  </div>
                </div>
                <button onClick={generateVideo} disabled={videoLoading} style={{ width:'100%', background:'linear-gradient(135deg,#7c5cfc,#e040fb)', border:'none', color:'white', padding:14, borderRadius:12, fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700, cursor:'pointer', opacity: videoLoading ? 0.7 : 1 }}>
                  {videoLoading ? '⏳ Procesando video...' : '🎬 Generar Video'}
                </button>
              </div>
              {showVideo && (
                <div style={{ background:'#111118', border:'1px solid #2a2a38', borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'14px 20px', borderBottom:'1px solid #2a2a38', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#18181f' }}>
                    <span style={{ fontFamily:'Syne,sans-serif', fontSize:14, fontWeight:600 }}>✅ Video generado</span>
                    <button style={{ padding:'5px 12px', borderRadius:6, border:'1px solid #2a2a38', background:'transparent', color:'#8888aa', fontSize:12, cursor:'pointer' }}>⬇️ Descargar MP4</button>
                  </div>
                  <div style={{ padding:40, textAlign:'center', color:'#8888aa' }}>
                    <div style={{ fontSize:48, marginBottom:8 }}>▶️</div>
                    <p>Video listo para descargar</p>
                  </div>
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
                <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:700, marginBottom:16 }}>Febrero 2026</h2>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                  {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                    <div key={d} style={{ textAlign:'center', fontSize:11, color:'#8888aa', padding:'6px 0', fontWeight:600 }}>{d}</div>
                  ))}
                  {[26,27,28,29,30,31,1].map(d => (
                    <div key={`p${d}`} style={{ background:'#18181f', border:'1px solid #2a2a38', borderRadius:8, minHeight:72, padding:6, opacity:0.35 }}>
                      <div style={{ fontSize:12, color:'#8888aa' }}>{d}</div>
                    </div>
                  ))}
                  {Array.from({length:28},(_,i)=>i+2).map(d => (
                    <div key={d} style={{ background: d===27 ? 'rgba(124,92,252,.08)' : '#18181f', border: d===27 ? '1px solid #7c5cfc' : '1px solid #2a2a38', borderRadius:8, minHeight:72, padding:6, cursor:'pointer' }}>
                      <div style={{ fontSize:12, color: d===27 ? '#7c5cfc' : '#8888aa', fontWeight: d===27 ? 700 : 500 }}>{d}</div>
                      {d===14 && <div style={{ background:'rgba(225,48,108,.2)', borderRadius:4, padding:'2px 5px', fontSize:10, color:'#f0f0fa', marginTop:2 }}>💝 San Valentín</div>}
                      {d===4 && <div style={{ background:'rgba(225,48,108,.2)', borderRadius:4, padding:'2px 5px', fontSize:10, color:'#f0f0fa', marginTop:2 }}>📸 Producto</div>}
                      {d===7 && <div style={{ background:'rgba(24,119,242,.2)', borderRadius:4, padding:'2px 5px', fontSize:10, color:'#f0f0fa', marginTop:2 }}>📘 Reel</div>}
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
          <div style={{ background:'#18181f', border:'1px solid #2a2a38', borderRadius:16, overflow:'hidden', marginBottom:16 }}>
            <div style={{ background:'#111118', padding:'10px 12px', display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid #2a2a38' }}>
              <div style={{ width:28, height:28, background:'linear-gradient(135deg,#7c5cfc,#e040fb)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>👤</div>
              <div style={{ fontSize:13, fontWeight:600 }}>@tuempresa</div>
              <div style={{ marginLeft:'auto', fontSize:10, color:'#8888aa', background:'#0a0a0f', padding:'2px 8px', borderRadius:4 }}>📘 FB</div>
            </div>
            <div style={{ height:160, background:'linear-gradient(135deg,rgba(124,92,252,.15),rgba(224,64,251,.1))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>🖼️</div>
            <div style={{ padding:12, fontSize:13, lineHeight:1.6, color:'#f0f0fa', minHeight:80 }}>{previewContent}</div>
            <div style={{ padding:'10px 12px', borderTop:'1px solid #2a2a38', display:'flex', gap:12 }}>
              {['❤️','💬','↗️'].map(a => <span key={a} style={{ fontSize:12, color:'#8888aa' }}>{a}</span>)}
            </div>
          </div>
          <div style={{ fontSize:11, fontWeight:700, marginBottom:16, color:'#8888aa', textTransform:'uppercase', letterSpacing:1 }}>Historial</div>
          {[{badge:'Copy',text:'☀️ ¡El verano llegó!',time:'hace 2h',color:'#7c5cfc'},{badge:'Imagen',text:'Producto fondo blanco',time:'ayer',color:'#e040fb'}].map(h => (
            <div key={h.badge} style={{ background:'#18181f', border:'1px solid #2a2a38', borderRadius:10, padding:12, marginBottom:8, cursor:'pointer' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ fontSize:10, padding:'2px 8px', borderRadius:4, fontWeight:600, background:`${h.color}33`, color:h.color }}>{h.badge}</span>
                <span style={{ fontSize:11, color:'#8888aa', marginLeft:'auto' }}>{h.time}</span>
              </div>
              <div style={{ fontSize:12, color:'#8888aa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.text}</div>
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
