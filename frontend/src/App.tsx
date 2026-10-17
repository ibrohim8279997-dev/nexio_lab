import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ServicesPage, ServiceDetailPage } from './pages/ServicesPage'
import { WorksPage, WorkDetailPage } from './pages/WorksPage'
import { TeamPage, TeamDetailPage } from './pages/TeamPage'
import { ContactPage } from './pages/ContactPage'
import { ClientAccessPage, ClientOrderPage } from './pages/ClientPage'
import { AdminPage } from './pages/AdminPage'
import { NotFoundPage, OfflinePage } from './pages/StatusPage'

export default function App() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  if (!online) return <OfflinePage/>

  return <Routes>
    <Route element={<Layout/>}>
      <Route path="/" element={<HomePage/>}/>
      <Route path="/services" element={<ServicesPage/>}/>
      <Route path="/services/:slug" element={<ServiceDetailPage/>}/>
      <Route path="/works" element={<WorksPage/>}/>
      <Route path="/works/:slug" element={<WorkDetailPage/>}/>
      <Route path="/team" element={<TeamPage/>}/>
      <Route path="/team/:slug" element={<TeamDetailPage/>}/>
      <Route path="/contacts" element={<ContactPage/>}/>
    </Route>
    <Route path="/client/access" element={<ClientAccessPage/>}/>
    <Route path="/client/order" element={<ClientOrderPage/>}/>
    <Route path="/admin/*" element={<AdminPage/>}/>
    <Route path="/offline" element={<OfflinePage/>}/>
    <Route path="*" element={<NotFoundPage/>}/>
  </Routes>
}
