export default function DataDeletionPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const code = searchParams.code || '';

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{ minHeight: '100vh', background: '#FAF8F5', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>

        <nav style={{ background: '#fff', borderBottom: '1px solid #E8E0F0', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #7C5CBF, #B07FE8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none' }}>
            ✦ SocialAI
          </a>
        </nav>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ background: '#fff', border: '1.5px solid #E8E0F0', borderRadius: 20, padding: 40, maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(124,92,191,.08)' }}>

            <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>

            <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 800, color: '#2D2640', marginBottom: 12 }}>
              Datos eliminados
            </h1>

            <p style={{ color: '#7B6E99', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              Tu solicitud de eliminación de datos fue procesada correctamente.
              Todos los datos asociados a tu cuenta de Facebook han sido eliminados de nuestros servidores.
            </p>

            {code && (
              <div style={{ background: '#F3EFF9', border: '1.5px solid #E8E0F0', borderRadius: 12, padding: '12px 20px', marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#B5AACC', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  Código de confirmación
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#7C5CBF', fontFamily: 'monospace' }}>
                  {code}
                </div>
              </div>
            )}

            <p style={{ color: '#B5AACC', fontSize: 13, lineHeight: 1.6 }}>
              Si tenés preguntas sobre la eliminación de tus datos, podés contactarnos en{' '}
              <a href="mailto:privacidad@socialai.app" style={{ color: '#7C5CBF' }}>
                privacidad@socialai.app
              </a>
            </p>

          </div>
        </main>

      </div>
    </>
  );
}
