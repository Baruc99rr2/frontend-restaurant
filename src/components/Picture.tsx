import type { ImageShapeName, MediaImage } from '@/content/media.types'
import { usePlaceholder } from '@/content/placeholders'

type Props = {
  image: MediaImage
  shape: ImageShapeName
  alt: string
  /** Atributo `sizes` del <img>; por defecto ocupa el ancho de la pantalla. */
  sizes?: string
  className?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  onLoad?: () => void
}

/** <picture> AVIF + WebP con placeholder borroso de fondo mientras carga. */
export function Picture({
  image,
  shape,
  alt,
  sizes = '100vw',
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  onLoad,
}: Props) {
  const s = image[shape]
  const placeholder = usePlaceholder(s.placeholder)
  const variantes = s.sm.width === s.lg.width ? [s.lg] : [s.sm, s.lg]
  const srcset = (fmt: 'avif' | 'webp') => variantes.map((v) => `${v[fmt]} ${v.width}w`).join(', ')

  return (
    <picture>
      <source type="image/avif" srcSet={srcset('avif')} sizes={sizes} />
      <img
        src={s.lg.webp}
        srcSet={srcset('webp')}
        sizes={sizes}
        width={s.lg.width}
        height={s.lg.height}
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        onLoad={onLoad}
        decoding="async"
        className={`bg-cover bg-center ${className}`}
        style={placeholder ? { backgroundImage: `url(${placeholder})` } : undefined}
      />
    </picture>
  )
}
