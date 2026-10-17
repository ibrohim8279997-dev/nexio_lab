import { useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState, PageIntro } from '../components/States'
import { colorPalettes, fontOptions, siteStyles } from '../data/designCatalog'
import { localizeServicePlan } from '../data/serviceTranslations'
import { useResource } from '../hooks/useResource'
import { useI18n } from '../i18n'
import { api } from '../lib/api'
import { formatServicePrice, telegramProjectUrl } from '../lib/telegram'
import type { DesignSelection, ProjectInquiryContact, Service, ServiceExtra, ServicePlan, SiteContent } from '../types'

const allowed = ['web', 'systems', 'applications']
const icons: Record<string, string> = { web: '⌁', systems: '◫', applications: '△' }
type ServicesPayload = { services: Service[]; contact?: ProjectInquiryContact }

async function loadServices(): Promise<ServicesPayload> {
  const [servicesResponse, siteResponse] = await Promise.all([api<{ data: Service[] }>('/services'), api<{ data: SiteContent | null }>('/site')])
  return { services: servicesResponse.data.filter((service) => allowed.includes(service.slug)), contact: siteResponse.data?.project_inquiry }
}

function DesignPicker({ value, onChange }: { value: DesignSelection; onChange: (value: DesignSelection) => void }) {
  const { t } = useI18n()
  const [customColors, setCustomColors] = useState<[string, string, string]>(['#0B1F4D', '#1687FF', '#EAF6FF'])
  const hasSelection = Boolean(value.paletteCode || value.fontCode || value.styleCode)
  const customPaletteSelected = Boolean(value.paletteCode && !value.paletteCode.startsWith('NX-C'))
  const customColorsValid = customColors.every((color) => /^#[0-9A-F]{6}$/i.test(color))
  const customPaletteCode = customColors.map((color) => color.toUpperCase()).join(', ')
  const choose = (key: keyof DesignSelection, code: string) => onChange({ ...value, [key]: value[key] === code ? undefined : code })

  function updateCustomColor(index: number, color: string) {
    const next = customColors.map((item, itemIndex) => itemIndex === index ? color.toUpperCase() : item) as [string, string, string]
    setCustomColors(next)
    if (customPaletteSelected && next.every((item) => /^#[0-9A-F]{6}$/i.test(item))) onChange({ ...value, paletteCode: next.join(', ') })
  }

  return <section className="design-picker" aria-labelledby="design-picker-title">
    <div className="design-picker-head"><div><span className="eyebrow">Nexio Lab Style Catalog</span><h3 id="design-picker-title">{t('services.designTitle')}</h3><p>{t('services.designText')}</p></div>{hasSelection && <button className="design-reset" type="button" onClick={() => onChange({})}>{t('services.designReset')}</button>}</div>
    <div className="design-picker-groups">
      <details open><summary><span>{t('services.designPalette')}</span><strong>{value.paletteCode || t('services.designChoose')}</strong></summary><div className="design-choice-grid design-choice-grid--colors">{colorPalettes.map((option) => <button className="design-choice color-choice" type="button" key={option.code} aria-pressed={value.paletteCode === option.code} onClick={() => choose('paletteCode', option.code)}><span className="palette-swatches" aria-hidden="true">{option.colors.map((color) => <i key={color} style={{ background: color }}/>)}</span><span><b>{option.code}</b><small>{option.name}</small></span></button>)}</div><div className={'custom-palette' + (customPaletteSelected ? ' custom-palette--selected' : '')}><div><b>{t('services.designCustomColors')}</b><small>{t('services.designCustomHint')}</small></div><div className="custom-color-fields">{customColors.map((color, index) => <label className="custom-color-control" key={index}><span className="custom-color-swatch" style={{ background: /^#[0-9A-F]{6}$/i.test(color) ? color : 'transparent' }} aria-hidden="true"/><span className="sr-only">{t('services.designCustomColor')} {index + 1}</span><input type="text" value={color} maxLength={7} inputMode="text" autoCapitalize="characters" autoCorrect="off" spellCheck={false} aria-invalid={!/^#[0-9A-F]{6}$/i.test(color)} onChange={(event) => updateCustomColor(index, event.target.value)}/></label>)}</div><button className="button button--small" type="button" disabled={!customColorsValid} onClick={() => onChange({ ...value, paletteCode: customPaletteSelected ? undefined : customPaletteCode })}>{customPaletteSelected ? t('services.designCustomRemove') : t('services.designCustomApply')}</button></div></details>
      <details><summary><span>{t('services.designFont')}</span><strong>{value.fontCode || t('services.designChoose')}</strong></summary><div className="design-choice-grid">{fontOptions.map((option) => <button className="design-choice font-choice" type="button" key={option.code} aria-pressed={value.fontCode === option.code} onClick={() => choose('fontCode', option.code)}><span className="font-sample" style={{ fontFamily: option.family }}>Aa</span><span><b>{option.code}</b><small>{option.name}</small></span></button>)}</div></details>
      <details><summary><span>{t('services.designStyle')}</span><strong>{value.styleCode || t('services.designChoose')}</strong></summary><div className="design-choice-grid">{siteStyles.map((option) => <button className="design-choice style-choice" type="button" key={option.code} aria-pressed={value.styleCode === option.code} onClick={() => choose('styleCode', option.code)}><span className={'style-preview style-preview--' + option.code.toLowerCase()} aria-hidden="true"><i/><i/><i/></span><span><b>{option.code}</b><small>{option.name}</small></span></button>)}</div></details>
    </div>
    {hasSelection && <div className="design-selection-summary"><span>{t('services.designSelected')}</span><strong>{[value.paletteCode, value.fontCode, value.styleCode].filter(Boolean).join(' · ')}</strong></div>}
  </section>
}

function TelegramLink({ plan, contact, children, className = 'button' }: { plan: ServicePlan; contact?: ProjectInquiryContact; children: ReactNode; className?: string }) {
  const { language } = useI18n()
  const href = telegramProjectUrl(contact, localizeServicePlan(plan, language), [], {}, language)
  return href ? <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a> : <Link className={className} to="/contacts">{children}</Link>
}

export function ServicesPage() {
  const { language, t } = useI18n()
  const { data, loading, error, reload } = useResource(loadServices, [])
  return <><PageIntro eyebrow={t('services.eyebrow')} title={t('services.title')}><p>{t('services.lead')}</p></PageIntro><section className="section section--light"><div className="container">
    {loading ? <LoadingState/> : error ? <ErrorState message={error} retry={reload}/> : !data?.services.length ? <EmptyState title={t('services.emptyTitle')}>{t('services.emptyText')}</EmptyState> : <div className="service-grid pricing-directions">{data.services.map((service, index) => {
      const startingPlan = service.plans?.[0] ? localizeServicePlan(service.plans[0], language) : undefined
      return <article className="service-card pricing-direction-card" key={service.slug}><span className="card-number">0{index + 1}</span><span className="service-icon">{icons[service.slug] || '◇'}</span><h2>{t('service.' + service.slug + '.name', service.name)}</h2><p>{t('service.' + service.slug + '.summary', service.summary)}</p>{startingPlan && <div className="direction-price"><strong>{formatServicePrice(startingPlan, t('services.from'))}</strong><span>{startingPlan.duration}</span></div>}<div className="service-card-actions"><Link className="button button--ghost" to={'/services/' + service.slug}>{t('services.more')}</Link>{startingPlan && <TelegramLink className="button button--small" plan={startingPlan} contact={data.contact}>{t('services.discuss')}</TelegramLink>}</div></article>
    })}</div>}
  </div></section></>
}

function PlanCard({ plan, contact, showDesignCatalog = false }: { plan: ServicePlan; contact?: ProjectInquiryContact; showDesignCatalog?: boolean }) {
  const { language, t } = useI18n()
  const [selected, setSelected] = useState<number[]>([])
  const [designSelection, setDesignSelection] = useState<DesignSelection>({})
  const displayPlan = localizeServicePlan(plan, language)
  const selectedOptions = selected.map((index) => displayPlan.extras[index]).filter(Boolean)
  const href = telegramProjectUrl(contact, displayPlan, selectedOptions, designSelection, language)
  const canCalculateTotal = selectedOptions.every((option) => option.price_amount !== null && option.price_amount !== undefined)
  const total = Number(displayPlan.price_amount) + selectedOptions.reduce((sum, option) => sum + Number(option.price_amount || 0), 0)

  function toggle(index: number) {
    setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])
  }

  return <article className="plan-card" id={displayPlan.slug}>
    <div className="plan-card-head"><div><span className="eyebrow">{t('services.tariff')}</span><h2>{displayPlan.name}</h2></div><div className="plan-price"><strong>{formatServicePrice(displayPlan, t('services.from'))}</strong><span>{displayPlan.duration}</span></div></div>
    {displayPlan.description && <p className="plan-description">{displayPlan.description}</p>}
    <div className="plan-facts"><span><b>{t('services.duration')}</b>{displayPlan.duration}</span>{displayPlan.included_revisions !== null && displayPlan.included_revisions !== undefined && <span><b>{t('services.revisions')}</b>{t('services.revisionsCount').replace('{count}', String(displayPlan.included_revisions))}</span>}{displayPlan.extra_revision_price !== null && displayPlan.extra_revision_price !== undefined && <span><b>{t('services.extraRevision')}</b>{'+$' + Number(displayPlan.extra_revision_price)}</span>}</div>
    <div className="plan-content"><div><h3>{t('services.included')}</h3><ul className="feature-list">{displayPlan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div>{displayPlan.extras.length > 0 && <div><h3>{t('services.extras')}</h3><div className="extra-options">{displayPlan.extras.map((option, index) => <label key={option.name}><input type="checkbox" checked={selected.includes(index)} onChange={() => toggle(index)}/><span>{option.name}</span><strong>{option.price_label}</strong></label>)}</div></div>}</div>
    {showDesignCatalog && <DesignPicker value={designSelection} onChange={setDesignSelection}/>}
    {displayPlan.notice && <p className="plan-notice">{displayPlan.notice}</p>}
    {selectedOptions.length > 0 && canCalculateTotal && <div className="plan-total"><span>{t('services.preliminary')}</span><strong>{(displayPlan.price_format === 'from' ? t('services.from') + ' ' : '') + '$' + total.toLocaleString('en-US')}</strong></div>}
    <div className="plan-cta"><div><strong>{t('services.ctaTitle')}</strong><span>{contact?.name ? contact.name + (contact.position ? ' · ' + contact.position : '') : t('services.manager')}</span></div>{href ? <a className="button" href={href} target="_blank" rel="noreferrer">✈ {t('services.telegram')}</a> : <Link className="button" to="/contacts">{t('services.contact')}</Link>}</div>
  </article>
}

export function ServiceDetailPage() {
  const { t } = useI18n()
  const { slug = '' } = useParams()
  const { data, loading, error, reload } = useResource(async () => {
    const [serviceResponse, siteResponse] = await Promise.all([api<{ data: Service }>('/services/' + slug), api<{ data: SiteContent | null }>('/site')])
    return { service: serviceResponse.data, contact: siteResponse.data?.project_inquiry }
  }, [slug])
  if (!allowed.includes(slug)) return <Navigate to="/404" replace/>
  if (loading) return <div className="route-state container"><LoadingState/></div>
  if (error || !data) return <div className="route-state container"><ErrorState message={error || t('common.loadError')} retry={reload}/></div>
  return <><PageIntro eyebrow={t('services.eyebrow')} title={t('service.' + slug + '.name', data.service.name)}><p>{t('service.' + slug + '.description', data.service.description || data.service.summary)}</p></PageIntro><section className="section pricing-detail"><div className="container"><div className="plans-stack">{data.service.plans?.map((plan) => <PlanCard key={plan.id} plan={plan} contact={data.contact} showDesignCatalog={slug === 'web'}/>)}</div><div className="process"><span className="eyebrow">{t('services.how')}</span><h2>{t('services.processTitle')}</h2><ol><li><b>{t('services.step1')}</b><span>{t('services.step1Text')}</span></li><li><b>{t('services.step2')}</b><span>{t('services.step2Text')}</span></li><li><b>{t('services.step3')}</b><span>{t('services.step3Text')}</span></li><li><b>{t('services.step4')}</b><span>{t('services.step4Text')}</span></li></ol></div></div></section></>
}
