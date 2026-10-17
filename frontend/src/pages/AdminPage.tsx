import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError, ensureCsrf, uploadMedia } from '../lib/api'
import type { Department, Employee, Order, PublicContacts, Service, SiteContent } from '../types'
import { Brand } from '../components/Brand'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ThemeToggle } from '../components/ThemeToggle'
import { Avatar, EmptyState, ErrorState, LoadingState, mediaUrl } from '../components/States'
import { useI18n } from '../i18n'
import { PricingPanel } from './admin/PricingPanel'

type AdminUser = { name: string; email?: string; role: string }
type Tab = 'crm' | 'employees' | 'site'
const departmentOptions: Array<{ value: Department; label: string }> = [
  { value: 'management', label: 'Руководство' },
  { value: 'it', label: 'IT' },
  { value: 'product', label: 'Продукт' },
  { value: 'design', label: 'Дизайн' },
  { value: 'marketing', label: 'Маркетинг' },
  { value: 'sales', label: 'Продажи' },
  { value: 'hr', label: 'HR' },
  { value: 'finance', label: 'Финансы' },
  { value: 'operations', label: 'Операции' },
  { value: 'support', label: 'Поддержка' },
]

export function AdminPage() {
  const { t } = useI18n()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [tab, setTab] = useState<Tab>('crm')

  async function check() { setLoading(true); try { const r = await api<{ data: AdminUser }>('/admin/auth/me'); setUser(r.data); setOffline(false) } catch (e) { if ((e as ApiError).status === 0) setOffline(true); setUser(null) } finally { setLoading(false) } }
  useEffect(() => { void check() }, [])
  async function logout() { await api('/admin/auth/logout', { method: 'POST' }).catch(() => undefined); setUser(null) }

  if (loading) return <AdminShell><LoadingState label={t('admin.secureCheck')}/></AdminShell>
  if (!user) return <AdminLogin onSuccess={setUser} offline={offline}/>
  return <div className="admin-layout"><aside className="admin-sidebar"><Brand compact/><div className="admin-user"><span>{user.name.slice(0, 1)}</span><div><strong>{user.name}</strong><small>{user.role}</small></div></div><nav aria-label={t('admin.sections')}><button className={tab === 'crm' ? 'active' : ''} onClick={() => setTab('crm')}><span>◫</span> CRM</button><button className={tab === 'employees' ? 'active' : ''} onClick={() => setTab('employees')}><span>◉</span> {t('admin.employees')}</button><button className={tab === 'site' ? 'active' : ''} onClick={() => setTab('site')}><span>⌁</span> {t('admin.site')}</button></nav><div className="admin-side-foot"><Link to="/">{t('admin.openSite')}</Link><button onClick={logout}>{t('admin.logout')}</button></div></aside><main className="admin-main"><header className="admin-top"><div><span className="eyebrow">{t('admin.panel')}</span><h1>{tab === 'crm' ? t('admin.crmTitle') : tab === 'employees' ? t('admin.employees') : t('admin.site')}</h1></div><div className="admin-top-actions"><span className="live-label"><i/> {t('admin.apiConnected')}</span><LanguageSwitcher/><ThemeToggle/></div></header>{tab === 'crm' ? <CrmPanel/> : tab === 'employees' ? <EmployeesPanel/> : <><SitePanel/><PricingPanel/><ContentCollectionsPanel/></>}</main></div>
}

function AdminShell({ children }: { children: React.ReactNode }) { return <main className="portal-shell admin-login-shell"><div className="portal-brand"><Brand compact/><div className="portal-controls"><LanguageSwitcher/><ThemeToggle/></div></div><div className="portal-center">{children}</div></main> }

function AdminLogin({ onSuccess, offline }: { onSuccess: (user: AdminUser) => void; offline: boolean }) {
  const { t } = useI18n()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [otp, setOtp] = useState(''); const [needsOtp, setNeedsOtp] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); try { await ensureCsrf(); if (needsOtp) { const verified = await api<{ data: AdminUser }>('/admin/auth/2fa/verify', { method: 'POST', body: { code: otp } }); onSuccess(verified.data); return } const loggedIn = await api<{ data: AdminUser | { two_factor_required: true } }>('/admin/auth/login', { method: 'POST', body: { email, password } }); if ('two_factor_required' in loggedIn.data) { setNeedsOtp(true); setOtp('') } else onSuccess(loggedIn.data) } catch (e) { setError((e as ApiError).message) } finally { setBusy(false) } }
  return <AdminShell><div className="auth-card"><span className="eyebrow">{t('admin.closed')}</span><h1>{t('admin.loginTitle')}</h1><p>{t('admin.loginText')}</p>{offline && <div className="demo-banner"><strong>{t('admin.demo')}</strong><span>{t('admin.demoText')}</span></div>}{error && <div className="form-error" role="alert">{error}</div>}<form onSubmit={submit}><label htmlFor="admin-email">{t('form.email')}</label><input id="admin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required/><label htmlFor="admin-password">{t('admin.password')}</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required/>{needsOtp && <><label htmlFor="admin-otp">{t('admin.otp')}</label><input id="admin-otp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value)} required/></>}<button className="button" type="submit" disabled={busy || offline}>{busy ? t('admin.checking') : t('admin.login')}</button></form><Link to="/">{t('admin.backSite')}</Link></div></AdminShell>
}

