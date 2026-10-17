import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

export function Brand({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n()
  return (
    <Link to="/" className={`brand ${compact ? 'brand--compact' : ''}`} aria-label={`Nexio Lab — ${t('notFound.home')}`}>
      <img className="brand-logo brand-logo--light" src="/brand/nexio-logo-light.webp" alt="Nexio Lab — Future Starts Here"/>
      <img className="brand-logo brand-logo--dark" src="/brand/nexio-logo-dark.webp" alt="" aria-hidden="true"/>
    </Link>
  )
}
