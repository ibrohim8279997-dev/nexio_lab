import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ThemeToggle } from '../components/ThemeToggle'
import { useI18n } from '../i18n'

function StatusShell({ code, eyebrow, title, text, action, onAction }: { code: string; eyebrow: string; title: string; text: string; action: string; onAction?: () => void }) {
  return <main className="status-page" id="main-content">
    <header className="status-page-header"><Brand compact/><div><LanguageSwitcher/><ThemeToggle/></div></header>
    <section className="status-page-card">
      <div className="status-page-code" aria-hidden="true"><span>{code}</span><i/><i/><i/></div>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
      {onAction ? <button className="button" type="button" onClick={onAction}>{action} ↗</button> : <Link className="button" to="/">{action} ↗</Link>}
    </section>
    <div className="status-page-orbit" aria-hidden="true"/>
  </main>
}

export function NotFoundPage() {
  const { t } = useI18n()
  return <StatusShell code="404" eyebrow={t('notFound.eyebrow')} title={t('notFound.title')} text={t('notFound.text')} action={t('notFound.home')}/>
}

export function OfflinePage() {
  const { t } = useI18n()
  return <StatusShell code="OFF" eyebrow={t('offline.eyebrow')} title={t('offline.title')} text={t('offline.text')} action={t('offline.retry')} onAction={() => window.location.reload()}/>
}
