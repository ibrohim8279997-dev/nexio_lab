import { useI18n, type Language } from '../i18n'

const languages: Language[] = ['en', 'ru', 'uz']

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()
  return <div className="language-switcher" aria-label={t('a11y.language')}>{languages.map((item) => <button key={item} type="button" className={language === item ? 'active' : ''} aria-pressed={language === item} onClick={() => setLanguage(item)}>{item.toUpperCase()}</button>)}</div>
}
