import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ErrorState, LoadingState } from '../components/States'
import { ThemeToggle } from '../components/ThemeToggle'
import { useI18n } from '../i18n'
import { api, ApiError } from '../lib/api'
import type { Order } from '../types'

export function ClientAccessPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'checking' | 'manual' | 'error'>('checking')
  const [error, setError] = useState('')
  const [code, setCode] = useState('')

  async function exchange(token: string) {
    setStatus('checking')
    setError('')
    try {
      await api('/client/access/exchange', { method: 'POST', body: { token } })
      navigate('/client/order', { replace: true })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('client.inviteRejected'))
      setStatus('error')
    }
  }

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
    window.history.replaceState({}, document.title, '/client/access')
    if (token) void exchange(token)
    else setStatus('manual')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function submit(event: FormEvent) {
    event.preventDefault()
    if (code.trim()) void exchange(code.trim())
  }

  return <ClientShell>{status === 'checking' ? <LoadingState label={t('client.checkInvite')}/> : <div className="auth-card"><span className="eyebrow">{t('client.portal')}</span><h1>{t('client.accessTitle')}</h1><p>{t('client.accessText')}</p>{error && <div className="form-error" role="alert">{error}</div>}<form onSubmit={submit}><label htmlFor="invite">{t('client.inviteCode')}</label><input id="invite" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" required/><button className="button" type="submit">{t('client.continue')}</button></form><Link to="/">{t('client.home')}</Link></div>}</ClientShell>
}

function ClientShell({ children }: { children: React.ReactNode }) {
  return <main className="portal-shell"><div className="portal-brand"><Brand compact/><div className="portal-controls"><LanguageSwitcher/><ThemeToggle/></div></div><div className="portal-center">{children}</div></main>
}

export function ClientOrderPage() {
  const { language, t } = useI18n()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [brief, setBrief] = useState('')
  const [notice, setNotice] = useState('')
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await api<{ data: Order }>('/client/order')
      setOrder(response.data)
      setBrief(response.data.brief?.details || '')
    } catch (caught) {
      const requestError = caught as ApiError
      if (requestError.status === 401 || requestError.status === 403) navigate('/client/access', { replace: true })
      else setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveBrief(event: FormEvent) {
    event.preventDefault()
    setNotice('')
    try {
      await api('/client/order/brief', { method: 'PUT', body: { brief: { details: brief } } })
      setNotice(t('client.briefSaved'))
    } catch (caught) { setError((caught as ApiError).message) }
  }

  async function sendReview(event: FormEvent) {
    event.preventDefault()
    setNotice('')
    try {
      await api('/client/order/review', { method: 'POST', body: { rating, text: review } })
      setNotice(t('client.reviewSent'))
      setReview('')
    } catch (caught) { setError((caught as ApiError).message) }
  }

  const statusLabels: Record<string, string> = { new: t('status.new'), briefing: t('status.briefing'), in_progress: t('status.in_progress'), review: t('status.review'), completed: t('status.completed'), cancelled: t('status.cancelled') }
  const locale = language === 'uz' ? 'uz-UZ' : language === 'en' ? 'en-US' : 'ru-RU'
  if (loading) return <ClientShell><LoadingState label={t('client.loadingProject')}/></ClientShell>
  if (error && !order) return <ClientShell><ErrorState message={error} retry={load}/></ClientShell>
  if (!order) return null

  return <ClientShell><div className="client-dashboard"><div className="client-top"><div><span className="eyebrow">{t('client.yourProject')}</span><h1>{typeof order.service === 'string' ? order.service : order.service?.name || t('client.order')}</h1><p>{order.summary}</p></div><span className={`order-status status-${order.status}`}>{statusLabels[order.status]}</span></div>{notice && <div className="form-success" role="status">{notice}</div>}{error && <div className="form-error" role="alert">{error}</div>}<div className="client-columns"><form className="panel" onSubmit={saveBrief}><h2>{t('client.brief')}</h2><p>{t('client.briefPrivacy')}</p><label htmlFor="brief">{t('client.briefLabel')}</label><textarea id="brief" rows={8} value={brief} onChange={(event) => setBrief(event.target.value)} required/><button className="button" type="submit">{t('client.saveBrief')}</button></form><aside className="panel"><h2>{t('client.status')}</h2><dl><div><dt>{t('client.stage')}</dt><dd>{statusLabels[order.status]}</dd></div>{order.due_at && <div><dt>{t('client.dueDate')}</dt><dd>{new Date(order.due_at).toLocaleDateString(locale)}</dd></div>}</dl>{order.assignees?.length ? <><h3>{t('client.team')}</h3><ul>{order.assignees.map((person) => <li key={person.id}>{person.name} — {person.role}</li>)}</ul></> : <p className="muted">{t('client.noAssignees')}</p>}</aside></div>{order.status === 'completed' && <form className="panel review-form" onSubmit={sendReview}><h2>{t('client.leaveReview')}</h2><p>{t('client.reviewPublic')}</p><label htmlFor="rating">{t('client.rating')}</label><select id="rating" value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{t('client.outOfFive').replace('{value}', String(value))}</option>)}</select><label htmlFor="review">{t('client.reviewText')}</label><textarea id="review" value={review} onChange={(event) => setReview(event.target.value)} required/><button className="button" type="submit">{t('client.sendReview')}</button></form>}</div></ClientShell>
}
