import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar, EmptyState, ErrorState, LoadingState, PageIntro, mediaUrl } from '../components/States'
import { useResource } from '../hooks/useResource'
import { useI18n } from '../i18n'
import { api } from '../lib/api'
import type { Department, Employee } from '../types'

const departments: Department[] = ['management', 'it', 'product', 'design', 'marketing', 'sales', 'hr', 'finance', 'operations', 'support']

function TeamGroup({ title, people }: { title: string; people: Employee[] }) {
  const { t } = useI18n()
  if (!people.length) return null
  return <div className="team-group"><div className="group-title"><span className="eyebrow">{t('team.department')}</span><h2>{title}</h2></div><div className="team-grid">{people.map((person) => <Link className="team-card" to={'/team/' + person.slug} key={person.slug}><Avatar name={person.name} photo={mediaUrl(person.photo || person.photo_url)} large/><div><span>{person.role || person.position}</span><h3>{person.name}</h3><p>{person.short_bio || t('team.bioEmpty')}</p></div><b aria-hidden="true">↗</b></Link>)}</div></div>
}

export function TeamPage() {
  const { t } = useI18n()
  const { data, loading, error, reload } = useResource(() => api<{ data: Employee[] }>('/employees').then((response) => response.data), [])
  const people = data || []
  return <><PageIntro eyebrow={t('team.eyebrow')} title={t('team.title')}><p>{t('team.lead')}</p></PageIntro><section className="section"><div className="container">
    {loading ? <LoadingState label={t('team.loading')}/> : error ? <ErrorState message={error} retry={reload}/> : !people.length ? <EmptyState title={t('team.emptyTitle')}>{t('team.emptyText')}</EmptyState> : departments.map((department) => <TeamGroup key={department} title={t('department.' + department)} people={people.filter((person) => person.department === department)}/>)}
  </div></section></>
}

export function TeamDetailPage() {
  const { t } = useI18n()
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useResource(() => api<{ data: Employee }>('/employees/' + slug).then((response) => response.data), [slug])
  useEffect(() => { if (data?.slug && data.slug !== slug) navigate('/team/' + data.slug, { replace: true }) }, [data?.slug, navigate, slug])
  if (loading) return <div className="route-state container"><LoadingState/></div>
  if (error || !data) return <div className="route-state container"><ErrorState message={error || t('team.notFound')} retry={reload}/><Link to="/team" className="text-link">{t('common.backTeam')}</Link></div>
  return <section className="profile-section"><div className="container profile-grid"><aside><Avatar name={data.name} photo={mediaUrl(data.photo || data.photo_url)} large/><span className="profile-department">{t('department.' + data.department, data.department)}</span></aside><article>
    <span className="eyebrow">{data.role || data.position}</span><h1>{data.name}</h1>{data.short_bio && <p className="profile-lead">{data.short_bio}</p>}
    <div className="profile-content">{data.activity && <section><h2>{t('team.activity')}</h2><p>{data.activity}</p></section>}{(data.joined_story || data.company_story) && <section><h2>{t('team.inNexio')}</h2><p>{data.joined_story || data.company_story}</p></section>}{data.experience && <section><h2>{t('team.experience')}</h2><p>{data.experience}</p></section>}</div>
    {data.reviews?.length ? <section className="reviews"><h2>{t('team.reviews')}</h2>{data.reviews.map((review) => <blockquote key={review.id}><div aria-label={review.rating + ' ' + t('team.rating')}>{'★'.repeat(review.rating)}</div><p>{review.text}</p>{review.author_name && <cite>{review.author_name}</cite>}</blockquote>)}</section> : null}
  </article></div></section>
}
