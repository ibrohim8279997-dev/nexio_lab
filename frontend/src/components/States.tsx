import type { ReactNode } from 'react'
import { useI18n } from '../i18n'

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="page-intro">
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children && <div className="page-intro-copy">{children}</div>}
      </div>
    </section>
  )
}

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n()
  return <div className="state-card" role="status"><span className="spinner" aria-hidden="true"/>{label || t('common.loading')}…</div>
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  const { t } = useI18n()
  return (
    <div className="state-card state-card--error" role="alert">
      <div><strong>{t('common.loadError')}</strong><p>{message}</p></div>
      {retry && <button className="button button--ghost" onClick={retry}>{t('common.retry')}</button>}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-state"><span className="empty-symbol" aria-hidden="true">↗</span><h2>{title}</h2><p>{children}</p></div>
}

export function Avatar({ name, photo, large = false }: { name: string; photo?: string | null; large?: boolean }) {
  const { t } = useI18n()
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'NL'
  return (
    <div className={`avatar ${large ? 'avatar--large' : ''}`}>
      {photo ? <img src={photo} alt={`${t('avatar.photo')}: ${name}`} loading="lazy" /> : <span aria-label={`${t('avatar.empty')}: ${name}`}>{initials}</span>}
    </div>
  )
}

export function mediaUrl(value?: string | { webp_url?: string; original_url?: string } | null) {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.webp_url || value.original_url
}

export function mediaAlt(value: string | { alt?: string } | null | undefined, fallback: string) {
  return typeof value === 'string' ? fallback : value?.alt || fallback
}

export function mediaKey(value: string | { original_url?: string } | null | undefined, fallback: string | number) {
  return typeof value === 'string' ? value : value?.original_url || fallback
}