function LegacyCrmPanel() {
  const [orders, setOrders] = useState<Order[]>([]); const [services, setServices] = useState<Array<Service & { id: number }>>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [creating, setCreating] = useState(false); const [form, setForm] = useState({ client_name: '', client_email: '', client_phone: '', service_id: '', description: '', currency: 'USD', client_contact: '', service: 'web', summary: '' }); const [notice, setNotice] = useState('')
  async function load() { setLoading(true); setError(''); try { const params = new URLSearchParams(); if (search) params.set('search', search); if (status) params.set('status', status); const [ordersResponse, servicesResponse] = await Promise.all([api<{ data: Order[] }>(`/admin/orders?${params}`), api<{ data: Array<Service & { id: number }> }>('/admin/services')]); setOrders(ordersResponse.data); setServices(servicesResponse.data) } catch (e) { setError((e as ApiError).message) } finally { setLoading(false) } }
  useEffect(() => { void load() }, [status]) // eslint-disable-line react-hooks/exhaustive-deps
  async function create(event: FormEvent) { event.preventDefault(); try { await api('/admin/orders', { method: 'POST', body: { ...form, service_id: form.service_id ? Number(form.service_id) : null } }); setCreating(false); setForm({ client_name: '', client_email: '', client_phone: '', service_id: '', description: '', currency: 'USD', client_contact: '', service: 'web', summary: '' }); setNotice('Заказ создан.'); await load() } catch (e) { setError((e as ApiError).message) } }
  async function action(id: string, operation: 'issue-access' | 'revoke-access') { if (operation === 'revoke-access' && !window.confirm('Отозвать клиентский доступ?')) return; try { const r = await api<{ data?: { url?: string; invitation_url?: string } }>(`/admin/orders/${id}/client-access`, { method: operation === 'revoke-access' ? 'DELETE' : 'POST' }); const invitationUrl = r.data?.url || r.data?.invitation_url; setNotice(operation === 'issue-access' ? `Доступ выпущен${invitationUrl ? `: ${invitationUrl}` : '.'}` : 'Доступ отозван.'); await load() } catch (e) { setError((e as ApiError).message) } }
  return <section className="admin-section"><div className="toolbar"><form onSubmit={(e) => { e.preventDefault(); void load() }}><label className="sr-only" htmlFor="order-search">Поиск заказов</label><input id="order-search" placeholder="Имя, ID или услуга" value={search} onChange={(e) => setSearch(e.target.value)}/><button type="submit">Найти</button></form><label className="sr-only" htmlFor="order-filter">Статус</label><select id="order-filter" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Все статусы</option><option value="new">Новые</option><option value="briefing">Бриф</option><option value="in_progress">В работе</option><option value="review">Проверка</option><option value="completed">Завершённые</option></select><button className="button button--small" onClick={() => setCreating(true)}>+ Новый заказ</button></div>{notice && <div className="form-success">{notice}</div>}{error && <ErrorState message={error} retry={load}/>} {creating && <form className="editor-card" onSubmit={create}><div className="editor-head"><h2>Новый заказ</h2><button type="button" onClick={() => setCreating(false)} aria-label="Закрыть">×</button></div><div className="form-grid"><label>Имя клиента<input value={form.client_name} onChange={(e) => setForm({...form, client_name:e.target.value})} required/></label><label>Контакт<input value={form.client_contact} onChange={(e) => setForm({...form, client_contact:e.target.value})} required/></label><label>Услуга<select value={form.service} onChange={(e) => setForm({...form, service:e.target.value})}><option value="web">Сайт</option><option value="android">Android</option><option value="windows">Windows</option></select></label><label className="wide">Описание<textarea value={form.summary} onChange={(e) => setForm({...form, summary:e.target.value})} required/></label></div><button className="button" type="submit">Создать</button></form>}{loading ? <LoadingState/> : !orders.length ? <EmptyState title="Заказов нет">Создайте заказ после разговора с клиентом.</EmptyState> : <div className="data-table" role="region" aria-label="Заказы" tabIndex={0}><table><thead><tr><th>Клиент</th><th>Услуга</th><th>Статус</th><th>Команда</th><th>Доступ</th><th></th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.client_name}</strong><small>{order.public_id || order.id}</small></td><td>{typeof order.service === 'string' ? order.service : order.service?.name}</td><td><select aria-label={`Статус заказа ${order.client_name}`} value={order.status} onChange={async (e) => { await api(`/admin/orders/${order.id}`, { method:'PATCH', body:{status:e.target.value} }); await load() }}>{['new','briefing','in_progress','review','completed','cancelled'].map((s) => <option key={s}>{s}</option>)}</select></td><td>{order.assignees?.map((e) => e.name).join(', ') || 'Не назначена'}</td><td>{order.client_access_active ? 'Активен' : 'Нет'}</td><td><button className="table-action" onClick={() => void action(order.id, order.client_access_active ? 'revoke-access' : 'issue-access')}>{order.client_access_active ? 'Отозвать' : 'Выдать'}</button></td></tr>)}</tbody></table></div>}</section>
}

