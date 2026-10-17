import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../../lib/api'
import { useI18n } from '../../i18n'
import type { Employee, Service, ServiceExtra, ServicePlan, SiteContent } from '../../types'

type AdminService = Service & { id: number; plans: ServicePlan[] }
type AdminSite = SiteContent & {
  slogan: string
  availability_text: string
  address_confirmed: boolean
  project_inquiry_active: boolean
  telegram?: string | null
  phone?: string | null
}

const emptyPlan = {
  service_id: '',
  slug: '',
  name: '',
  description: '',
  price_amount: 300,
  price_format: 'from' as 'fixed' | 'from',
  currency: 'USD',
  duration: '',
  included_revisions: 3,
  extra_revision_price: 10,
  features: [] as string[],
  extras: [] as ServiceExtra[],
  notice: '',
  sort_order: 0,
  is_active: true,
}

function extrasText(extras: ServiceExtra[]) {
  return extras.map((extra) => [extra.name, extra.price_label, extra.price_amount ?? ''].join(' | ')).join('\n')
}

function parseExtras(value: string): ServiceExtra[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [name = '', price_label = '', rawAmount = ''] = line.split('|').map((part) => part.trim())
    const amount = rawAmount === '' ? null : Number(rawAmount)
    return { name, price_label, price_amount: Number.isFinite(amount) ? amount : null }
  }).filter((extra) => extra.name && extra.price_label)
}

