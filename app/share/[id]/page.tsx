import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://socialai-iota.vercel.app';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getPost(shareId: string) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('posts')
      .select('share_id, copy_text, image_url, platform, created_at')
      .eq('share_id', shareId)
      .single();
    if (error) { console.error('getPost error:', error.message); return null; }
    return data;
  } catch (e) {
    console.error('getPost exception:', e);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getPost(params.id);

  if (!post) {
    return {
      title: 'SocialAI — Contenido para redes sociales',
      description: 'Generá contenido para tus redes con inteligencia artificial.',
      openGraph: { title: 'SocialAI — Contenido para redes sociales', description: 'Generá contenido para tus redes con inteligencia artificial.', siteName: 'SocialAI', type: 'website' },
    };
  }

  const copyText = post.copy_text || post.content || '';
  const description = copyText.substring(0, 160) || 'Contenido generado con SocialAI';
  const imageUrl = post.image_url || null;
  const ogImageUrl = imageUrl ? `${APP_URL}/api/og-image?url=${encodeURIComponent(imageUrl)}` : null;

  return {
    title: 'SocialAI — Contenido para redes sociales',
    description,
    openGraph: {
      title: 'SocialAI — Contenido para redes sociales',
      description,
      url: `${APP_URL}/share/${params.id}`,
      siteName: 'SocialAI',
      type: 'website',
      ...(ogImageUrl && { images: [{ url: ogImageUrl, width: 1200, height: 630, alt: 'Imagen generada con SocialAI' }] }),
    },
    twitter: {
      card: ogImageUrl ? 'summary_large_image' : 'summary',
      title: 'SocialAI — Contenido para redes sociales',
      description,
      ...(ogImageUrl && { images: [ogImageUrl] }),
    },
  };
}

export default async function SharePage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);

  if (!post) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <div style={{ minHeight: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h1 style={{ color: '#2D2640', fontSize: 22, marginBottom: 8 }}>Contenido no encontrado</h1>
            <p style={{ color: '#7B6E99', marginBottom: 24 }}>Este link puede haber expirado.</p>
            <a href={APP_URL} style={{ background: 'linear-gradient(135deg, #7C5CBF, #B07FE8)', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>Crear contenido con SocialAI</a>
          </div>
        </div>
      </>
    );
  }

  const copyText = post.copy_text || post.content || '';

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{ minHeight: '100vh', background: '#FAF8F5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #E8E0F0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #7C5CBF, #B07FE8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✦ SocialAI</div>
          <a href={APP_URL} style={{ background: 'linear-gradient(135deg, #7C5CBF, #B07FE8)', color: '#fff', padding: '8px 18px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Crear contenido gratis</a>
        </header>
        <main style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>
          {post.image_url && (
            <div style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 24, boxShadow: '0 8px 32px rgba(124,92,191,.12)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image_url} alt="Imagen generada con SocialAI" style={{ width: '100%', display: 'block', aspectRatio: '1/1', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ background: '#fff', border: '1.5px solid #E8E0F0', borderRadius: 18, padding: 24, marginBottom: 24, boxShadow: '0 2px 16px rgba(124,92,191,.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#B5AACC', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>✦ Contenido generado con IA</div>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: '#2D2640', whiteSpace: 'pre-wrap', margin: 0 }}>{copyText}</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #EDE8F8, #FEF0E7)', border: '1.5px solid #E8E0F0', borderRadius: 18, padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#7B6E99', margin: '0 0 16px' }}>Creado con <strong style={{ color: '#7C5CBF' }}>SocialAI</strong> — Generá contenido para tus redes con IA</p>
            <a href={APP_URL} style={{ background: 'linear-gradient(135deg, #7C5CBF, #B07FE8)', color: '#fff', padding: '13px 28px', borderRadius: 14, textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'inline-block', boxShadow: '0 4px 16px rgba(124,92,191,.30)' }}>🚀 Probalo gratis</a>
          </div>
        </main>
      </div>
    </>
  );
}