function CrmPanel() {
  const { t } = useI18n()
  const [orders, setOrders] = useState<Order[]>([])
  const [services, setServices] = useState<Array<Service & { id: number }>>([])
  const [employees, setEmployees] = useState<Array<Employee & { id: number }>>([])
  const [reviews, setReviews] = useState<Array<{ id: number; rating: number; text: string; status: string; employee?: Employee | null; order?: { public_id?: string; client_name?: string } }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ client_name: '', client_email: '', client_phone: '', service_id: '', description: '', currency: 'USD' })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const query = new URLSearchParams()
      if (search) query.set('search', search)
      if (status) query.set('status', status)
      const [ordersResponse, servicesResponse, employeesResponse, reviewsResponse] = await Promise.all([
        api<{ data: Order[] }>(`/admin/orders?${query}`),
        api<{ data: Array<Service & { id: number }> }>('/admin/services'),
        api<{ data: Array<Employee & { id: number }> }>('/admin/employees'),
        api<{ data: Array<{ id: number; rating: number; text: string; status: string; employee?: Employee | null; order?: { public_id?: string; client_name?: string } }> }>('/admin/reviews'),
      ])
      setOrders(ordersResponse.data)
      setServices(servicesResponse.data)
      setEmployees(employeesResponse.data)
      setReviews(reviewsResponse.data)
    } catch (caught) {
      setError((caught as ApiError).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function create(event: FormEvent) {
    event.preventDefault()
    try {
      await api('/admin/orders', { method: 'POST', body: { ...form, service_id: form.service_id ? Number(form.service_id) : null } })
      setForm({ client_name: '', client_email: '', client_phone: '', service_id: '', description: '', currency: 'USD' })
      setCreating(false)
      setNotice(t('admin.orderCreated'))
      await load()
    } catch (caught) {
      setError((caught as ApiError).message)
    }
  }

  async function updateStatus(orderId: string, nextStatus: string) {
    try {
      await api(`/admin/orders/${orderId}/status`, { method: 'PUT', body: { status: nextStatus } })
      await load()
    } catch (caught) {
      setError((caught as ApiError).message)
    }
  }

  async function toggleAccess(order: Order) {
    if (order.client_access_active && !window.confirm(t('admin.revokeConfirm'))) return
    try {
      const response = await api<{ data: { url?: string; invitation_url?: string; revoked?: boolean } }>(`/admin/orders/${order.id}/client-access`, { method: order.client_access_active ? 'DELETE' : 'POST' })
      const url = response.data.url || response.data.invitation_url
      setNotice(url ? `${t('admin.personalLink')}: ${url}` : t('admin.accessRevoked'))
      await load()
    } catch (caught) {
      setError((caught as ApiError).message)
    }
  }

  async function updateAssignees(orderId: string, employeeIds: number[]) {
    try {
      await api(`/admin/orders/${orderId}/assignees`, { method: 'PUT', body: { employee_ids: employeeIds } })
      setNotice(t('admin.teamUpdated'))
      await load()
    } catch (caught) {
      setError((caught as ApiError).message)
    }
  }

  async function moderateReview(reviewId: number, nextStatus: 'approved' | 'rejected') {
    if (!window.confirm(t(nextStatus === 'approved' ? 'admin.approveConfirm' : 'admin.rejectConfirm'))) return
    try {
      await api(`/admin/reviews/${reviewId}/moderate`, { method: 'PUT', body: { status: nextStatus } })
      setNotice(t(nextStatus === 'approved' ? 'admin.reviewApproved' : 'admin.reviewRejected'))
      await load()
    } catch (caught) {
      setError((caught as ApiError).message)
    }
  }

  return <section className="admin-section">
    <div className="toolbar"><form onSubmit={(event) => { event.preventDefault(); void load() }}><label className="sr-only" htmlFor="order-search">{t('admin.searchOrders')}</label><input id="order-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('admin.searchPlaceholder')}/><button type="submit">{t('admin.search')}</button></form><select aria-label={t('admin.filterStatus')} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">{t('admin.allStatuses')}</option>{['new', 'briefing', 'in_progress', 'review', 'completed', 'cancelled'].map((value) => <option key={value} value={value}>{t('status.' + value)}</option>)}</select><button className="button button--small" onClick={() => setCreating(true)}>+ {t('admin.newOrder')}</button></div>
    {notice && <div className="form-success" role="status">{notice}</div>}
    {error && <ErrorState message={error} retry={load}/>} 
    {creating && <form className="editor-card" onSubmit={create}><div className="editor-head"><h2>{t('admin.newOrder')}</h2><button type="button" onClick={() => setCreating(false)} aria-label={t('form.close')}>×</button></div><div className="form-grid"><label>{t('admin.clientName')}<input value={form.client_name} onChange={(event) => setForm({ ...form, client_name: event.target.value })} required/></label><label>{t('form.email')}<input type="email" value={form.client_email} onChange={(event) => setForm({ ...form, client_email: event.target.value })} required/></label><label>{t('form.phone')}<input value={form.client_phone} onChange={(event) => setForm({ ...form, client_phone: event.target.value })}/></label><label>{t('admin.service')}<select value={form.service_id} onChange={(event) => setForm({ ...form, service_id: event.target.value })}><option value="">{t('admin.notSelected')}</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label><label>{t('admin.currency')}<input maxLength={3} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} required/></label><label className="wide">{t('form.description')}<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></label></div><button className="button" type="submit">{t('admin.create')}</button></form>}
    {loading ? <LoadingState/> : !orders.length ? <EmptyState title={t('admin.noOrders')}>{t('admin.noOrdersText')}</EmptyState> : <div className="data-table" role="region" aria-label={t('admin.orders')} tabIndex={0}><table><thead><tr><th>{t('admin.client')}</th><th>{t('admin.service')}</th><th>{t('client.status')}</th><th>{t('admin.team')}</th><th>{t('admin.access')}</th><th></th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.client_name}</strong><small>{order.public_id || order.id}</small></td><td>{typeof order.service === 'string' ? order.service : order.service?.name || '—'}</td><td><select aria-label={`${t('client.status')} ${order.client_name}`} value={order.status} onChange={(event) => void updateStatus(order.id, event.target.value)}>{['new', 'briefing', 'in_progress', 'review', 'completed', 'cancelled'].map((value) => <option key={value} value={value}>{t('status.' + value)}</option>)}</select></td><td><select multiple aria-label={`${t('admin.team')} ${order.client_name}`} value={(order.assignees || []).map((employee) => String(employee.id))} onChange={(event) => void updateAssignees(order.id, Array.from(event.currentTarget.selectedOptions, (option) => Number(option.value)))}>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select><small>{t('admin.multiSelect')}</small></td><td>{order.client_access_active ? t('admin.enabled') : t('admin.no')}</td><td><button className="table-action" onClick={() => void toggleAccess(order)}>{order.client_access_active ? t('admin.revoke') : t('admin.issue')}</button></td></tr>)}</tbody></table></div>}
    <div className="editor-card"><div className="editor-head"><div><span className="eyebrow">{t('admin.moderation')}</span><h2>{t('admin.clientReviews')}</h2></div></div>{reviews.length === 0 ? <p className="muted-copy">{t('admin.noReviews')}</p> : <div className="review-admin-list">{reviews.map((review) => <article key={review.id}><div><strong>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</strong><span>{review.order?.client_name || review.order?.public_id || t('admin.customer')} · {review.employee?.name || 'Nexio Lab'} · {t('status.' + review.status, review.status)}</span><p>{review.text}</p></div>{review.status === 'pending' && <div><button className="table-action" onClick={() => void moderateReview(review.id, 'approved')}>{t('admin.approve')}</button><button className="table-action table-action--danger" onClick={() => void moderateReview(review.id, 'rejected')}>{t('admin.reject')}</button></div>}</article>)}</div>}</div>
  </section>
}

