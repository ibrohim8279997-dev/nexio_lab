import { Link, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState, PageIntro, mediaAlt, mediaKey, mediaUrl } from '../components/States'
import { useResource } from '../hooks/useResource'
import { useI18n } from '../i18n'
import { api } from '../lib/api'
import type { Project } from '../types'

export function WorksPage() {
  const { t } = useI18n()
  const { data, loading, error, reload } = useResource(() => api<{ data: Project[] }>('/projects').then((response) => response.data), [])
  return <><PageIntro eyebrow={t('works.eyebrow')} title={t('works.title')}><p>{t('works.lead')}</p></PageIntro><section className="section"><div className="container">
    {loading ? <LoadingState label={t('works.loading')}/> : error ? <ErrorState message={error} retry={reload}/> : !data?.length ? <EmptyState title={t('works.emptyTitle')}>{t('works.emptyText')}</EmptyState> : <div className="work-grid">{data.map((project, index) => <Link className="work-card" to={'/works/' + project.slug} key={project.slug}>{project.images?.[0] ? <img src={mediaUrl(project.images[0])} alt={mediaAlt(project.images[0], project.title)} loading="lazy"/> : <div className="work-placeholder"><span>0{index + 1}</span></div>}<div><span>{project.category || t('common.project')}</span><h2>{project.title}</h2><p>{project.description}</p></div></Link>)}</div>}
  </div></section></>
}

export function WorkDetailPage() {
  const { t } = useI18n()
  const { slug = '' } = useParams()
  const { data, loading, error, reload } = useResource(() => api<{ data: Project }>('/projects/' + slug).then((response) => response.data), [slug])
  if (loading) return <div className="route-state container"><LoadingState/></div>
  if (error || !data) return <div className="route-state container"><ErrorState message={error || t('works.notFound')} retry={reload}/><Link to="/works" className="text-link">{t('common.backWorks')}</Link></div>
  return <><PageIntro eyebrow={data.category || t('common.project')} title={data.title}><p>{data.description}</p>{data.external_url && <a className="button" href={data.external_url} target="_blank" rel="noreferrer">{t('works.open')} ↗</a>}</PageIntro>{data.images?.length ? <section className="section"><div className="container project-gallery">{data.images.map((asset, index) => <img key={mediaKey(asset, index)} src={mediaUrl(asset)} alt={mediaAlt(asset, data.title + ', ' + t('works.image') + ' ' + (index + 1))} loading="lazy"/>)}</div></section> : <section className="section"><div className="container"><EmptyState title={t('works.noImagesTitle')}>{t('works.noImagesText')}</EmptyState></div></section>}</>
}
