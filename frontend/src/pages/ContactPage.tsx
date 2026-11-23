import { ErrorState, LoadingState, PageIntro } from '../components/States'
import { useResource } from '../hooks/useResource'
import { ProjectInquiryForm } from '../components/ProjectInquiryForm'
import { useI18n } from '../i18n'
import { api } from '../lib/api'
import type { PublicContacts, SiteContent } from '../types'

type ChannelKind = 'phone' | 'email' | 'telegram' | 'whatsapp'

function channelHref(kind: ChannelKind, value: string) {
  if (kind === 'phone') return 'tel:' + value.replace(/[^+\d]/g, '')
  if (kind === 'email') return 'mailto:' + value
  if (/^https?:\/\//.test(value)) return value
  if (kind === 'telegram') return 'https://t.me/' + value.replace(/^@/, '')
  return value
}

export function ContactPage() {
  const { t } = useI18n()
  const { data, loading, error, reload } = useResource<PublicContacts>(() => api<{ data: (SiteContent & PublicContacts) | { contacts?: PublicContacts } | null }>('/site').then((response): PublicContacts => {
    const payload = response.data
    if (!payload) return {}
    return 'contacts' in payload && payload.contacts ? payload.contacts : payload as PublicContacts
  }), [])
  const channels = [
    ['phone', t('contacts.phone'), data?.phone || ''],
    ['email', 'Email', data?.email || ''],
    ['telegram', 'Telegram', data?.telegram || ''],
    ['whatsapp', 'WhatsApp', data?.whatsapp || ''],
  ].filter((entry) => Boolean(entry[2])) as Array<[ChannelKind, string, string]>

  return <><PageIntro eyebrow={t('contacts.eyebrow')} title={t('contacts.title')}><p>{t('contacts.lead')}</p></PageIntro><section className="section"><div className="container contact-grid"><div>
    <span className="eyebrow">{t('contacts.connect')}</span>
    {loading ? <LoadingState/> : error ? <ErrorState message={error} retry={reload}/> : channels.length ? <div className="contact-list">{data?.director_name && <p className="contact-director">{t('contacts.director')}: {data.director_name}</p>}{channels.map(([kind, label, value]) => <a key={kind} href={channelHref(kind, value)} target={kind === 'phone' || kind === 'email' ? undefined : '_blank'} rel="noreferrer"><span>{label}</span><strong>{value}</strong><b>↗</b></a>)}</div> : <div className="contact-pending"><h2>{t('contacts.emptyTitle')}</h2><p>{t('contacts.emptyText')}</p></div>}
  </div><aside className="contact-note"><span className="status-dot"><i/> {data?.online_label || t('footer.online')}</span><h2>{t('contacts.what')}</h2><ul><li>{t('contacts.l1')}</li><li>{t('contacts.l2')}</li><li>{t('contacts.l3')}</li><li>{t('contacts.l4')}</li></ul><p>{t('contacts.after')}</p></aside></div></section><ProjectInquiryForm/></>
}
