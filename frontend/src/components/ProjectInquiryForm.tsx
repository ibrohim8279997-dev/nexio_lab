import { useMemo, useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { api, ApiError } from '../lib/api'

const TYPES = ['website', 'crm_integration', 'custom_crm', 'android', 'windows', 'marketplace', 'other']
const BUDGETS = ['under_300', '300_500', '500_1000', '1000_3000', '3000_plus', 'not_decided']
type Result = { status: 'delivered' | 'queued' | 'failed'; reference: string }
const empty = { client_name: '', phone: '', email: '', telegram: '', contact_method: 'phone', project_type: 'website', project_title: '', project_description: '', required_functionality: '', estimated_budget: 'not_decided', currency: 'USD', timeframe: '', company_website: '' }

export function ProjectInquiryForm() {
  const { t } = useI18n()
  const [form, setForm] = useState(empty)
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const utm = useMemo(() => {
    const q = new URLSearchParams(window.location.search)
    return { utm_source: q.get('utm_source') || undefined, utm_medium: q.get('utm_medium') || undefined, utm_campaign: q.get('utm_campaign') || undefined }
  }, [])
  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))
  const err = (key: string) => errors[key]?.[0]

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (!form.phone.trim() && !form.email.trim() && !form.telegram.trim()) { setErrors({ phone: [t('inq.atLeast')] }); return }
    setBusy(true); setErrors({}); setMessage('')
    try {
      const body: Record<string, unknown> = { ...form, submission_id: submissionId, source_url: window.location.href.split('#')[0], ...utm }
      for (const k of ['phone', 'email', 'telegram', 'required_functionality', 'timeframe']) if (!String(body[k]).trim()) body[k] = null
      const response = await api<{ data: Result }>('/project-inquiries', { method: 'POST', body })
      setResult(response.data)
    } catch (e) {
      if (e instanceof ApiError && e.status === 422 && e.errors) setErrors(e.errors)
      else setMessage(e instanceof ApiError && e.status === 429 ? t('inq.tooMany') : e instanceof ApiError ? e.message : t('inq.failed'))
    } finally { setBusy(false) }
  }

  if (result) return <section className="section"><div className="container inquiry"><div className={'inquiry-result inquiry-result--' + result.status} role="status">
    <p>{t(result.status === 'delivered' ? 'inq.ok' : result.status === 'queued' ? 'inq.queued' : 'inq.failed')}{result.status !== 'failed' && <strong>{result.reference.slice(0, 8).toUpperCase()}</strong>}</p>
    <button type="button" className="button button--ghost" onClick={() => { setResult(null); setForm(empty); setSubmissionId(crypto.randomUUID()) }}>{t('inq.again')}</button></div></div></section>

  const field = (key: keyof typeof empty, label: string, props: { type?: string; area?: boolean; required?: boolean; maxLength?: number } = {}) => <label className="inquiry-field">
    <span>{label}</span>
    {props.area ? <textarea rows={5} value={form[key]} maxLength={props.maxLength} required={props.required} onChange={(e) => set(key, e.target.value)} aria-invalid={!!err(key)}/> :
      <input type={props.type || 'text'} value={form[key]} maxLength={props.maxLength} required={props.required} onChange={(e) => set(key, e.target.value)} aria-invalid={!!err(key)}/>}
    {err(key) && <em role="alert">{err(key)}</em>}</label>
  const select = (key: keyof typeof empty, label: string, options: Array<[string, string]>) => <label className="inquiry-field"><span>{label}</span>
    <select value={form[key]} onChange={(e) => set(key, e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>{err(key) && <em role="alert">{err(key)}</em>}</label>

  return <section className="section"><div className="container inquiry"><span className="eyebrow">{t('inq.title')}</span><p>{t('inq.lead')}</p>
    <form onSubmit={submit} noValidate={false} className="inquiry-form">
      <input className="inquiry-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" name="company_website" value={form.company_website} onChange={(e) => set('company_website', e.target.value)}/>
      <fieldset><legend>{t('inq.client')}</legend>
        {field('client_name', t('inq.name'), { required: true, maxLength: 120 })}
        {field('phone', t('inq.phone'), { type: 'tel', maxLength: 32 })}
        {field('email', t('inq.email'), { type: 'email', maxLength: 190 })}
        {field('telegram', t('inq.telegram'), { maxLength: 64 })}
        {select('contact_method', t('inq.method'), [['phone', t('inq.phone')], ['email', t('inq.email')], ['telegram', t('inq.telegram')]])}
      </fieldset>
      <fieldset><legend>{t('inq.project')}</legend>
        {select('project_type', t('inq.type'), TYPES.map((k) => [k, t('inq.type.' + k)]))}
        {field('project_title', t('inq.ptitle'), { required: true, maxLength: 160 })}
        {field('project_description', t('inq.desc'), { area: true, required: true, maxLength: 5000 })}
        {field('required_functionality', t('inq.func'), { area: true, maxLength: 3000 })}
        {select('estimated_budget', t('inq.budget'), BUDGETS.map((k) => [k, t('inq.b.' + k)]))}
        {select('currency', t('inq.currency'), [['USD', 'USD'], ['UZS', 'UZS'], ['EUR', 'EUR'], ['RUB', 'RUB']])}
        {field('timeframe', t('inq.time'), { maxLength: 100 })}
      </fieldset>
      {message && <p className="inquiry-error" role="alert">{message}</p>}
      <button type="submit" className="button" disabled={busy} aria-busy={busy}>{busy ? t('inq.sending') : t('inq.submit')}</button>
    </form></div></section>
}
