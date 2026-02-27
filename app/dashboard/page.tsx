// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        :root{--bg:#0a0a0f;--surface:#111118;--surface2:#18181f;--border:#2a2a38;--accent:#7c5cfc;--accent2:#e040fb;--accent3:#00e5ff;--text:#f0f0fa;--text2:#8888aa}
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}
        nav{display:flex;align-items:center;justify-content:space-between;padding:16px 32px;border-bottom:1px solid var(--border);position:sticky;top:0;background:rgba(10,10,15,0.85);backdrop-filter:blur(16px);z-index:100}
        .logo{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .logo span{color:var(--accent3);-webkit-text-fill-color:var(--accent3)}
        .nav-right{display:flex;align-items:center;gap:12px}
        .badge-free{background:linear-gradient(135deg,rgba(124,92,252,.2),rgba(224,64,251,.2));border:1px solid rgba(124,92,252,.4);border-radius:20px;padding:4px 12px;font-size:12px;color:var(--accent);font-weight:600}
        .btn-login{background:transparent;border:1px solid var(--border);color:var(--text2);padding:8px 20px;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;transition:all .2s}
        .btn-login:hover{border-color:var(--accent);color:var(--text)}
        .btn-cta{background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:white;padding:8px 20px;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;transition:all .2s}
        .btn-cta:hover{opacity:.85;transform:translateY(-1px)}
        .usage-bar-container{padding:10px 32px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:16px}
        .usage-label{font-size:12px;color:var(--text2);white-space:nowrap}
        .usage-track{flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden}
        .usage-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:3px;transition:width .5s ease}
        .usage-count{font-size:12px;color:var(--text2);white-space:nowrap}
        .usage-count strong{color:var(--accent2)}
        .app-layout{display:grid;grid-template-columns:220px 1fr 320px;min-height:calc(100vh - 100px)}
        .sidebar{border-right:1px solid var(--border);padding:24px 16px;display:flex;flex-direction:column;gap:4px}
        .sidebar-section{font-size:10px;font-weight:600;letter-spacing:1.5px;color:var(--text2);padding:16px 12px 8px;text-transform:uppercase}
        .sidebar-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:all .15s;color:var(--text2);font-size:14px;border:1px solid transparent;background:none;width:100%;text-align:left;font-family:'DM Sans',sans-serif}
        .sidebar-item:hover{background:var(--surface2);color:var(--text)}
        .sidebar-item.active{background:rgba(124,92,252,.12);color:var(--accent);border-color:rgba(124,92,252,.25)}
        .sidebar-item .icon{font-size:16px;width:20px;text-align:center}
        .badge-new{margin-left:auto;background:var(--accent2);color:white;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:700}
        .main-content{padding:32px;overflow-y:auto}
        .tabs{display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:12px;margin-bottom:28px;border:1px solid var(--border);width:fit-content}
        .tab{padding:8px 20px;border-radius:9px;border:none;background:transparent;color:var(--text2);cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;transition:all .2s;display:flex;align-items:center;gap:6px}
        .tab.active{background:var(--accent);color:white}
        .tab:hover:not(.active){color:var(--text);background:var(--surface2)}
        .section-title{font-family:'Syne',sans-serif;font-size:26px;font-weight:700;color:var(--text);margin-bottom:6px}
        .section-subtitle{font-size:14px;color:var(--text2);margin-bottom:24px}
        .card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:20px}
        .card-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px}
        label{display:block;font-size:13px;color:var(--text2);margin-bottom:6px;font-weight:500}
        .input,textarea,select{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:10px;color:var(--text);padding:10px 14px;font-family:'DM Sans',sans-serif;font-size:14px;margin-bottom:14px;outline:none;transition:border-color .2s;resize:vertical}
        .input:focus,textarea:focus,select:focus{border-color:var(--accent)}
        select option{background:var(--surface2)}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .platform-selector{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
        .platform-pill{padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--text2);font-size:13px;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:6px}
        .platform-pill.active-fb{background:rgba(24,119,242,.15);border-color:#1877f2;color:#1877f2}
        .platform-pill.active-ig{background:rgba(225,48,108,.15);border-color:#e1306c;color:#e1306c}
        .platform-pill.active-tt{background:rgba(0,229,255,.15);border-color:#00e5ff;color:#00e5ff}
        .platform-pill:hover{border-color:var(--accent);color:var(--text)}
        .btn-generate{width:100%;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:white;padding:14px;border-radius:12px;font-family:'Syne',sans-serif;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:.5px}
        .btn-generate:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(124,92,252,.4)}
        .btn-generate.loading{opacity:.7;pointer-events:none}
        .output-container{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:20px}
        .output-header{padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--surface2)}
        .output-header-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:600}
        .output-actions{display:flex;gap:8px}
        .btn-sm{padding:5px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text2);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;gap:4px}
        .btn-sm:hover{border-color:var(--accent);color:var(--accent)}
        .btn-sm.accent-btn{background:rgba(124,92,252,.15);border-color:var(--accent);color:var(--accent)}
        .output-body{padding:20px;min-height:120px}
        .output-text{font-size:14px;line-height:1.7;color:var(--text);white-space:pre-wrap}
        .style-options{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
        .style-pill{padding:6px 14px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text2);font-size:12px;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
        .style-pill.active{background:rgba(124,92,252,.15);border-color:var(--accent);color:var(--accent)}
        .style-pill:hover:not(.active){border-color:var(--border);color:var(--text);background:var(--surface2)}
        .tab-panel{display:none}
        .tab-panel.active{display:block}
        .image-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:20px}
        .image-card{background:var(--surface2);border:1px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer;transition:all .2s;position:relative}
        .image-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
        .image-placeholder{width:100%;height:160px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px}
        .image-label{padding:8px 12px;font-size:12px;color:var(--text2)}
        .image-card .select-overlay{position:absolute;top:8px;right:8px;width:24px;height:24px;background:var(--accent);border-radius:50%;display:none;align-items:center;justify-content:center;color:white;font-size:12px}
        .image-card.selected .select-overlay{display:flex}
        .image-card.selected{border-color:var(--accent)}
        .calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
        .cal-day-header{text-align:center;font-size:11px;color:var(--text2);padding:6px 0;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
        .cal-day{background:var(--surface2);border:1px solid var(--border);border-radius:8px;min-height:72px;padding:6px;cursor:pointer;transition:border-color .2s}
        .cal-day:hover{border-color:var(--accent)}
        .cal-day.today{border-color:var(--accent);background:rgba(124,92,252,.08)}
        .cal-day.other-month{opacity:.35}
        .cal-day-num{font-size:12px;color:var(--text2);margin-bottom:4px;font-weight:500}
        .cal-day.today .cal-day-num{color:var(--accent);font-weight:700}
        .cal-event{background:linear-gradient(135deg,rgba(124,92,252,.3),rgba(224,64,251,.3));border:1px solid rgba(124,92,252,.4);border-radius:4px;padding:2px 5px;font-size:10px;color:var(--text);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cal-event.fb{background:rgba(24,119,242,.2);border-color:rgba(24,119,242,.4)}
        .cal-event.ig{background:rgba(225,48,108,.2);border-color:rgba(225,48,108,.4)}
        .cal-event.tt{background:rgba(0,229,255,.15);border-color:rgba(0,229,255,.3)}
        .right-panel{border-left:1px solid var(--border);padding:24px 16px;overflow-y:auto}
        .panel-title{font-size:11px;font-weight:700;margin-bottom:16px;color:var(--text2);text-transform:uppercase;letter-spacing:1px}
        .preview-phone{background:var(--surface2);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-bottom:16px}
        .preview-phone-header{background:var(--surface);padding:10px 12px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border)}
        .preview-avatar{width:28px;height:28px;background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px}
        .preview-username{font-size:13px;font-weight:600}
        .preview-platform-tag{margin-left:auto;font-size:10px;color:var(--text2);background:var(--bg);padding:2px 8px;border-radius:4px}
        .preview-image{width:100%;height:180px;background:linear-gradient(135deg,rgba(124,92,252,.15),rgba(224,64,251,.1),rgba(0,229,255,.1));display:flex;align-items:center;justify-content:center;font-size:40px}
        .preview-content{padding:12px;font-size:13px;line-height:1.6;color:var(--text);min-height:80px}
        .preview-footer{padding:10px 12px;border-top:1px solid var(--border);display:flex;gap:12px}
        .preview-action{font-size:12px;color:var(--text2);display:flex;align-items:center;gap:4px}
        .history-item{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer;transition:border-color .2s}
        .history-item:hover{border-color:var(--accent)}
        .history-item-top{display:flex;align-items:center;gap:8px;margin-bottom:6px}
        .history-type-badge{font-size:10px;padding:2px 8px;border-radius:4px;font-weight:600;background:rgba(124,92,252,.2);color:var(--accent)}
        .history-type-badge.img{background:rgba(224,64,251,.2);color:var(--accent2)}
        .history-date{font-size:11px;color:var(--text2);margin-left:auto}
        .history-preview{font-size:12px;color:var(--text2);line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .loading-dots{display:flex;gap:4px;align-items:center}
        .loading-dot{width:6px;height:6px;background:white;border-radius:50%;animation:bounce .6s infinite alternate}
        .loading-dot:nth-child(2){animation-delay:.2s}
        .loading-dot:nth-child(3){animation-delay:.4s}
        @keyframes bounce{from{transform:translateY(0);opacity:.4}to{transform:translateY(-4px);opacity:1}}
        .modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);z-index:500;align-items:center;justify-content:center}
        .modal-overlay.show{display:flex}
        .modal{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:40px;max-width:480px;width:90%;text-align:center;animation:slideUp .3s ease}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        .modal-title{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;margin-bottom:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .modal-desc{font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:24px}
        .plans{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
        .plan-card{background:var(--surface2);border:1px solid var(--border);border-radius:14px;padding:16px;cursor:pointer;transition:all .2s}
        .plan-card.featured{background:linear-gradient(135deg,rgba(124,92,252,.15),rgba(224,64,251,.15));border-color:var(--accent)}
        .plan-card:hover{transform:translateY(-2px)}
        .plan-name{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;margin-bottom:4px}
        .plan-price{font-size:24px;font-weight:800;color:var(--accent)}
        .plan-price span{font-size:13px;color:var(--text2);font-weight:400}
        .plan-feature{font-size:12px;color:var(--text2);margin-top:6px}
        .modal-close{background:transparent;border:1px solid var(--border);color:var(--text2);padding:10px 24px;border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;transition:all .2s}
        .modal-close:hover{border-color:var(--text2);color:var(--text)}
        .btn-upgrade-cta{background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:white;padding:12px 32px;border-radius:10px;font-family:'Syne',sans-serif;font-size:16px;font-weight:700;cursor:pointer;width:100%;margin-bottom:10px;transition:all .2s}
        .btn-upgrade-cta:hover{opacity:.85}
        @media(max-width:1100px){.app-layout{grid-template-columns:1fr}.sidebar,.right-panel{display:none}}
      `}</style>

      <nav>
        <div className="logo">Social<span>AI</span></div>
        <div className="nav-right">
          <div className="badge-free">✨ <span id="remainingBadge">7</span> generaciones restantes</div>
          <button className="btn-login" onClick={() => (document.getElementById('paywallModal') as any).classList.add('show')}>Iniciar sesión</button>
          <button className="btn-cta" onClick={() => (document.getElementById('paywallModal') as any).classList.add('show')}>Upgrade Pro</button>
        </div>
      </nav>

      <div className="usage-bar-container">
        <span className="usage-label">Uso gratuito</span>
        <div className="usage-track"><div className="usage-fill" id="usageFill" style={{width:'30%'}}></div></div>
        <span className="usage-count"><strong id="usageNum">3</strong> / 10 generaciones usadas</span>
      </div>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-section">Crear</div>
          <button className="sidebar-item active" onClick={(e) => switchSidebarClient(e.currentTarget,'copy')}>
            <span className="icon">✍️</span> Copywriting
          </button>
          <button className="sidebar-item" onClick={(e) => switchSidebarClient(e.currentTarget,'images')}>
            <span className="icon">🖼️</span> Imágenes
          </button>
          <button className="sidebar-item" onClick={(e) => switchSidebarClient(e.currentTarget,'videos')}>
            <span className="icon">🎬</span> Videos <span className="badge-new">NEW</span>
          </button>
          <div className="sidebar-section">Gestión</div>
          <button className="sidebar-item" onClick={(e) => switchSidebarClient(e.currentTarget,'calendar')}>
            <span className="icon">📅</span> Calendario
          </button>
          <div className="sidebar-section">Cuenta</div>
          <button className="sidebar-item" onClick={() => (document.getElementById('paywallModal') as any).classList.add('show')}>
            <span className="icon">⚡</span> Upgrade Pro
          </button>
        </aside>

        <main className="main-content">
          {/* COPY */}
          <div className="tab-panel active" id="copy">
            <h1 className="section-title">✍️ Generador de Copywriting</h1>
            <p className="section-subtitle">Crea textos persuasivos para cualquier red social con IA</p>
            <div className="card">
              <div className="card-title">🎯 Configuración del contenido</div>
              <label>Red social destino</label>
              <div className="platform-selector">
                <button className="platform-pill active-fb" onClick={(e) => e.currentTarget.classList.toggle('active-fb')}>📘 Facebook</button>
                <button className="platform-pill active-ig" onClick={(e) => e.currentTarget.classList.toggle('active-ig')}>📸 Instagram</button>
                <button className="platform-pill" onClick={(e) => e.currentTarget.classList.toggle('active-tt')}>🎵 TikTok</button>
              </div>
              <div className="form-row">
                <div>
                  <label>Industria</label>
                  <select className="input" id="industry">
                    <option>Restaurante / Gastronomía</option>
                    <option>Moda y Ropa</option>
                    <option>Fitness y Salud</option>
                    <option>Tecnología</option>
                    <option>Belleza y Cosméticos</option>
                    <option>E-commerce</option>
                  </select>
                </div>
                <div>
                  <label>Objetivo</label>
                  <select className="input" id="goal">
                    <option>Vender un producto</option>
                    <option>Generar engagement</option>
                    <option>Dar a conocer la marca</option>
                    <option>Promoción especial</option>
                  </select>
                </div>
              </div>
              <label>Tono</label>
              <div className="style-options">
                {['😊 Amigable','💼 Profesional','😂 Divertido','🔥 Urgente','✨ Inspirador'].map(t => (
                  <button key={t} className={`style-pill${t.includes('Amigable')?' active':''}`}
                    onClick={(e)=>{e.currentTarget.closest('.style-options')!.querySelectorAll('.style-pill').forEach(p=>p.classList.remove('active'));e.currentTarget.classList.add('active')}}>{t}</button>
                ))}
              </div>
              <label>Describe tu producto o idea</label>
              <textarea className="input" rows={3} id="copyPrompt" placeholder="Ej: Oferta de verano, 30% descuento en ropa de playa..."></textarea>
              <button className="btn-generate" id="copyBtn" onClick={generateCopyClient}>⚡ Generar Copy con IA</button>
            </div>
            <div className="output-container" id="copyOutput" style={{display:'none'}}>
              <div className="output-header">
                <span className="output-header-title">✅ Contenido generado</span>
                <div className="output-actions">
                  <button className="btn-sm" onClick={copyCopyClient}>📋 Copiar</button>
                  <button className="btn-sm accent-btn">📅 Programar</button>
                  <button className="btn-sm" onClick={generateCopyClient}>🔄 Regenerar</button>
                </div>
              </div>
              <div className="output-body"><div className="output-text" id="copyResult"></div></div>
            </div>
          </div>

          {/* IMAGES */}
          <div className="tab-panel" id="images">
            <h1 className="section-title">🖼️ Generador de Imágenes</h1>
            <p className="section-subtitle">Crea imágenes únicas para tus publicaciones con IA</p>
            <div className="card">
              <label>Descripción de la imagen</label>
              <textarea className="input" rows={3} id="imagePrompt" placeholder="Ej: Producto sobre fondo minimalista blanco, iluminación profesional..."></textarea>
              <div className="form-row">
                <div>
                  <label>Formato</label>
                  <select className="input">
                    <option>📱 Cuadrado (1:1) — Instagram</option>
                    <option>📱 Vertical (9:16) — Stories</option>
                    <option>🖥️ Horizontal (16:9) — Facebook</option>
                  </select>
                </div>
                <div>
                  <label>Estilo</label>
                  <select className="input">
                    <option>Fotografía realista</option>
                    <option>Ilustración digital</option>
                    <option>Minimalista</option>
                    <option>3D Render</option>
                  </select>
                </div>
              </div>
              <button className="btn-generate" id="imageBtn" onClick={generateImagesClient}>🎨 Generar 4 Imágenes</button>
            </div>
            <div className="output-container" id="imageOutput" style={{display:'none'}}>
              <div className="output-header">
                <span className="output-header-title">✅ Imágenes generadas</span>
                <div className="output-actions">
                  <button className="btn-sm">⬇️ Descargar</button>
                  <button className="btn-sm accent-btn">📅 Programar</button>
                </div>
              </div>
              <div className="image-grid" id="imageGrid"></div>
            </div>
          </div>

          {/* VIDEOS */}
          <div className="tab-panel" id="videos">
            <h1 className="section-title">🎬 Generador de Videos</h1>
            <p className="section-subtitle">Crea videos cortos para TikTok, Reels e Instagram Stories</p>
            <div className="card">
              <label>Guión / idea del video</label>
              <textarea className="input" rows={3} id="videoPrompt" placeholder="Ej: Tutorial de 3 pasos para el outfit perfecto..."></textarea>
              <div className="form-row">
                <div><label>Formato</label>
                  <select className="input"><option>📱 Short/Reel (15s)</option><option>📱 TikTok (30s)</option><option>📹 Story (15s)</option></select>
                </div>
                <div><label>Música</label>
                  <select className="input"><option>🎵 Auto</option><option>🔥 Trending TikTok</option><option>😌 Lo-fi</option><option>⚡ Energético</option></select>
                </div>
              </div>
              <button className="btn-generate" onClick={generateVideoClient}>🎬 Generar Video</button>
            </div>
            <div className="output-container" id="videoOutput" style={{display:'none'}}>
              <div className="output-header">
                <span className="output-header-title">✅ Video generado</span>
                <div className="output-actions"><button className="btn-sm">⬇️ Descargar MP4</button></div>
              </div>
              <div style={{padding:'20px',textAlign:'center',color:'var(--text2)'}}>▶️ Video listo para descargar</div>
            </div>
          </div>

          {/* CALENDAR */}
          <div className="tab-panel" id="calendar">
            <h1 className="section-title">📅 Calendario Editorial</h1>
            <p className="section-subtitle">Planifica y programa tus publicaciones</p>
            <div className="card">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
                <h2 style={{fontFamily:'Syne,sans-serif',fontSize:'18px',fontWeight:700}}>Febrero 2026</h2>
              </div>
              <div className="calendar-grid">
                {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d=><div key={d} className="cal-day-header">{d}</div>)}
                {[26,27,28,29,30,31,1].map(d=><div key={`prev-${d}`} className="cal-day other-month"><div className="cal-day-num">{d}</div></div>)}
                <div className="cal-day"><div className="cal-day-num">2</div><div className="cal-event fb">📘 Oferta</div></div>
                <div className="cal-day"><div className="cal-day-num">3</div></div>
                <div className="cal-day"><div className="cal-day-num">4</div><div className="cal-event ig">📸 Producto</div></div>
                <div className="cal-day"><div className="cal-day-num">5</div></div>
                <div className="cal-day"><div className="cal-day-num">6</div><div className="cal-event tt">🎵 Tutorial</div></div>
                <div className="cal-day"><div className="cal-day-num">7</div></div>
                <div className="cal-day"><div className="cal-day-num">8</div></div>
                {[9,10,11,12,13].map(d=><div key={d} className="cal-day"><div className="cal-day-num">{d}</div></div>)}
                <div className="cal-day"><div className="cal-day-num">14</div><div className="cal-event ig">💝 San Valentín</div></div>
                <div className="cal-day today"><div className="cal-day-num">27</div><div className="cal-event ig">📸 Hoy</div></div>
              </div>
            </div>
          </div>
        </main>

        <aside className="right-panel">
          <div className="panel-title">Vista previa</div>
          <div className="preview-phone">
            <div className="preview-phone-header">
              <div className="preview-avatar">👤</div>
              <div><div className="preview-username">@tuempresa</div></div>
              <div className="preview-platform-tag">📘 Facebook</div>
            </div>
            <div className="preview-image">🖼️</div>
            <div className="preview-content" id="previewContent">Tu contenido aparecerá aquí...</div>
            <div className="preview-footer">
              <div className="preview-action">❤️ Me gusta</div>
              <div className="preview-action">💬 Comentar</div>
              <div className="preview-action">↗️ Compartir</div>
            </div>
          </div>
          <div className="panel-title">Historial reciente</div>
          <div className="history-item">
            <div className="history-item-top"><span className="history-type-badge">Copy</span><span className="history-date">hace 2h</span></div>
            <div className="history-preview">☀️ ¡El verano llegó y nuestros precios bajaron!</div>
          </div>
          <div className="history-item">
            <div className="history-item-top"><span className="history-type-badge img">Imagen</span><span className="history-date">ayer</span></div>
            <div className="history-preview">Producto sobre fondo minimalista</div>
          </div>
        </aside>
      </div>

      {/* PAYWALL MODAL */}
      <div className="modal-overlay" id="paywallModal" onClick={(e)=>{if(e.target===e.currentTarget)(e.currentTarget as any).classList.remove('show')}}>
        <div className="modal">
          <div style={{fontSize:'48px',marginBottom:'16px'}}>🚀</div>
          <div className="modal-title">Potencia tu contenido</div>
          <div className="modal-desc">Suscríbete para generar contenido ilimitado.</div>
          <div className="plans">
            <div className="plan-card">
              <div className="plan-name">Básico</div>
              <div className="plan-price">$360 <span>UYU/mes</span></div>
              <div className="plan-feature">✓ 100 generaciones/mes</div>
            </div>
            <div className="plan-card featured">
              <div className="plan-name" style={{color:'var(--accent)'}}>⭐ Pro</div>
              <div className="plan-price" style={{color:'var(--accent2)'}}>$1150 <span>UYU/mes</span></div>
              <div className="plan-feature">✓ Ilimitado + Videos</div>
            </div>
          </div>
          <button className="btn-upgrade-cta">💙 Suscribirse con Mercado Pago</button>
          <button className="modal-close" onClick={()=>(document.getElementById('paywallModal') as any).classList.remove('show')}>Continuar gratis</button>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html:`
        var usageCount=3,maxUsage=10;
        function switchSidebarClient(el,target){
          document.querySelectorAll('.sidebar-item').forEach(i=>i.classList.remove('active'));
          el.classList.add('active');
          document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
          var panel=document.getElementById(target);
          if(panel)panel.classList.add('active');
        }
        function incrementUsage(){
          usageCount++;
          document.getElementById('usageFill').style.width=(usageCount/maxUsage*100)+'%';
          document.getElementById('usageNum').textContent=usageCount;
          document.getElementById('remainingBadge').textContent=(maxUsage-usageCount);
        }
        function checkUsage(){
          if(usageCount>=maxUsage){document.getElementById('paywallModal').classList.add('show');return true;}
          return false;
        }
        function generateCopyClient(){
          if(checkUsage())return;
          var btn=document.getElementById('copyBtn');
          btn.classList.add('loading');
          btn.innerHTML='<div class="loading-dots"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div> Generando...';
          var copies=[
            '☀️ ¡El verano llegó y nuestros precios bajaron!\\n\\n🌊 Aprovecha nuestra colección de temporada con hasta 30% de descuento.\\n\\n✅ Envío gratis en pedidos +\\$50\\n✅ Devoluciones sin preguntas\\n\\nComenta \\"QUIERO\\" y te enviamos el catálogo 👇\\n\\n#Moda #Verano #Descuentos',
            '💡 ¿Sabías que el 87% de las personas decide una compra viendo solo las primeras fotos?\\n\\nPor eso cada detalle de nuestra colección está pensado para enamorarte al primer vistazo. ✨\\n\\n🛒 Link en bio para ver toda la colección\\n\\n¿Cuál es tu favorito? 👇',
            'POV: encontraste exactamente lo que buscabas 👀✨\\n\\n⚡ Solo por 48 horas\\n💥 Stock limitado\\n🎁 Regalo sorpresa en cada compra\\n\\n#TikTokModa #Outfit #GRWM'
          ];
          setTimeout(function(){
            btn.classList.remove('loading');
            btn.innerHTML='⚡ Generar Copy con IA';
            incrementUsage();
            var result=copies[Math.floor(Math.random()*copies.length)];
            document.getElementById('copyResult').textContent=result;
            document.getElementById('previewContent').textContent=result.substring(0,200)+'...';
            var out=document.getElementById('copyOutput');
            out.style.display='block';
            out.scrollIntoView({behavior:'smooth',block:'nearest'});
          },2200);
        }
        function generateImagesClient(){
          if(checkUsage())return;
          var btn=document.getElementById('imageBtn');
          btn.classList.add('loading');
          btn.innerHTML='<div class="loading-dots"><div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div></div> Generando...';
          setTimeout(function(){
            btn.classList.remove('loading');
            btn.innerHTML='🎨 Generar 4 Imágenes';
            incrementUsage();
            var colors=['linear-gradient(135deg,#667eea,#764ba2)','linear-gradient(135deg,#f093fb,#f5576c)','linear-gradient(135deg,#4facfe,#00f2fe)','linear-gradient(135deg,#43e97b,#38f9d7)'];
            var labels=['Versión A — Principal','Versión B — Alternativa','Versión C — Story','Versión D — Banner'];
            var grid=document.getElementById('imageGrid');
            grid.innerHTML='';
            for(var i=0;i<4;i++){
              var card=document.createElement('div');
              card.className='image-card';
              card.onclick=function(){this.classList.toggle('selected')};
              card.innerHTML='<div class="image-placeholder" style="background:'+colors[i]+';height:160px;opacity:.85"><span style="font-size:40px">🎨</span><span style="color:rgba(255,255,255,.8);font-size:11px">IA generada</span></div><div class="image-label">'+labels[i]+'</div><div class="select-overlay">✓</div>';
              grid.appendChild(card);
            }
            var out=document.getElementById('imageOutput');
            out.style.display='block';
            out.scrollIntoView({behavior:'smooth',block:'nearest'});
          },2800);
        }
        function generateVideoClient(){
          if(checkUsage())return;
          setTimeout(function(){
            incrementUsage();
            document.getElementById('videoOutput').style.display='block';
          },3500);
        }
        function copyCopyClient(){
          var text=document.getElementById('copyResult').textContent;
          navigator.clipboard.writeText(text).catch(function(){});
        }
      `}}/>
    </>
  );
}
