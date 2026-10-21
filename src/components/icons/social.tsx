import type { SVGProps } from 'react'
import type { RedSocial } from '@/config/site.config'

type IconProps = SVGProps<SVGSVGElement> & {
  red: RedSocial
}

export function SocialIcon({ red, className = 'size-4', ...rest }: IconProps) {
  switch (red) {
    case 'instagram':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={className}
          {...rest}
        >
          <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5" />
          <circle cx="12" cy="12" r="4.25" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'facebook':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className={className}
          {...rest}
        >
          <path d="M13.6 21v-7.8h2.6l.4-3h-3V8.3c0-.87.24-1.46 1.5-1.46h1.6V4.14c-.28-.04-1.23-.12-2.34-.12-2.32 0-3.9 1.41-3.9 4.01v2.17H7.9v3h2.56V21h3.14Z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className={className}
          {...rest}
        >
          <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          className={className}
          {...rest}
        >
          <path d="M21.58 7.19a2.75 2.75 0 0 0-1.94-1.95C17.92 4.78 12 4.78 12 4.78s-5.92 0-7.64.46a2.75 2.75 0 0 0-1.94 1.95C1.96 8.91 1.96 12 1.96 12s0 3.09.46 4.81a2.75 2.75 0 0 0 1.94 1.95c1.72.46 7.64.46 7.64.46s5.92 0 7.64-.46a2.75 2.75 0 0 0 1.94-1.95c.46-1.72.46-4.81.46-4.81s0-3.09-.46-4.81ZM10 15.15V8.85L15.45 12 10 15.15Z" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={className}
          {...rest}
        >
          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
        </svg>
      )
  }
}
