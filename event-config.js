/* ====================================================================
   EVENT CONFIG — fuente única de verdad de la landing
   --------------------------------------------------------------------
   Este fichero define TODO el contenido editable de la página.
   El editor visual genera una versión personalizada de este objeto;
   app.js lo lee al cargar y renderiza la landing desde aquí.

   Si window.EVENT_CONFIG no existe, app.js mantiene el HTML estático
   (retrocompatibilidad).
   ==================================================================== */
window.EVENT_CONFIG = {
  meta: {
    pageTitle: 'OFICINAS · Impulso y oportunidad — Savills',
    lang: 'es'
  },

  /* Colores configurables (se aplican como variables CSS) */
  theme: {
    accent:   '#FFDF00',   // color de acento (subtítulo, etiquetas, botones…)
    heroText: '#ffffff',   // color de los textos del hero
    infoBg:   '#0c1c46',   // fondo de la sección de información
    infoText: '#ffffff'    // color de los textos de la sección de información
  },

  /* Visibilidad de secciones (false = oculta) */
  sections: {
    countdown:  true,
    highlights: true,
    calendar:   true,
    agenda:     true,
    speakers:   true,
    registro:   true
  },

  hero: {
    eventLogo: '',          // imagen de logo del evento ('' = logo por defecto)
    title: 'Oficinas',
    subtitle: 'Impulso y oportunidad',
    backgroundImage: 'assets/cover-bg.jpg',
    navCta: 'Registro'
  },

  /* Highlights: se muestran tanto en el hero como en la sección info */
  highlights: [
    { value: '25 junio 2026',          label: 'Fecha' },
    { value: '09:30 – 14:00h',         label: 'Hora'  },
    { value: 'Castellana 81, Madrid',  label: 'Lugar' }
  ],

  event: {
    /* Usados por el countdown y por los botones "Añadir al calendario" */
    start: '2026-06-25T09:30:00',
    end:   '2026-06-25T14:00:00',
    name:  'El futuro de las oficinas',
    description: 'Una mañana junto a Savills Research y los protagonistas del sector para leer el mercado de oficinas con datos: ocupación, rentas prime, flexibilidad y el peso de la sostenibilidad en cada decisión de inversión. Plazas limitadas y sin coste de inscripción.',
    location: 'Auditorio Savills, Pº de la Castellana 81, 28046 Madrid',
    calendarTitle: 'OFICINAS · Impulso y oportunidad — Savills',
    calendarDescription: 'Jornada Savills Research sobre el mercado de oficinas: ocupación, rentas prime, flexibilidad y sostenibilidad. Recepción desde las 09:00h.'
  },

  agenda: [
    { time: '09:30h', title: 'Recepción y café de bienvenida' },
    { time: '10:00h', title: 'El pulso del mercado de oficinas' },
    { time: '11:15h', title: 'Mesa redonda · flexibilidad y ESG' },
    { time: '13:00h', title: 'Networking y vino español' }
  ],

  speakers: [
    { name: 'Carter Botosh',  role: 'Chief Financial Officer', company: '', photo: 'assets/speaker-1.jpg' },
    { name: 'Phillip Ekstrom', role: 'Head of Technology',     company: '', photo: 'assets/speaker-2.jpg' },
    { name: 'Abram Culhane',  role: 'Head of Technology',     company: '', photo: 'assets/speaker-3.jpg' }
  ],

  registro: {
    backgroundImage: 'assets/registro-bg.jpg'
  },

  form: {
    title: 'Formulario de registro',
    submitLabel: 'Completar registro',
    legal: 'Al registrarte aceptas la <a href="#">política de privacidad</a> de Savills. Usaremos tus datos únicamente para gestionar tu asistencia a este evento.',
    successTitle: '¡Plaza reservada!',
    successMessage: 'Gracias, te hemos enviado la confirmación a tu email. Nos vemos el 25 de junio.',
    resetLabel: 'Registrar a otra persona',
    fields: [
      { name: 'name',    type: 'text',     label: 'Nombre y apellidos', placeholder: 'Ana García López',     required: true,  width: 'full', autocomplete: 'name' },
      { name: 'company', type: 'text',     label: 'Compañía',           placeholder: 'Tu empresa',           required: true,  width: 'half', autocomplete: 'organization' },
      { name: 'role',    type: 'text',     label: 'Cargo',              placeholder: 'Director de Inmuebles', required: true,  width: 'half', autocomplete: 'organization-title' },
      { name: 'email',   type: 'email',    label: 'Email corporativo',  placeholder: 'nombre@empresa.com',   required: true,  width: 'full', autocomplete: 'email' },
      { name: 'notes',   type: 'textarea', label: 'Notas',              placeholder: '¿Alguna necesidad de accesibilidad, dieta o tema que te gustaría tratar?', required: false, width: 'full' }
    ]
  },

  footer: {
    copy: '© 2026 Savills Spain. Todos los derechos reservados.',
    visitLabel: 'Visita savills.es',
    visitUrl: 'https://www.savills.es'
  }
};
