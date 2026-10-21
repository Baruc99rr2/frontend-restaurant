// Copy del sitio (es-AR, tono rioplatense: frases cortas, concretas, sin relleno).
// Lo que es dato del local (precios, horarios, dirección, carta) NO va acá: sale del backend.
// Botones repetidos: site.config.ts → botones.

import type { PanelKey } from './editorial'

export type Panel = {
  key: PanelKey
  /** Título gigante del modo cerrado. */
  titulo: string
  /** Link del navbar; null = sin link (se llega por scroll). */
  navbar: string | null
  /** Etiquetas laterales del modo cerrado: dos líneas cada una. */
  izquierda: [string, string]
  derecha: [string, string]
}

export const paneles: Panel[] = [
  { key: 'home', titulo: 'HOME', navbar: 'Home', izquierda: ['Fuego lento,', 'mesa larga.'], derecha: ['Cocina de fuego', 'y bodega.'] },
  { key: 'la-casa', titulo: 'LA CASA', navbar: 'Sobre nosotros', izquierda: ['Tres generaciones', 'al pie del fuego.'], derecha: ['Leña de quebracho,', 'paciencia y harina.'] },
  { key: 'platos', titulo: 'PLATOS', navbar: null, izquierda: ['Los que nunca', 'salen de la carta.'], derecha: ['Cinco platos,', 'una sola brasa.'] },
  { key: 'eventos', titulo: 'EVENTOS', navbar: 'Nuestros servicios', izquierda: ['Tu mesa larga,', 'donde quieras.'], derecha: ['De 10 a 200', 'invitados.'] },
  { key: 'preguntas', titulo: 'PREGUNTAS', navbar: 'Preguntas frecuentes', izquierda: ['Lo que más', 'nos preguntan.'], derecha: ['Y si no está,', 'escribinos.'] },
  { key: 'contacto', titulo: 'CONTACTO', navbar: 'Contacto', izquierda: ['Te esperamos.', 'Desde 2011.'], derecha: ['Vení con hambre,', 'andate sin apuro.'] },
]

