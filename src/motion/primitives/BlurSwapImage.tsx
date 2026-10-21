import { useRef } from 'react'
import { gsap, useGSAP } from '@/motion/gsap'
import { motionDuration, motionEase } from '@/motion/tokens'
import { useReducedMotion } from '@/motion/useReducedMotion'

export type BlurSwapImageProps = {
  src: string
  alt: string
  /** Data URI o imagen de respaldo mientras carga. */
  placeholder?: string
  className?: string
  imgClassName?: string
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined' || !src) {
      resolve()
      return
    }
    const loader = new Image()
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      resolve()
    }
    loader.onload = () => {
      if (typeof loader.decode === 'function') {
        loader.decode().then(done, done)
      } else {
        done()
      }
    }
    loader.onerror = done
    loader.src = src
  })
}

/**
 * `<BlurSwapImage src>`:
 * Al cambiar `src`, aplica `blur(0 → 14px)` + `scale(1 → 1.08)` sin desbordar el contenedor,
 * espera la precarga del nuevo `src`, reemplaza la imagen en el pico del desenfoque y vuelve
 * a `blur(0px)` + `scale(1)`.
 * Soporta interrupción a mitad (cancela el timeline y el pedido anterior) y degrada a un
 * fade de 200 ms con `prefers-reduced-motion`.
 */
export function BlurSwapImage({
  src,
  alt,
  placeholder,
  className = '',
  imgClassName = '',
}: BlurSwapImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const currentSrcRef = useRef<string | null>(null)
  const reqIdRef = useRef(0)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      const img = imgRef.current
      if (!img) return

      // Primer montaje: asignar `src` directamente sin animar transición.
      if (currentSrcRef.current === null) {
        currentSrcRef.current = src
        img.src = src
        img.alt = alt
        gsap.set(img, { filter: 'blur(0px)', scale: 1, opacity: 1 })
        return
      }

      if (currentSrcRef.current === src) {
        img.alt = alt
        return
      }

      const reqId = ++reqIdRef.current
      tlRef.current?.kill()
      tlRef.current = null

      const preload = preloadImage(src)
      const outTl = gsap.timeline()
      tlRef.current = outTl

      if (reduced) {
        gsap.set(img, { filter: 'blur(0px)', scale: 1 })
        const outDone = new Promise<void>((resolve) => {
          outTl.to(img, {
            opacity: 0,
            duration: motionDuration.reduced * 0.5,
            ease: motionEase.ui,
            onComplete: resolve,
          })
        })

        void Promise.all([outDone, preload]).then(() => {
          if (reqId !== reqIdRef.current || !imgRef.current) return
          currentSrcRef.current = src
          imgRef.current.src = src
          imgRef.current.alt = alt

          const inTl = gsap.timeline()
          tlRef.current = inTl
          inTl.to(imgRef.current, {
            opacity: 1,
            duration: motionDuration.reduced,
            ease: motionEase.ui,
          })
        })
      } else {
        const { out, in: inDur, blurPx, scale } = motionDuration.blurSwap
        const outDone = new Promise<void>((resolve) => {
          outTl.to(img, {
            filter: `blur(${blurPx}px)`,
            scale,
            duration: out,
            ease: motionEase.exit,
            onComplete: resolve,
          })
        })

        void Promise.all([outDone, preload]).then(() => {
          if (reqId !== reqIdRef.current || !imgRef.current) return
          currentSrcRef.current = src
          imgRef.current.src = src
          imgRef.current.alt = alt

          const inTl = gsap.timeline()
          tlRef.current = inTl
          inTl.to(imgRef.current, {
            filter: 'blur(0px)',
            scale: 1,
            opacity: 1,
            duration: inDur,
            ease: motionEase.enter,
          })
        })
      }

      return () => {
        outTl.kill()
      }
    },
    {
      dependencies: [src, alt, reduced],
      scope: containerRef,
    },
  )

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-tizon bg-cover bg-center ${className}`}
      style={placeholder ? { backgroundImage: `url(${placeholder})` } : undefined}
    >
      <img
        ref={imgRef}
        alt={alt}
        decoding="async"
        onError={(e) => {
          if (placeholder && e.currentTarget.src !== placeholder) {
            e.currentTarget.src = placeholder
          }
        }}
        className={`block size-full object-cover will-change-[transform,filter] ${imgClassName}`}
      />
    </div>
  )
}