function LegacyEmployeesPanel() {
  const [items, setItems] = useState<Employee[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [editing, setEditing] = useState(false); const [photo, setPhoto] = useState<File | null>(null); const [form, setForm] = useState({ name:'', role:'', department:'it', short_bio:'', activity:'', joined_story:'', experience:'', published:false })
  async function load() { setLoading(true); try { const r = await api<{data:Employee[]}>('/admin/employees'); setItems(r.data) } catch(e){ setError((e as ApiError).message) } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  async function save(e: FormEvent){e.preventDefault(); try { let photoPayload: unknown; if(photo){ const uploaded=await uploadMedia(photo,'photo'); photoPayload=uploaded.data } await api('/admin/employees',{method:'POST',body:{...form,...(photoPayload?{photo:photoPayload}:{})}}); setEditing(false); await load() } catch(err){setError((err as ApiError).message)} }
  return <section className="admin-section"><div className="toolbar"><p>{items.length} профилей</p><button className="button button--small" onClick={() => setEditing(true)}>+ Добавить сотрудника</button></div>{error&&<ErrorState message={error} retry={load}/>} {editing&&<form className="editor-card" onSubmit={save}><div className="editor-head"><h2>Новый профиль</h2><button type="button" onClick={()=>setEditing(false)} aria-label="Закрыть">×</button></div><div className="form-grid"><label>Имя<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>Роль<input value={form.role} onChange={e=>setForm({...form,role:e.target.value})} required/></label><label>Отдел<select value={form.department} onChange={e=>setForm({...form,department:e.target.value})}>{departmentOptions.map((department) => <option key={department.value} value={department.value}>{department.label}</option>)}</select></label><label>Опыт<input value={form.experience} onChange={e=>setForm({...form,experience:e.target.value})}/></label><label className="wide">Краткое био<textarea value={form.short_bio} onChange={e=>setForm({...form,short_bio:e.target.value})}/></label><label className="wide">Деятельность<textarea value={form.activity} onChange={e=>setForm({...form,activity:e.target.value})}/></label><label className="wide">История прихода<textarea value={form.joined_story} onChange={e=>setForm({...form,joined_story:e.target.value})}/></label><label>Фото (JPEG, PNG, WebP)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></label><label className="check"><input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})}/> Опубликовать сразу</label></div><div className="profile-preview"><Avatar name={form.name||'Новый сотрудник'} photo={photo?URL.createObjectURL(photo):undefined}/><div><small>Предпросмотр</small><strong>{form.name||'Имя'}</strong><span>{form.role||'Роль'}</span></div></div><button className="button" type="submit">Создать профиль</button></form>}{loading?<LoadingState/>:!items.length?<EmptyState title="Сотрудников нет">Добавляйте только реальные и согласованные профили.</EmptyState>:<div className="employee-admin-grid">{items.map(p=><article key={p.id}><Avatar name={p.name} photo={mediaUrl(p.photo)}/><div><h2>{p.name}</h2><p>{p.role}</p><span>{p.published?'Опубликован':'Черновик'}</span><Link to={`/team/${p.slug}`} target="_blank">/team/{p.slug} ↗</Link></div><button onClick={async()=>{await api(`/admin/employees/${p.id}`,{method:'PATCH',body:{published:!p.published}});await load()}}>{p.published?'Снять':'Опубликовать'}</button></article>)}</div>}</section>
}