export const copy = {
  intro: {
    clic: 'Hacé clic para entrar',
    tocar: 'Tocá para entrar',
    cargando: 'Prendiendo el fuego',
  },

  /** Escenario (modo cerrado/abierto). {panel}, {n}, {total} se reemplazan. */
  escenario: {
    abrir: 'Entrar a {panel}',
    irA: 'Ir a {panel}',
    posicion: 'Panel {n} de {total}: {panel}',
    paneles: 'Paneles',
    indice: 'Índice',
    total: 'Total',
    /** Placeholder del modo abierto hasta F4–F8. */
    enPreparacion: 'Este panel se está armando.',
    salir: 'Esc para volver',
  },

  home: {
    bloques: ['FUEGO LENTO,', 'MESA LARGA.'],
    subtitulo: 'Cocina a la brasa de quebracho, pastas amasadas cada mañana y una bodega de 140 etiquetas argentinas.',
  },

  laCasa: {
    cita: 'Cocinar es saber esperar.',
    /** `icono`: nombre del ícono de lucide-react. */
    items: [
      { icono: 'Flame', item: 'Fuego', titulo: 'El fuego manda', texto: 'Leña de quebracho y paciencia. El asado de tira pasa doce horas entre brasas antes de llegar a la mesa.' },
      { icono: 'Wheat', item: 'Masa', titulo: 'Amasado del día', texto: 'Las pastas se estiran cada mañana con harina de molino de piedra y huevos de granja.' },
      { icono: 'Sprout', item: 'Huerta', titulo: 'Lo que da la estación', texto: 'Compramos a tres productores del cinturón verde. Cuando cambia la tierra, cambia la carta.' },
      { icono: 'Wine', item: 'Bodega', titulo: 'Bodega de autor', texto: '140 etiquetas de bodegas chicas, de la Quebrada a la Patagonia. Pedí que te recomendemos una.' },
      { icono: 'UtensilsCrossed', item: 'Mesa', titulo: 'Mesa larga', texto: 'Un salón de 38 cubiertos pensado para quedarse. Acá la sobremesa no tiene apuro.' },
      { icono: 'Users', item: 'Familia', titulo: 'Tres generaciones', texto: 'Empezó la abuela Teresa con un horno de barro en el patio. Hoy la cocina la llevan sus nietos.' },
    ],
  },

  platos: {
    titulo: 'Los que nunca salen de la carta',
    anterior: 'Plato anterior',
    siguiente: 'Plato siguiente',
  },

  eventos: {
    titulo: 'Armá tu evento y te decimos cuánto fuego hace falta.',
    nota: 'Valores orientativos. Te confirmamos el presupuesto en el día.',
    etiquetas: { invitados: 'Invitados', ocasion: 'Ocasión', formato: 'Formato' },
    /** Mensaje de WhatsApp: {invitados}, {ocasion}, {formato}, {resumen}. */
    mensaje: 'Hola, quiero pedir presupuesto para un evento: {invitados} invitados, {ocasion}, formato {formato}.\n{resumen}',
    asuntoMail: 'Presupuesto para un evento',
  },

  preguntas: {
    titulo: 'Lo que más nos preguntan.',
    /** {email}, {telefono} y {whatsapp} se convierten en links desde site.config. */
    bajada: 'Si no está acá, escribinos por {email}, {telefono} o mandanos un {whatsapp}.',
    links: { email: 'mail', telefono: 'llamanos', whatsapp: 'WhatsApp' },
    buscar: 'Buscá una pregunta',
    sinResultados: 'No encontramos nada con eso. Probá con otra palabra o escribinos.',
    pagina: '{actual} / {total}',
  },

  contacto: {
    etiqueta: 'Te esperamos. Desde 2011.',
    telefono: 'Pedidos por teléfono',
    horario: 'Horario',
    proximoDistinto: 'Próximo día distinto',
    atribucionMapa: '© OpenStreetMap',
    zoomMapa: 'Hacé clic para mover el mapa',
  },

  carta: {
    hoy: 'Hoy:',
    temporada: 'Carta de temporada',
    verCategoria: 'Ver categoría',
    categorias: '← Categorías',
    sinStock: 'No hay hoy',
    anterior: '← Categoría anterior',
    siguiente: 'Categoría siguiente →',
    volverCarta: 'Volver a la carta',
    noExiste: 'Esa categoría ya no está en la carta.',
    cerrarFoto: 'Cerrar foto',
    leyendaAlergenos: 'Alérgenos',
  },

  /** Leyenda de alérgenos: clave = texto que manda el backend. Lo desconocido se muestra tal cual. */
  alergenos: {
    gluten: { marca: 'G', nombre: 'Gluten' },
    lacteos: { marca: 'L', nombre: 'Lácteos' },
    huevo: { marca: 'H', nombre: 'Huevo' },
    crustaceos: { marca: 'C', nombre: 'Crustáceos' },
    pescado: { marca: 'P', nombre: 'Pescado' },
    sesamo: { marca: 'S', nombre: 'Sésamo' },
    sulfitos: { marca: 'SO', nombre: 'Sulfitos' },
    'frutos-secos': { marca: 'FS', nombre: 'Frutos secos' },
  } as Record<string, { marca: string; nombre: string }>,

  /** Plantillas de estado en vivo: {hora}, {dia}. */
  estado: {
    abierto: 'Abierto ahora, cierra a las {hora}',
    abiertoSinHora: 'Abierto ahora',
    cerradoAbre: 'Cerrado, abre {dia} a las {hora}',
    cerrado: 'Cerrado por ahora',
    cocinaVuelve: 'La cocina vuelve a tomar pedidos a las {hora}',
    cocinaPausa: 'La cocina no está tomando pedidos en este momento',
    diaCerrado: 'cerrado',
  },

  reservar: {
    /** Mensaje prearmado de WhatsApp para "Reservar mesa". */
    mensaje: 'Hola, quiero reservar una mesa.',
  },
} as const
