// PREGUNTAS (§8). `dinamica` marca respuestas que se completan con datos del
// backend en el componente (nunca se escriben a mano).

export type Faq = {
  pregunta: string
  respuesta: string
  /** 'zonas-delivery': se agrega la lista de barrios de GET /delivery-zones. */
  dinamica?: 'zonas-delivery'
}

export const faq: Faq[] = [
  { pregunta: '¿Hace falta reservar?', respuesta: 'De jueves a sábado, sí. El resto de la semana guardamos mesas para quien llega sin reserva.' },
  { pregunta: '¿Cómo reservo?', respuesta: 'Por WhatsApp o desde el botón "Reservar mesa". Para pedir comida, llamá: te atendemos aunque el salón esté lleno.' },
  { pregunta: '¿Tienen opciones vegetarianas o sin TACC?', respuesta: 'Sí, están marcadas en la carta. La cocina es compartida: avisanos cualquier alergia al reservar.' },
  { pregunta: '¿Puedo traer mi vino?', respuesta: 'Sí. Cobramos descorche por botella y te la servimos a la temperatura justa.' },
  { pregunta: '¿Hay estacionamiento?', respuesta: 'Tenemos convenio con la playa de la esquina.' },
  { pregunta: '¿Aceptan mascotas?', respuesta: 'En las mesas de la vereda, siempre.' },
  { pregunta: '¿Hacen eventos privados?', respuesta: 'Sí: el salón completo hasta 38 personas o el sector del fondo hasta 16.' },
  { pregunta: '¿Con cuánta anticipación pido catering?', respuesta: 'Diez días. Para Navidad y Año Nuevo, tres semanas.' },
  { pregunta: '¿El catering incluye personal?', respuesta: 'Sí: mozos, vajilla y parrillero según el formato que elijas.' },
  { pregunta: '¿Qué medios de pago aceptan?', respuesta: 'Efectivo, débito, crédito, transferencia y QR.' },
  { pregunta: '¿Tienen menú para chicos?', respuesta: 'Sí, media porción de cualquier plato principal.' },
  {
    pregunta: '¿Hacen delivery?',
    respuesta: 'Sí, a los barrios de la lista. El envío y el pedido mínimo dependen de la zona.',
    dinamica: 'zonas-delivery',
  },
]

/** Para el buscador: minúsculas y sin acentos. */
export const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