type AdminEmployee = Employee & { id: number; position: string; company_story?: string; started_at?: string | null; photo_path?: string | null; is_public: boolean }

function EmployeesPanel() {
  const { t } = useI18n()
  const [items, setItems] = useState<AdminEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [form, setForm] = useState({ slug: '', name: '', position: '', department: 'it', short_bio: '', activity: '', company_story: '', started_at: '', is_public: false })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const response = await api<{ data: AdminEmployee[] }>('/admin/employees')
      setItems(response.data)
    } catch (caught) {
      setError((caught as ApiError).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function save(event: FormEvent) {
    event.preventDefault()
    try {
      const uploaded = photo ? await uploadMedia(photo) : null
      await api('/admin/employees', { method: 'POST', body: { ...form, started_at: form.started_at || null, ...(uploaded ? { photo_path: uploaded.data.path } : {}) } })
      setEditing(false)
      setPhoto(null)
      setForm({ slug: '', name: '', position: '', department: 'it', short_bio: '', activity: '', company_story: '', started_at: '', is_public: false })
      await load()
    } catch (caught) {
      setError((caught as ApiError).message)
    }
  }

  async function togglePublished(employee: AdminEmployee) {
    try {
      await api(`/admin/employees/${employee.id}`, { method: 'PUT', body: { is_public: !employee.is_public } })
      await load()
    } catch (caught) {
      setError((caught as ApiError).message)
    }
  }

  return <section className="admin-section"><div className="toolbar"><p>{t('admin.profiles').replace('{count}', String(items.length))}</p><button className="button button--small" onClick={() => setEditing(true)}>+ {t('admin.addEmployee')}</button></div>{error && <ErrorState message={error} retry={load}/>} {editing && <form className="editor-card" onSubmit={save}><div className="editor-head"><h2>{t('admin.newProfile')}</h2><button type="button" onClick={() => setEditing(false)} aria-label={t('form.close')}>×</button></div><div className="form-grid"><label>{t('admin.publicSlug')}<input value={form.slug} pattern="[a-z0-9-]+" onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase() })} required/></label><label>{t('form.personName')}<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required/></label><label>{t('form.position')}<input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} required/></label><label>{t('form.department')}<select value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}>{departmentOptions.map((department) => <option key={department.value} value={department.value}>{t('department.' + department.value, department.label)}</option>)}</select></label><label>{t('admin.startDate')}<input type="date" value={form.started_at} onChange={(event) => setForm({ ...form, started_at: event.target.value })}/></label><label className="wide">{t('admin.shortBio')}<textarea value={form.short_bio} onChange={(event) => setForm({ ...form, short_bio: event.target.value })}/></label><label className="wide">{t('admin.activity')}<textarea value={form.activity} onChange={(event) => setForm({ ...form, activity: event.target.value })}/></label><label className="wide">{t('admin.joinStory')}<textarea value={form.company_story} onChange={(event) => setForm({ ...form, company_story: event.target.value })}/></label><label>{t('admin.photo')}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] || null)}/></label><label className="check"><input type="checkbox" checked={form.is_public} onChange={(event) => setForm({ ...form, is_public: event.target.checked })}/> {t('admin.publishNow')}</label></div><div className="profile-preview"><Avatar name={form.name || t('admin.newEmployee')} photo={photo ? URL.createObjectURL(photo) : undefined}/><div><small>{t('admin.preview')}</small><strong>{form.name || t('form.personName')}</strong><span>{form.position || t('form.position')}</span></div></div><button className="button" type="submit">{t('admin.createProfile')}</button></form>}{loading ? <LoadingState/> : !items.length ? <EmptyState title={t('admin.noEmployees')}>{t('admin.noEmployeesText')}</EmptyState> : <div className="employee-admin-grid">{items.map((employee) => <article key={employee.id}><Avatar name={employee.name} photo={employee.photo_path ? `/storage/${employee.photo_path}` : undefined}/><div><h2>{employee.name}</h2><p>{employee.position}</p><span>{employee.is_public ? t('form.published') : t('form.draft')}</span><Link to={`/team/${employee.slug}`} target="_blank">/team/{employee.slug} ↗</Link></div><button onClick={() => void togglePublished(employee)}>{employee.is_public ? t('form.unpublish') : t('form.publish')}</button></article>)}</div>}</section>
}

