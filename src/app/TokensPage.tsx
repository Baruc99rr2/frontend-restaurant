// Página de prueba de F0: muestra los tokens de color y tipografía.
// Se reemplaza por el escenario en F3; puede quedar como ruta interna de QA.

type ColorToken = {
  token: string
  hex: string
  uso: string
  className: string
  claro?: boolean
}

const colores: ColorToken[] = [
  { token: 'noche', hex: '#000000', uso: 'Fondo del escenario y marcos', className: 'bg-noche' },
  { token: 'tizon', hex: '#14120F', uso: 'Superficies oscuras, paneles', className: 'bg-tizon' },
  { token: 'oro', hex: '#B8914A', uso: 'Botón MENU, precios, acentos, líneas activas', className: 'bg-oro', claro: true },
  { token: 'champan', hex: '#E6D7A8', uso: 'Títulos gigantes, bloques del hero, tarjetas claras', className: 'bg-champan', claro: true },
  { token: 'monte', hex: '#13261C', uso: 'Fondos de sección, números de la calculadora', className: 'bg-monte' },
  { token: 'hoja', hex: '#2B4A38', uso: 'Hovers, gradientes', className: 'bg-hoja' },
  { token: 'vino', hex: '#5E1222', uso: 'Solo el líquido del botón MENU', className: 'bg-vino' },
  { token: 'vino-luz', hex: '#7A1C2C', uso: 'Brillo del líquido del botón MENU', className: 'bg-vino-luz' },
  { token: 'ceniza', hex: '#9A9384', uso: 'Texto secundario', className: 'bg-ceniza', claro: true },
]

const escala = [
  { token: 'text-display', className: 'font-gigante text-display', muestra: 'Fuego lento' },
  { token: 'text-titulo', className: 'font-gigante text-titulo', muestra: 'Los de siempre' },
  { token: 'text-subtitulo', className: 'font-ui text-subtitulo font-medium', muestra: 'Cocina de fuego y bodega' },
  {
    token: 'text-cuerpo',
    className: 'font-ui text-cuerpo',
    muestra: 'Leña de quebracho, brasa paciente y una bodega elegida botella por botella.',
  },
  { token: 'text-ui', className: 'font-ui text-ui font-semibold uppercase tracking-[0.12em]', muestra: 'Reservar mesa' },
  { token: 'text-etiqueta', className: 'font-ui text-etiqueta font-semibold uppercase', muestra: '02 — Platos' },
]

function Encabezado({ numero, titulo }: { numero: string; titulo: string }) {
  return (
    <header className="mb-8 flex items-baseline gap-4 border-b border-oro/40 pb-3">
      <span className="font-ui text-etiqueta font-semibold uppercase text-oro">{numero}</span>
      <h2 className="font-ui text-subtitulo font-semibold uppercase tracking-[0.08em]">{titulo}</h2>
    </header>
  )
}

export default function TokensPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
      {/* Wordmark + marco inclinado */}
      <section className="mb-20 grid items-center gap-12 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-ui text-etiqueta font-semibold uppercase text-ceniza">Tokens · F0</p>
          <h1 className="mt-4 font-serif text-display leading-[0.95]">
            Quebracho
            <span className="block font-serif text-subtitulo italic text-oro">cocina de fuego y bodega</span>
          </h1>
        </div>
        <div className="relative mx-auto size-56 sm:size-64" aria-hidden="true">
          <div className="absolute inset-0 rotate-(--marco-rotacion) border-[10px] border-noche bg-monte shadow-[0_0_0_1px_var(--color-oro)]">
            <div className="velo absolute inset-0" />
            <span className="absolute inset-0 grid place-items-center font-gigante text-titulo text-champan">Q</span>
          </div>
        </div>
      </section>

      {/* Colores */}
      <section className="mb-20">
        <Encabezado numero="01" titulo="Color" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colores.map((c) => (
            <li key={c.token} className="overflow-hidden border border-ceniza/25 bg-tizon">
              <div
                className={`flex h-28 items-end p-3 ${c.className} ${c.claro ? 'text-noche' : 'text-champan'}`}
              >
                <span className="font-ui text-ui font-semibold">{c.hex}</span>
              </div>
              <div className="p-3">
                <p className="font-ui text-ui font-semibold text-champan">{c.token}</p>
                <p className="font-ui text-ui text-ceniza">{c.uso}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="relative mt-4 h-28 overflow-hidden border border-ceniza/25 bg-hoja">
          <div className="velo absolute inset-0" />
          <p className="relative p-3 font-ui text-ui text-champan">
            <span className="font-semibold">velo</span> — overlay rgba(0,0,0,.55) + viñeta radial
          </p>
        </div>
      </section>

      {/* Tipografía */}
      <section className="mb-20">
        <Encabezado numero="02" titulo="Tipografía" />

        <div className="mb-12 overflow-hidden">
          <p className="mb-2 font-ui text-etiqueta font-semibold uppercase text-ceniza">
            text-gigante · Archivo ancho 125 / peso 800
          </p>
          <p className="font-gigante text-gigante uppercase text-champan">Brasa</p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <div className="border border-ceniza/25 bg-tizon p-6">
            <p className="mb-3 font-ui text-etiqueta font-semibold uppercase text-ceniza">Archivo · eje wdth</p>
            <p className="font-sans text-titulo font-extrabold [font-stretch:62%]">Ancho 62</p>
            <p className="font-sans text-titulo font-extrabold [font-stretch:100%]">Ancho 100</p>
            <p className="font-sans text-titulo font-extrabold [font-stretch:125%]">Ancho 125</p>
          </div>
          <div className="border border-ceniza/25 bg-tizon p-6">
            <p className="mb-3 font-ui text-etiqueta font-semibold uppercase text-ceniza">Libre Caslon Text</p>
            <p className="font-serif text-titulo">Valle de Uco</p>
            <p className="font-serif text-titulo italic text-oro">“El fuego no se apura.”</p>
            <p className="font-serif text-titulo font-bold">Ojo de bife</p>
          </div>
        </div>

        <dl className="divide-y divide-ceniza/20 border-y border-ceniza/20">
          {escala.map((e) => (
            <div key={e.token} className="grid gap-2 py-5 md:grid-cols-[10rem_1fr] md:items-baseline">
              <dt className="font-ui text-etiqueta font-semibold uppercase text-oro">{e.token}</dt>
              <dd className={e.className}>{e.muestra}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Acentos de UI */}
      <section>
        <Encabezado numero="03" titulo="Acentos" />
        <div className="flex flex-wrap items-center gap-6">
          <button
            type="button"
            className="relative overflow-hidden rounded-full bg-oro px-8 py-3 font-ui text-ui font-bold uppercase tracking-[0.2em] text-noche"
          >
            <span className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-vino to-vino-luz" aria-hidden="true" />
            <span className="relative">Menu</span>
          </button>
          <span className="font-ui text-subtitulo font-semibold text-oro">$ 18.500</span>
          <span className="h-px w-24 bg-oro" aria-hidden="true" />
          <a href="#" className="font-ui text-ui text-ceniza underline-offset-4 hover:text-champan hover:underline">
            Texto secundario / enlace
          </a>
        </div>
      </section>
    </main>
  )
}
