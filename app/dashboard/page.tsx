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

  // --- ESTILOS (Definidos aquí para que estén disponibles en todo el componente) ---
  const C = {
    bg: '#FAF8F5',
    surface: '#FFFFFF',
    surfaceHover: '#F3EFF9',
    border: '#E8E0F0',
    borderLight: '#F0EBF8',
    text: '#2D2640',
    textMuted: '#7B6E99',
    textDim: '#B5AACC', // <--- CORRECCIÓN: Definido para evitar error de compilación
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
      copyResult, previewImage, previewContent, copyPrompt, imagePrompt,
      selectedPlatforms, industry, goal, tone,
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
    else if (sharePlatform === 'WhatsApp') {
      showToast('⏳ Preparando preview...');
      try {
        const res = await fetch('/api/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: previewImage || null, copyText: text, userId: user?.id, platform: 'whatsapp' }),
        });
        const data = await res.json();
        if (data.shareUrl) {
          showToast('🔗 ' + data.shareUrl);
          await navigator.clipboard.writeText(data.shareUrl).catch(() => {});
          setTimeout(() => { window.open('https://wa.me/?text=' + encodeURIComponent(data.shareUrl), '_blank'); }, 2000);
        } else {
          window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
        }
      } catch {
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
          if (!imageUrl) { showToast('❌ Error al subir imagen'); setPublishing(false); return; }
        } else { imageUrl = previewImage; }
      }

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, text: copyResult || previewContent, imageUrl, facebookUserId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishResult({ success: true, platform });
        showToast(`✅ Publicado en ${platform}`);
      } else {
        showToast('❌ Error: ' + data.error);
      }
    } catch { showToast('❌ Error de conexión'); }
    setPublishing(false);
    setShowPublishModal(false);
  }

  // --- RENDERING HELPERS ---
  const inputStyle = { width:'100%', background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:12, color:C.text, padding:'11px 14px', fontSize:14, fontFamily:'inherit', outline:'none', boxShadow:'0 1px 4px rgba(124,92,191,.06)' } as React.CSSProperties;
  const labelStyle = { display:'block', fontSize:11, color:C.textMuted, marginBottom:6, fontWeight:700, letterSpacing:.8, textTransform:'uppercase' } as React.CSSProperties;

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
      }
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
      if (data.limitReached