export function PricingPanel() {
  const { t } = useI18n()
  const [services, setServices] = useState<AdminService[]>([])
  const [employees, setEmployees] = useState<Array<Employee & { id: number }>>([])
  const [site, setSite] = useState<AdminSite | null>(null)
  const [newPlan, setNewPlan] = useState(emptyPlan)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    setError('')
    try {
      const [serviceResponse, siteResponse, employeeResponse] = await Promise.all([
        api<{ data: AdminService[] }>('/admin/services?per_page=100'),
        api<{ data: AdminSite }>('/admin/site-settings'),
        api<{ data: Array<Employee & { id: number }> }>('/admin/employees?per_page=100'),
      ])
      setServices(serviceResponse.data)
      setSite({
        ...siteResponse.data,
        project_inquiry_telegram: siteResponse.data.project_inquiry_telegram || siteResponse.data.telegram || '',
        project_inquiry_active: siteResponse.data.project_inquiry_active ?? true,
      })
      setEmployees(employeeResponse.data)
      if (!newPlan.service_id && serviceResponse.data[0]) setNewPlan((current) => ({ ...current, service_id: String(serviceResponse.data[0].id) }))
    } catch (caught) {
      setError((caught as ApiError).message)
    }
  }

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function updateService(serviceId: number, patch: Partial<AdminService>) {
    setServices((current) => current.map((service) => service.id === serviceId ? { ...service, ...patch } : service))
  }

  function updatePlan(serviceId: number, planId: number, patch: Partial<ServicePlan>) {
    setServices((current) => current.map((service) => service.id === serviceId ? { ...service, plans: service.plans.map((plan) => plan.id === planId ? { ...plan, ...patch } : plan) } : service))
  }

  async function saveDirection(service: AdminService) {
    try {
      await api('/admin/services/' + service.id, { method: 'PUT', body: { name: service.name, short_description: service.short_description || service.summary, description: service.description || '', sort_order: Number(service.sort_order || 0), is_published: Boolean(service.is_published) } })
      setNotice(t('pricing.directionSaved').replace('{name}', service.name))
      await load()
    } catch (caught) { setError((caught as ApiError).message) }
  }

  async function savePlan(plan: ServicePlan) {
    try {
      await api('/admin/service-plans/' + plan.id, { method: 'PUT', body: {
        slug: plan.slug, name: plan.name, description: plan.description || '', price_amount: Number(plan.price_amount), price_format: plan.price_format, currency: plan.currency, duration: plan.duration,
        included_revisions: plan.included_revisions === null ? null : Number(plan.included_revisions), extra_revision_price: plan.extra_revision_price === null ? null : Number(plan.extra_revision_price),
        features: plan.features, extras: plan.extras, notice: plan.notice || '', sort_order: Number(plan.sort_order || 0), is_active: Boolean(plan.is_active),
      } })
      setNotice(t('pricing.planSaved').replace('{name}', plan.name))
      await load()
    } catch (caught) { setError((caught as ApiError).message) }
  }

  async function createPlan(event: FormEvent) {
    event.preventDefault()
    try {
      await api('/admin/services/' + newPlan.service_id + '/plans', { method: 'POST', body: { ...newPlan, service_id: undefined } })
      setNewPlan((current) => ({ ...emptyPlan, service_id: current.service_id }))
      setNotice(t('pricing.planAdded'))
      await load()
    } catch (caught) { setError((caught as ApiError).message) }
  }

  async function removePlan(plan: ServicePlan) {
    if (!window.confirm(t('pricing.deleteConfirm').replace('{name}', plan.name))) return
    try {
      await api('/admin/service-plans/' + plan.id, { method: 'DELETE' })
      setNotice(t('pricing.planDeleted'))
      await load()
    } catch (caught) { setError((caught as ApiError).message) }
  }

  async function saveContact(event: FormEvent) {
    event.preventDefault()
    if (!site) return
    try {
      await api('/admin/site-settings', { method: 'PUT', body: { ...site } })
      setNotice(t('pricing.contactSaved'))
      await load()
    } catch (caught) { setError((caught as ApiError).message) }
  }

  function assignEmployee(employeeId: string) {
    if (!site) return
    const employee = employees.find((item) => String(item.id) === employeeId)
    setSite({ ...site, project_inquiry_employee_id: employee ? employee.id : null, project_inquiry_name: employee?.name || site.project_inquiry_name || '', project_inquiry_position: employee?.position || employee?.role || site.project_inquiry_position || '' })
  }

  return <section className="admin-section pricing-admin">
    {error && <div className="form-error" role="alert">{error}</div>}
    {notice && <div className="form-success" role="status">{notice}</div>}
    {site && <form className="editor-card" onSubmit={saveContact}><div className="editor-head"><div><span className="eyebrow">{t('pricing.contacts')}</span><h2>{t('pricing.inquiries')}</h2></div></div><div className="form-grid">
      <label>{t('pricing.employee')}<select value={site.project_inquiry_employee_id || ''} onChange={(event) => assignEmployee(event.target.value)}><option value="">{t('pricing.ownerManual')}</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} — {employee.position || employee.role}</option>)}</select></label>
      <label>Telegram username<input value={site.project_inquiry_telegram || ''} onChange={(event) => setSite({ ...site, project_inquiry_telegram: event.target.value })} placeholder="@username" required/></label>
      <label>{t('pricing.employeeName')}<input value={site.project_inquiry_name || ''} onChange={(event) => setSite({ ...site, project_inquiry_name: event.target.value })}/></label>
      <label>{t('form.position')}<input value={site.project_inquiry_position || ''} onChange={(event) => setSite({ ...site, project_inquiry_position: event.target.value })}/></label>
      <label>{t('form.phone')}<input value={site.project_inquiry_phone || ''} onChange={(event) => setSite({ ...site, project_inquiry_phone: event.target.value })}/></label>
      <label className="check"><input type="checkbox" checked={site.project_inquiry_active} onChange={(event) => setSite({ ...site, project_inquiry_active: event.target.checked })}/> {t('form.active')}</label>
    </div><button className="button" type="submit">{t('pricing.saveContact')}</button></form>}

    <div className="editor-card"><div className="editor-head"><div><span className="eyebrow">{t('pricing.publicPrice')}</span><h2>{t('pricing.directionsPlans')}</h2></div></div>
      <div className="pricing-admin-services">{services.filter((service) => ['web', 'systems', 'applications'].includes(service.slug)).map((service) => <article className="pricing-admin-service" key={service.id}>
        <div className="form-grid"><label>{t('pricing.directionName')}<input value={service.name} onChange={(event) => updateService(service.id, { name: event.target.value })}/></label><label>{t('form.order')}<input type="number" min="0" value={service.sort_order || 0} onChange={(event) => updateService(service.id, { sort_order: Number(event.target.value) })}/></label><label className="wide">{t('admin.shortDescription')}<textarea value={service.short_description || service.summary} onChange={(event) => updateService(service.id, { short_description: event.target.value })}/></label><label className="check"><input type="checkbox" checked={Boolean(service.is_published)} onChange={(event) => updateService(service.id, { is_published: event.target.checked })}/> {t('form.published')}</label></div><button className="table-action" type="button" onClick={() => void saveDirection(service)}>{t('pricing.saveDirection')}</button>
        <div className="pricing-plan-editors">{service.plans.map((plan) => <div className="pricing-plan-editor" key={plan.id}><div className="editor-head"><h3>{plan.name}</h3><button className="table-action table-action--danger" type="button" onClick={() => void removePlan(plan)}>{t('form.delete')}</button></div><div className="form-grid">
          <label>{t('form.name')}<input value={plan.name} onChange={(event) => updatePlan(service.id, plan.id, { name: event.target.value })}/></label><label>{t('form.slug')}<input value={plan.slug} onChange={(event) => updatePlan(service.id, plan.id, { slug: event.target.value.toLowerCase() })}/></label>
          <label>{t('pricing.price')}<input type="number" min="0" value={plan.price_amount} onChange={(event) => updatePlan(service.id, plan.id, { price_amount: Number(event.target.value) })}/></label><label>{t('pricing.priceFormat')}<select value={plan.price_format} onChange={(event) => updatePlan(service.id, plan.id, { price_format: event.target.value as 'fixed' | 'from' })}><option value="fixed">{t('pricing.fixed')}</option><option value="from">{t('pricing.from')}</option></select></label>
          <label>{t('pricing.duration')}<input value={plan.duration} onChange={(event) => updatePlan(service.id, plan.id, { duration: event.target.value })}/></label><label>{t('pricing.revisions')}<input type="number" min="0" value={plan.included_revisions ?? ''} onChange={(event) => updatePlan(service.id, plan.id, { included_revisions: event.target.value === '' ? null : Number(event.target.value) })}/></label>
          <label>{t('pricing.extraRevision')}<input type="number" min="0" value={plan.extra_revision_price ?? ''} onChange={(event) => updatePlan(service.id, plan.id, { extra_revision_price: event.target.value === '' ? null : Number(event.target.value) })}/></label><label>{t('form.order')}<input type="number" min="0" value={plan.sort_order || 0} onChange={(event) => updatePlan(service.id, plan.id, { sort_order: Number(event.target.value) })}/></label>
          <label className="wide">{t('form.description')}<textarea value={plan.description || ''} onChange={(event) => updatePlan(service.id, plan.id, { description: event.target.value })}/></label><label className="wide">{t('pricing.features')}<textarea value={plan.features.join('\n')} onChange={(event) => updatePlan(service.id, plan.id, { features: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })}/></label>
          <label className="wide">{t('pricing.extras')}<textarea value={extrasText(plan.extras)} onChange={(event) => updatePlan(service.id, plan.id, { extras: parseExtras(event.target.value) })}/></label><label className="wide">{t('pricing.notice')}<textarea value={plan.notice || ''} onChange={(event) => updatePlan(service.id, plan.id, { notice: event.target.value })}/></label>
          <label className="check"><input type="checkbox" checked={Boolean(plan.is_active)} onChange={(event) => updatePlan(service.id, plan.id, { is_active: event.target.checked })}/> {t('form.active')}</label>
        </div><button className="button button--small" type="button" onClick={() => void savePlan(plan)}>{t('pricing.savePlan')}</button></div>)}</div>
      </article>)}</div>
    </div>

    <form className="editor-card" onSubmit={createPlan}><div className="editor-head"><div><span className="eyebrow">{t('pricing.newPlan')}</span><h2>{t('pricing.addPlan')}</h2></div></div><div className="form-grid">
      <label>{t('admin.directions')}<select value={newPlan.service_id} onChange={(event) => setNewPlan({ ...newPlan, service_id: event.target.value })}>{services.filter((service) => ['web', 'systems', 'applications'].includes(service.slug)).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label><label>{t('form.name')}<input value={newPlan.name} onChange={(event) => setNewPlan({ ...newPlan, name: event.target.value })} required/></label><label>{t('form.slug')}<input pattern="[a-z0-9-]+" value={newPlan.slug} onChange={(event) => setNewPlan({ ...newPlan, slug: event.target.value.toLowerCase() })} required/></label><label>{t('pricing.price')}<input type="number" min="0" value={newPlan.price_amount} onChange={(event) => setNewPlan({ ...newPlan, price_amount: Number(event.target.value) })} required/></label><label>{t('pricing.priceFormat')}<select value={newPlan.price_format} onChange={(event) => setNewPlan({ ...newPlan, price_format: event.target.value as 'fixed' | 'from' })}><option value="fixed">{t('pricing.fixed')}</option><option value="from">{t('pricing.from')}</option></select></label><label>{t('pricing.duration')}<input value={newPlan.duration} onChange={(event) => setNewPlan({ ...newPlan, duration: event.target.value })} required/></label><label className="wide">{t('form.description')}<textarea value={newPlan.description} onChange={(event) => setNewPlan({ ...newPlan, description: event.target.value })}/></label><label className="wide">{t('pricing.features')}<textarea value={newPlan.features.join('\n')} onChange={(event) => setNewPlan({ ...newPlan, features: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })}/></label>
    </div><button className="button" type="submit">{t('pricing.addPlan')}</button></form>
  </section>
}
