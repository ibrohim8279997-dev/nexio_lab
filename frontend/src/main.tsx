import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import './theme.css'
import { applyStoredTheme } from './components/ThemeToggle'
import { I18nProvider } from './i18n'

applyStoredTheme()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js') })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><I18nProvider><BrowserRouter><App/></BrowserRouter></I18nProvider></StrictMode>,
)