type AdminSiteSettings = { logo_path?: string | null; slogan: string; intro_text?: string | null; about_text?: string | null; phone?: string | null; telegram?: string | null; whatsapp?: string | null; email?: string | null; availability_text: string; address?: string | null; address_confirmed: boolean }
type AdminService = Service & { id: number; short_description: string; is_published: boolean }

function SitePanel() {
  const { t } = useI18n()
  const [site, setSite] = useState<AdminSiteSettings>({ slogan: 'Future Starts Here', intro_text: '', about_text: '', phone: '', telegram: '', whatsapp: '', email: '', availability_text: t('footer.online'), address: '', address_confirmed: false })
  const [services, setServices] = useState<AdminService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [siteResponse, servicesResponse] = await Promise.all([
        api<{ data: AdminSiteSettings }>('/admin/site-settings'),
        api<{ data: AdminService[] }>('/admin/services'),
      ])
      setSite(siteResponse.data)
      setServices(servicesResponse.data)
    } catch (caught) {
      setError((caught as ApiError).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function save(event: FormEvent) {
    event.preventDefault()
    setNotice('')
    try {
      await api('/admin/site-settings', { method: 'PUT', body: site })
      setNotice(t('admin.siteSaved'))
    } catch (caught) {
      setError((caught as ApiError).message)
    }
  }

  if (loading) return <LoadingState/>
  return <section className="admin-section">{error && <ErrorState message={error} retry={load}/>} {notice && <div className="form-success" role="status">{notice}</div>}<form className="editor-card" onSubmit={save}><div className="editor-head"><div><span className="eyebrow">{t('admin.textContacts')}</span><h2>{t('admin.publicInfo')}</h2></div></div><div className="form-grid"><label>{t('admin.slogan')}<input value={site.slogan} onChange={(event) => setSite({ ...site, slogan: event.target.value })} required/></label><label>{t('admin.onlineStatus')}<input value={site.availability_text} onChange={(event) => setSite({ ...site, availability_text: event.target.value })} required/></label><label className="wide">{t('admin.introText')}<textarea value={site.intro_text || ''} onChange={(event) => setSite({ ...site, intro_text: event.target.value })}/></label><label className="wide">{t('admin.about')}<textarea value={site.about_text || ''} onChange={(event) => setSite({ ...site, about_text: event.target.value })}/></label><label>{t('form.phone')}<input value={site.phone || ''} onChange={(event) => setSite({ ...site, phone: event.target.value })}/></label><label>{t('form.email')}<input type="email" value={site.email || ''} onChange={(event) => setSite({ ...site, email: event.target.value })}/></label><label>Telegram<input value={site.telegram || ''} onChange={(event) => setSite({ ...site, telegram: event.target.value })}/></label><label>WhatsApp<input value={site.whatsapp || ''} onChange={(event) => setSite({ ...site, whatsapp: event.target.value })}/></label><label>{t('admin.address')}<input value={site.address || ''} onChange={(event) => setSite({ ...site, address: event.target.value })}/></label><label className="check"><input type="checkbox" checked={site.address_confirmed} onChange={(event) => setSite({ ...site, address_confirmed: event.target.checked })}/> {t('admin.addressConfirmed')}</label></div><div className="site-preview"><small>{t('admin.homePreview')}</small><h2>{site.slogan}</h2><p>{site.intro_text || t('admin.introEmpty')}</p></div><button className="button" type="submit">{t('form.save')}</button></form><div className="editor-card"><div className="editor-head"><div><span className="eyebrow">{t('admin.directions')}</span><h2>{t('admin.services')}</h2></div></div>{services.map((service) => <article className="inline-service" key={service.slug}><div><strong>{service.name}</strong><span>/{service.slug}</span></div><p>{service.short_description}</p><span>{service.is_published ? t('form.published') : t('form.draft')}</span></article>)}</div></section>
}

function LegacySitePanel() {
  const [site,setSite]=useState<SiteContent>({}); const [contacts,setContacts]=useState<PublicContacts>({}); const [services,setServices]=useState<Service[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [notice,setNotice]=useState('')
  async function load(){setLoading(true);try{const [s,sv]=await Promise.all([api<{data:SiteContent}>('/admin/site'),api<{data:Service[]}>('/admin/services')]);setSite(s.data);setContacts(s.data.contacts||{});setServices(sv.data)}catch(e){setError((e as ApiError).message)}finally{setLoading(false)}} useEffect(()=>{void load()},[])
  async function save(e:FormEvent){e.preventDefault();setNotice('');try{await api('/admin/site',{method:'PUT',body:{...site,contacts}});setNotice('Изменения сохранены и будут видны на сайте.')}catch(err){setError((err as ApiError).message)}}
  if(loading)return <LoadingState/>
  return <section className="admin-section">{error&&<ErrorState message={error} retry={load}/>} {notice&&<div className="form-success">{notice}</div>}<form className="editor-card" onSubmit={save}><div className="editor-head"><div><span className="eyebrow">Тексты и контакты</span><h2>Публичная информация</h2></div></div><div className="form-grid"><label>Заголовок главной<input value={site.hero_title||''} onChange={e=>setSite({...site,hero_title:e.target.value})}/></label><label>Слоган<input value={contacts.slogan||''} onChange={e=>setContacts({...contacts,slogan:e.target.value})}/></label><label className="wide">Вводный текст<textarea value={site.hero_text||''} onChange={e=>setSite({...site,hero_text:e.target.value})}/></label><label>Имя директора<input value={contacts.director_name||''} onChange={e=>setContacts({...contacts,director_name:e.target.value})}/></label><label>Онлайн-статус<input value={contacts.online_label||''} onChange={e=>setContacts({...contacts,online_label:e.target.value})}/></label><label>Телефон<input value={contacts.phone||''} onChange={e=>setContacts({...contacts,phone:e.target.value})}/></label><label>Email<input type="email" value={contacts.email||''} onChange={e=>setContacts({...contacts,email:e.target.value})}/></label><label>Telegram<input value={contacts.telegram||''} onChange={e=>setContacts({...contacts,telegram:e.target.value})}/></label><label>WhatsApp<input value={contacts.whatsapp||''} onChange={e=>setContacts({...contacts,whatsapp:e.target.value})}/></label></div><div className="site-preview"><small>Предпросмотр главной</small><h2>{site.hero_title||'Создаём цифровое будущее'}</h2><p>{site.hero_text||'Вводный текст ещё не заполнен.'}</p></div><button className="button" type="submit">Сохранить</button></form><div className="editor-card"><div className="editor-head"><div><span className="eyebrow">Направления</span><h2>Услуги</h2></div></div>{services.map(service=><article className="inline-service" key={service.slug}><div><strong>{service.name}</strong><span>/{service.slug}</span></div><p>{service.summary}</p><span>{service.published?'Опубликована':'Черновик'}</span></article>)}</div></section>
}

type AdminProject = { id: number; slug: string; title: string; description: string; category: string; images?: string[]; links?: string[]; sort_order?: number; is_published: boolean }

function projectImageUrl(value: string) {
  if (/^https?:\/\//.test(value) || value.startsWith('/')) return value
  return '/storage/' + value.replace(/^storage\//, '')
}

function ContentCollectionsPanel() {
  const { t } = useI18n()
  const emptyService = { slug: '', name: '', short_description: '', description: '', is_published: false }
  const emptyProject = { slug: '', title: '', description: '', category: '', is_published: false }
  const [services, setServices] = useState<AdminService[]>([])
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [site, setSite] = useState<AdminSiteSettings | null>(null)
  const [serviceForm, setServiceForm] = useState(emptyService)
  const [projectForm, setProjectForm] = useState(emptyProject)
  const [projectImages, setProjectImages] = useState<File[]>([])
  const [logo, setLogo] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    try {
      const [serviceResponse, projectResponse, siteResponse] = await Promise.all([
        api<{ data: AdminService[] }>('/admin/services'),
        api<{ data: AdminProject[] }>('/admin/projects'),
        api<{ data: AdminSiteSettings }>('/admin/site-settings'),
      ])
      setServices(serviceResponse.data)
      setProjects(projectResponse.data)
      setSite(siteResponse.data)
    } catch (caught) {
      setError((caught as ApiError).message)
    }
  }

  useEffect(() => { void load() }, [])

  async function createService(event: FormEvent) {
    event.preventDefault()
    try {
      await api('/admin/services', { method: 'POST', body: serviceForm })
      setServiceForm(emptyService)
      setNotice(t('admin.serviceCreated'))
      await load()
    } catch (caught) { setError((caught as ApiError).message) }
  }

  async function saveService(service: AdminService) {
    try {
      await api(`/admin/services/${service.id}`, { method: 'PUT', body: { name: service.name, short_description: service.short_description, description: service.description || '', is_published: service.is_published } })
      setNotice(t('admin.serviceSaved').replace('{name}', service.name))
      await load()
    } catch (caught) { setError((caught as ApiError).message) }
  }

  async function createProject(event: FormEvent) {
    event.preventDefault()
    try {
      const uploadedImages = await Promise.all(projectImages.map((image) => uploadMedia(image)))
      await api('/admin/projects', { method: 'POST', body: { ...projectForm, images: uploadedImages.map((uploaded) => uploaded.data.path), links: [] } })
      setProjectForm(emptyProject)
      setProjectImages([])
      setNotice(t('admin.projectCreated'))
      await load()
    } catch (caught) { setError((caught as ApiError).message) }
  }

  async function toggleProject(project: AdminProject) {
    try {
      await api(`/admin/projects/${project.id}`, { method: 'PUT', body: { is_published: !project.is_published } })
      await load()
    } catch (caught) { setError((caught as ApiError).message) }
  }

  async function removeProject(project: AdminProject) {
    if (!window.confirm(t('admin.deleteProjectConfirm').replace('{name}', project.title))) return
    try {
      await api(`/admin/projects/${project.id}`, { method: 'DELETE' })
      setNotice(t('admin.projectDeleted'))
      await load()
    } catch (caught) { setError((caught as ApiError).message) }
  }

  async function saveLogo(event: FormEvent) {
    event.preventDefault()
    if (!logo || !site) return
    try {
      const uploaded = await uploadMedia(logo)
      await api('/admin/site-settings', { method: 'PUT', body: { ...site, logo_path: uploaded.data.path } })
      setLogo(null)
      setNotice(t('admin.logoUpdated'))
      await load()
    } catch (caught) { setError((caught as ApiError).message) }
  }

  return <section className="admin-section content-collections">
    {error && <div className="form-error" role="alert">{error}</div>}
    {notice && <div className="form-success" role="status">{notice}</div>}
    <form className="editor-card" onSubmit={saveLogo}><div className="editor-head"><div><span className="eyebrow">{t('admin.media')}</span><h2>{t('admin.logo')}</h2></div></div><div className="form-grid"><label>JPEG, PNG, WebP<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setLogo(event.target.files?.[0] || null)} required/></label></div><button className="button" type="submit" disabled={!logo}>{t('admin.uploadLogo')}</button></form>
    <div className="editor-card"><div className="editor-head"><div><span className="eyebrow">CRUD</span><h2>{t('admin.editServices')}</h2></div></div><div className="collection-list">{services.map((service, index) => <article key={service.id}><div className="form-grid"><label>{t('form.name')}<input value={service.name} onChange={(event) => setServices(services.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))}/></label><label>{t('form.slug')}<input value={service.slug} disabled/></label><label className="wide">{t('admin.shortDescription')}<textarea value={service.short_description} onChange={(event) => setServices(services.map((item, itemIndex) => itemIndex === index ? { ...item, short_description: event.target.value } : item))}/></label><label className="wide">{t('admin.fullDescription')}<textarea value={service.description || ''} onChange={(event) => setServices(services.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))}/></label><label className="check"><input type="checkbox" checked={service.is_published} onChange={(event) => setServices(services.map((item, itemIndex) => itemIndex === index ? { ...item, is_published: event.target.checked } : item))}/> {t('form.published')}</label></div><button className="table-action" type="button" onClick={() => void saveService(service)}>{t('form.save')}</button></article>)}</div><form className="form-grid collection-create" onSubmit={createService}><label>{t('admin.newService')}<input value={serviceForm.name} onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })} required/></label><label>{t('form.slug')}<input pattern="[a-z0-9-]+" value={serviceForm.slug} onChange={(event) => setServiceForm({ ...serviceForm, slug: event.target.value.toLowerCase() })} required/></label><label className="wide">{t('admin.shortDescription')}<textarea value={serviceForm.short_description} onChange={(event) => setServiceForm({ ...serviceForm, short_description: event.target.value })} required/></label><button className="button button--small" type="submit">{t('admin.addService')}</button></form></div>
    <div className="editor-card"><div className="editor-head"><div><span className="eyebrow">{t('admin.portfolio')}</span><h2>{t('admin.projects')}</h2></div></div>{projects.length === 0 ? <p className="muted-copy">{t('admin.noProjects')}</p> : <div className="collection-list">{projects.map((project) => <article key={project.id}><div><strong>{project.title}</strong><span>/{project.slug} · {project.category}</span><p>{project.description}</p>{project.images?.length ? <div className="project-admin-thumbnails">{project.images.slice(0, 4).map((image) => <img key={image} src={projectImageUrl(image)} alt={project.title}/>)}</div> : <span>{t('admin.noImages')}</span>}</div><div><button className="table-action" type="button" onClick={() => void toggleProject(project)}>{project.is_published ? t('form.unpublish') : t('form.publish')}</button><button className="table-action table-action--danger" type="button" onClick={() => void removeProject(project)}>{t('form.delete')}</button></div></article>)}</div>}<form className="form-grid collection-create" onSubmit={createProject}><label>{t('form.name')}<input value={projectForm.title} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} required/></label><label>{t('form.slug')}<input pattern="[a-z0-9-]+" value={projectForm.slug} onChange={(event) => setProjectForm({ ...projectForm, slug: event.target.value.toLowerCase() })} required/></label><label>{t('form.category')}<input value={projectForm.category} onChange={(event) => setProjectForm({ ...projectForm, category: event.target.value })} required/></label><label className="wide">{t('form.description')}<textarea value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} required/></label><label className="wide">{t('admin.images')}<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setProjectImages(Array.from(event.target.files || []))}/>{projectImages.length > 0 && <div className="project-upload-list">{projectImages.map((image) => <span key={image.name + image.lastModified}>{image.name}</span>)}</div>}</label><label className="check"><input type="checkbox" checked={projectForm.is_published} onChange={(event) => setProjectForm({ ...projectForm, is_published: event.target.checked })}/> {t('admin.publishNow')}</label><button className="button button--small" type="submit">{t('admin.addProject')}</button></form></div>
  </section>
}
