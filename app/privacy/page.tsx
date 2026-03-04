export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', background: '#0a0a0f', color: '#f0f0fa', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 32px', borderBottom:'1px solid #2a2a38', background:'rgba(10,10,15,0.9)' }}>
        <a href="/" style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, background:'linear-gradient(135deg,#7c5cfc,#e040fb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', textDecoration:'none' }}>SocialAI</a>
        <a href="/dashboard" style={{ background:'linear-gradient(135deg,#7c5cfc,#e040fb)', border:'none', color:'white', padding:'8px 20px', borderRadius:8, cursor:'pointer', fontSize:14, textDecoration:'none' }}>Ir al Dashboard</a>
      </nav>

      <div style={{ maxWidth:800, margin:'0 auto', padding:'60px 32px' }}>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:40, fontWeight:800, marginBottom:8, background:'linear-gradient(135deg,#7c5cfc,#e040fb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          Política de Privacidad
        </h1>
        <p style={{ color:'#8888aa', fontSize:14, marginBottom:48 }}>Última actualización: Marzo 2026</p>

        {[
          {
            title: '1. Información que recopilamos',
            content: [
              'SocialAI recopila la siguiente información cuando usás nuestro servicio:',
              '• Dirección de correo electrónico y contraseña (para crear tu cuenta)',
              '• Contenido que generás: prompts, copies e imágenes creadas con IA',
              '• Datos de uso: frecuencia de uso, funcionalidades utilizadas',
              '• Información de facturación: procesada de forma segura por Mercado Pago (no almacenamos datos de tarjetas)',
              '• Tokens de acceso a redes sociales (solo si conectás tu cuenta de Facebook/Instagram)',
            ]
          },
          {
            title: '2. Cómo usamos tu información',
            content: [
              'Usamos tu información exclusivamente para:',
              '• Proveer y mejorar el servicio de generación de contenido',
              '• Procesar pagos y gestionar tu suscripción',
              '• Publicar contenido en tus redes sociales cuando vos lo solicitás expresamente',
              '• Enviarte comunicaciones relacionadas con tu cuenta (nunca spam)',
              '• Analizar el uso agregado y anónimo para mejorar el producto',
            ]
          },
          {
            title: '3. Redes sociales conectadas',
            content: [
              'Si conectás tu cuenta de Facebook o Instagram a SocialAI:',
              '• Solo accedemos a los permisos que vos autorizás explícitamente',
              '• Nunca publicamos contenido sin tu confirmación previa',
              '• Podés desconectar tu cuenta en cualquier momento desde la configuración',
              '• Los tokens de acceso se almacenan de forma encriptada',
              '• No compartimos tu información de redes sociales con terceros',
            ]
          },
          {
            title: '4. Compartir información con terceros',
            content: [
              'SocialAI utiliza los siguientes proveedores de servicios:',
              '• Supabase: almacenamiento de datos y autenticación (servidores en AWS)',
              '• Groq: generación de texto con IA (los prompts se procesan y no se almacenan)',
              '• Fal.ai: generación de imágenes con IA',
              '• Mercado Pago: procesamiento de pagos',
              '• Vercel: hosting de la aplicación',
              'No vendemos, alquilamos ni compartimos tu información personal con ninguna otra empresa.',
            ]
          },
          {
            title: '5. Seguridad de los datos',
            content: [
              '• Toda la comunicación está encriptada con SSL/TLS',
              '• Las contraseñas se almacenan con hash seguro (nunca en texto plano)',
              '• Los tokens de acceso a redes sociales se encriptan en reposo',
              '• Realizamos copias de seguridad regulares de la base de datos',
              '• Acceso restringido a datos de usuarios solo para personal autorizado',
            ]
          },
          {
            title: '6. Tus derechos',
            content: [
              'Tenés derecho a:',
              '• Acceder a toda la información que tenemos sobre vos',
              '• Corregir datos incorrectos',
              '• Solicitar la eliminación completa de tu cuenta y datos',
              '• Exportar tu historial de contenido generado',
              '• Desconectar tus redes sociales en cualquier momento',
              'Para ejercer estos derechos, escribinos a: privacidad@socialai.uy',
            ]
          },
          {
            title: '7. Retención de datos',
            content: [
              '• Mantenemos tus datos mientras tu cuenta esté activa',
              '• Si eliminás tu cuenta, borramos todos tus datos en un plazo de 30 días',
              '• Los datos de facturación se retienen por 5 años por obligaciones fiscales',
              '• Los logs de sistema se eliminan automáticamente a los 90 días',
            ]
          },
          {
            title: '8. Cookies',
            content: [
              'SocialAI usa cookies únicamente para:',
              '• Mantener tu sesión iniciada',
              '• Recordar tus preferencias de usuario',
              'No usamos cookies de rastreo publicitario ni compartimos datos con anunciantes.',
            ]
          },
          {
            title: '9. Cambios a esta política',
            content: [
              'Si realizamos cambios significativos a esta política, te notificaremos por email con al menos 30 días de anticipación. El uso continuado del servicio después de los cambios implica la aceptación de la nueva política.',
            ]
          },
          {
            title: '10. Contacto',
            content: [
              'Para consultas sobre privacidad:',
              '• Email: privacidad@socialai.uy',
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
            SocialAI · Uruguay · <a href="/terms" style={{ color:'#7c5cfc', textDecoration:'none' }}>Términos de Uso</a>
          </p>
        </div>
      </div>
    </div>
  );
}
