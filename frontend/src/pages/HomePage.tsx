import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useResource } from '../hooks/useResource'
import type { Employee, Project, Service, SiteContent } from '../types'
import { Avatar, ErrorState, mediaUrl } from '../components/States'
import { useI18n } from '../i18n'
import { telegramContactUrl } from '../lib/telegram'

interface HomeData { site?: SiteContent; services?: Service[]; projects?: Project[]; employees?: Employee[] }

const serviceDirections = [
  { slug: 'web', number: '01', name: 'Веб-сайты', text: 'Шаблонные и индивидуальные сайты для бизнеса.' },
  { slug: 'systems', number: '02', name: 'Системы', text: 'CRM, складской учёт и системы управления бизнесом.' },
  { slug: 'applications', number: '03', name: 'Приложения', text: 'Android APK и Windows-приложения под ключ.' },
]

const stats = [['▣', '50+', 'Проектов'], ['☆', '98%', 'Довольных клиентов'], ['▤', '5+', 'Лет опыта'], ['☏', '24/7', 'Поддержка']] as const
const whyItems = [
  ['⌬', 'Современные технологии', 'Актуальный стек, быстрые и масштабируемые решения'],
  ['◎', 'Прозрачный процесс', 'Понятные этапы и регулярные отчёты по проекту'],
  ['◷', 'Сдача в срок', 'Чёткие сроки, которые мы выполняем'],
  ['✦', 'Постоянная поддержка', 'Остаёмся на связи после запуска 24/7'],
] as const
const sixServices = [
  ['web', '◍', 'Веб-разработка', 'Современные сайты и интернет-магазины'],
  ['systems', '↗', 'CRM-интеграция', 'Автоматизация ваших процессов'],
  ['systems', '≋', 'Своя CRM', 'CRM-система под ваш бизнес'],
  ['applications', '▯', 'Мобильные приложения', 'Android и iOS приложения'],
  ['applications', '▭', 'Десктоп ПО', 'Приложения для Windows'],
  ['web', '⛒', 'Маркетплейсы', 'Онлайн-платформы для торговли'],
] as const

export function HomePage() {
  const { t } = useI18n()
  const { data, error, reload } = useResource(() => api<{ data: HomeData }>('/home').then((r) => r.data), [])
  const services = data?.services?.length ? data.services : serviceDirections
  const employees = data?.employees || []
  const projects = data?.projects || []
  const projectTelegram = telegramContactUrl(data?.site?.project_inquiry, t('telegram.home'))

  return <>
    <section className="hero">
      <div className="hero-orbit hero-orbit--one"/><div className="hero-orbit hero-orbit--two"/>
      <div className="container hero-grid">
        <div className="hero-copy"><span className="eyebrow"><i/> {t('home.eyebrow')}</span><h1>{data?.site?.hero_title || <>{t('home.titleBefore')} <em>{t('home.titleAccent')}</em></>}</h1><p>{data?.site?.hero_text || t('home.lead')}</p><div className="hero-actions">{projectTelegram ? <a className="button" href={projectTelegram} target="_blank" rel="noreferrer">{t('home.discuss')} <span>↗</span></a> : <Link className="button" to="/services">{t('home.discuss')} <span>↗</span></Link>}<Link className="text-link" to="/works">{t('home.viewWorks')} <span>→</span></Link></div></div>
        <div className="hero-visual" aria-hidden="true"><img className="hero-ribbon" src="/brand/hero-ribbon.webp" alt="" fetchPriority="high"/></div>
      </div>
      <div className="container hero-foot"><span>Future Starts Here</span><a href="#directions">{t('home.directions')} ↓</a></div>
    </section>
    <div className="container"><div className="stats-bar">{stats.map(([icon, value, label]) => <div key={label}><span aria-hidden="true">{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>)}</div></div>
    <section id="directions" className="section section--light"><div className="container">
      <div className="section-heading"><div><span className="eyebrow">{t('home.what')}</span><h2>{t('home.servicesTitle')}</h2></div><Link to="/services" className="text-link">{t('home.allServices')} →</Link></div>
      {error && <ErrorState message={error} retry={reload}/>} 
      <div className="service-grid service-grid--six">{sixServices.map(([slug, icon, name, text]) => <Link to={`/services/${slug}`} className="service-card" key={name}><span className="service-icon" aria-hidden="true">{icon}</span><div><h3>{name}</h3><p>{text}</p></div><span className="circle-arrow" aria-hidden="true">↗</span></Link>)}</div>
      <div className="why-card"><div className="why-visual" aria-hidden="true"><img src="/brand/hero-ribbon.webp" alt="" loading="lazy"/></div><div className="why-body"><span className="eyebrow">Why Nexio Lab?</span><h2>Ваш надёжный <em>технологический</em> партнёр</h2><p className="why-lead">Берём на себя весь путь: от идеи и дизайна до запуска и поддержки.</p><ul>{whyItems.map(([icon, title, text]) => <li key={title}><span aria-hidden="true">{icon}</span><div><strong>{title}</strong><small>{text}</small></div></li>)}</ul><Link className="button" to="/contacts">Узнать больше <span>→</span></Link></div></div>
      <div className="works-strip"><div><span className="eyebrow">{t('home.featured')}</span><h2>{t('home.worksTitle')}</h2></div>{projects.length ? <div className="project-mini-grid">{projects.slice(0, 2).map((project) => <Link to={`/works/${project.slug}`} key={project.slug}><span>{project.category || t('common.project')}</span><strong>{project.title}</strong></Link>)}</div> : <p className="honest-note">{t('home.worksEmpty')}</p>}</div>
    </div></section>
    <section className="section section--dark"><div className="container"><div className="section-heading section-heading--dark"><div><span className="eyebrow">{t('home.people')}</span><h2>{t('home.teamTitle')}</h2></div><Link to="/team" className="text-link text-link--light">{t('home.allTeam')} →</Link></div>{employees.length ? <div className="team-row">{employees.slice(0, 6).map((employee) => <Link className="person-card" to={`/team/${employee.slug}`} key={employee.slug}><Avatar name={employee.name} photo={mediaUrl(employee.photo || employee.photo_url)}/><div><h3>{employee.name}</h3><p>{employee.role || employee.position}</p></div><span>↗</span></Link>)}</div> : <div className="dark-empty"><p>{t('home.teamEmpty')}</p><Link to="/team">{t('home.teamSection')} →</Link></div>}</div></section>
    <section className="cta-section"><div className="container cta-inner"><div><span className="eyebrow">{t('home.ctaEyebrow')}</span><h2>{t('home.ctaTitle').split('\n').map((line, index) => <span key={line}>{index > 0 && <br/>}{line}</span>)}</h2></div><Link className="button button--white" to="/services">{t('home.ctaButton')} <span>↗</span></Link></div></section>
  </>
}
