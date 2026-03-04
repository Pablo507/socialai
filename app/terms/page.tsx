export default function TermsPage() {
  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', background: '#0a0a0f', color: '#f0f0fa', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 32px', borderBottom:'1px solid #2a2a38', background:'rgba(10,10,15,0.9)' }}>
        <a href="/" style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, background:'linear-gradient(135deg,#7c5cfc,#e040fb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', textDecoration:'none' }}>SocialAI</a>
        <a href="/dashboard" style={{ background:'linear-gradient(135deg,#7c5cfc,#e040fb)', border:'none', color:'white', padding:'8px 20px', borderRadius:8, cursor:'pointer', fontSize:14, textDecoration:'none' }}>Ir al Dashboard</a>
      </nav>

      <div style={{ maxWidth:800, margin:'0 auto', padding:'60px 32px' }}>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:40, fontWeight:800, marginBottom:8, background:'linear-gradient(135deg,#7c5cfc,#e040fb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          Términos de Uso
        </h1>
        <p style={{ color:'#8888aa', fontSize:14, marginBottom:48 }}>Última actualización: Marzo 2026</p>

        {[
          {
            title: '1. Aceptación de los términos',
            content: [
              'Al registrarte y usar SocialAI, aceptás estos Términos de Uso en su totalidad. Si no estás de acuerdo con alguna parte, no uses el servicio.',
              'SocialAI es un servicio de generación de contenido con inteligencia artificial para redes sociales, operado desde Uruguay.',
            ]
          },
          {
            title: '2. El servicio',
            content: [
              'SocialAI te permite:',
              '• Generar textos (copies) para publicaciones en redes sociales usando IA',
              '• Generar imágenes originales con IA',
              '• Generar videos cortos con IA',
              '• Conectar tus cuentas de redes sociales para publicar directamente',
              '• Gestionar un historial de tu contenido generado',
              'El servicio se provee "tal como está" y puede ser modificado o interrumpido en cualquier momento.',
            ]
          },
          {
            title: '3. Planes y pagos',
            content: [
              '• Plan Free: 10 generaciones por mes, sin costo',
              '• Plan Básico: 100 generaciones por mes, $360 UYU/mes',
              '• Plan Pro: generaciones ilimitadas + videos, $1.150 UYU/mes',
              'Los pagos se procesan mensualmente de forma automática a través de Mercado Pago.',
              'Podés cancelar tu suscripción en cualquier momento. No realizamos reembolsos parciales por el mes en curso.',
              'Los precios pueden cambiar con 30 días de preaviso por email.',
            ]
          },
          {
            title: '4. Uso aceptable',
            content: [
              'Al usar SocialAI te comprometés a NO:',
              '• Generar contenido que viole leyes uruguayas o internacionales',
              '• Crear contenido difamatorio, discriminatorio, violento o sexual explícito',
              '• Usar el servicio para spam o contenido engañoso',
              '• Intentar vulnerar la seguridad del sistema',
              '• Compartir tu cuenta con terceros',
              '• Usar el servicio para competir directamente con SocialAI',
              'Nos reservamos el derecho de suspender cuentas que violen estas condiciones sin previo aviso.',
            ]
          },
          {
            title: '5. Contenido generado y propiedad intelectual',
            content: [
              '• El contenido que generás con SocialAI es tuyo — tenés todos los derechos sobre él',
              '• SocialAI no reclama propiedad sobre el contenido que creás',
              '• Sos responsable de que el contenido que publicás no viole derechos de terceros',
              '• Al usar el servicio, nos otorgás una licencia limitada para procesar tu contenido y mostrártelo',
              '• No usamos tu contenido para entrenar modelos de IA',
            ]
          },
          {
            title: '6. Conexión con redes sociales',
            content: [
              'Al conectar tu cuenta de Facebook, Instagram u otras redes sociales:',
              '• Autorizás a SocialAI a publicar contenido en tu nombre cuando vos lo confirmás',
              '• Sos responsable de todo el contenido publicado desde tu cuenta',
              '• Debés cumplir con los términos de uso de cada red social',
              '• Podés revocar el acceso en cualquier momento desde la configuración de tu cuenta',
              '• SocialAI no se responsabiliza por cambios en las APIs de terceros que afecten la funcionalidad',
            ]
          },
          {
            title: '7. Limitación de responsabilidad',
            content: [
              '• SocialAI no garantiza resultados específicos de las publicaciones',
              '• No somos responsables por pérdidas de negocio derivadas del uso del servicio',
              '• No garantizamos disponibilidad ininterrumpida del servicio',
              '• La responsabilidad máxima de SocialAI está limitada al monto pagado en los últimos 3 meses',
            ]
          },
          {
            title: '8. Privacidad',
            content: [
              'El uso de tus datos personales se rige por nuestra Política de Privacidad, disponible en socialai.uy/privacy, que forma parte integral de estos Términos.',
            ]
          },
          {
            title: '9. Cancelación y eliminación de cuenta',
            content: [
              '• Podés cancelar tu cuenta en cualquier momento desde la configuración',
              '• Al cancelar, perdés acceso a las funcionalidades de tu plan al finalizar el período pagado',
              '• Podés solicitar la eliminación completa de tus datos enviando un email a privacidad@socialai.uy',
              '• Nos reservamos el derecho de cancelar cuentas que violen estos términos',
            ]
          },
          {
            title: '10. Cambios a los términos',
            content: [
              'Podemos modificar estos términos con 30 días de preaviso por email. Si no estás de acuerdo con los cambios, podés cancelar tu cuenta antes de que entren en vigencia.',
            ]
          },
          {
            title: '11. Ley aplicable',
            content: [
              'Estos términos se rigen por las leyes de la República Oriental del Uruguay. Cualquier disputa se resolverá en los tribunales de Montevideo, Uruguay.',
            ]
          },
          {
            title: '12. Contacto',
            content: [
              'Para consultas sobre estos términos:',
              '• Email: legal@socialai.uy',
              '• Respondemos en un plazo máximo de 48 horas hábiles',
            ]
          },
        ].map(({ title, content }) => (
          <div key={title} style={{ marginBottom:40 }}>
            <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:20, fontWeight:700, color:'#7c5cfc', marginBottom:16 }}>{title}</h2>
            {content.map((line, i) => (
              <p key={i} style={{ color: line.startsWith('•') ? '#c0c0d0' : '#8888aa', fontSize:15, lineHeight:1.7, marginBottom:8, paddingLeft: line.startsWith('•') ? 16 : 0 }}>
                {line}
              </p>
            ))}
          </div>
        ))}

        <div style={{ borderTop:'1px solid #2a2a38', paddingTop:32, marginTop:40, textAlign:'center' }}>
          <p style={{ color:'#4a4a5a', fontSize:13 }}>
            SocialAI · Uruguay · <a href="/privacy" style={{ color:'#7c5cfc', textDecoration:'none' }}>Política de Privacidad</a>
          </p>
        </div>
      </div>
    </div>
  );
}
