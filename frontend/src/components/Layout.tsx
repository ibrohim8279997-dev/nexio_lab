import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import type { PublicContacts, SiteContent } from '../types'
import { Brand } from './Brand'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useI18n } from '../i18n'
import { telegramContactUrl } from '../lib/telegram'

const navItems = [['/services', 'nav.services'], ['/works', 'nav.works'], ['/team', 'nav.team'], ['/contacts', 'nav.contacts']] as const

function safeHref(kind: string, value?: string) {
  if (!value) return undefined
  if (kind === 'phone') return `tel:${value.replace(/[^+\d]/g, '')}`
  if (kind === 'email') return `mailto:${value}`
  if (/^https?:\/\//.test(value)) return value
  if (kind === 'telegram') return `https://t.me/${value.replace(/^@/, '')}`
  return value
}

export function Layout() {
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const [contacts, setContacts] = useState<PublicContacts & SiteContent>({})
  const location = useLocation()

  useEffect(() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }) }, [location.pathname])
  useEffect(() => {
    api<{ data: PublicContacts | { contacts?: PublicContacts } | null }>('/site')
      .then((response) => {
        const payload = response.data
        const nextContacts: PublicContacts & SiteContent = payload && 'contacts' in payload
          ? payload.contacts || {}
          : (payload as (PublicContacts & SiteContent) | null) || {}
        setContacts(nextContacts)
      })
      .catch(() => undefined)
  }, [])
  const nav = navItems.map(([to, key]) => [to, t(key)] as const)
  const projectTelegram = telegramContactUrl(contacts.project_inquiry, t('telegram.home'))

  return <div className="app-shell">
    <header className="site-header"><div className="container nav-wrap"><Brand compact/><nav id="site-navigation" className={menuOpen ? 'site-nav is-open' : 'site-nav'} aria-label={t('a11y.navigation')}>{nav.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}{projectTelegram ? <a className="button button--small" href={projectTelegram} target="_blank" rel="noreferrer">{t('nav.start')}</a> : <Link className="button button--small" to="/services">{t('nav.start')}</Link>}</nav><div className="header-controls"><LanguageSwitcher/><ThemeToggle/><button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen((value) => !value)}><span className="sr-only">{t('nav.menu')}</span><i/><i/><i/></button></div></div></header>
    <main id="main-content"><Outlet/></main>
    <footer className="footer"><div className="container footer-grid"><div><Brand compact/><p className="footer-slogan">{contacts.slogan || 'Future Starts Here'}</p><span className="status-dot"><i/> {contacts.online_label || t('footer.online')}</span></div><div><h2>{t('footer.navigation')}</h2><div className="footer-links">{nav.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}</div></div><div><h2>{t('footer.contact')}</h2>{contacts.director_name && <p className="muted">{t('footer.director')}: {contacts.director_name}</p>}{contacts.phone && <a href={safeHref('phone', contacts.phone)}>{contacts.phone}</a>}{contacts.email && <a href={safeHref('email', contacts.email)}>{contacts.email}</a>}{!contacts.phone && !contacts.email && <p className="muted">{t('footer.empty')}</p>}</div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Nexio Lab</span><Link to="/admin">{t('footer.team')}</Link></div></footer>
  </div>
}
