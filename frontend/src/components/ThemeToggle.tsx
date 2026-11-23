import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'

type Theme = 'light' | 'dark'

function readTheme(): Theme {
  return window.localStorage.getItem('nexio-theme') === 'light' ? 'light' : 'dark'
}

export function applyStoredTheme() {
  document.documentElement.dataset.theme = readTheme()
}

export function ThemeToggle() {
  const { t } = useI18n()
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('nexio-theme', theme)
  }, [theme])

  const nextTheme = theme === 'light' ? 'dark' : 'light'

  return <button className="theme-toggle" type="button" onClick={() => setTheme(nextTheme)} aria-label={t(nextTheme === 'dark' ? 'theme.toDark' : 'theme.toLight')} title={t(nextTheme === 'dark' ? 'theme.dark' : 'theme.light')}><span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span></button>
}
