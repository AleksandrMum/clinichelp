import { Outlet } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

export function PublicLayout() {
  return (
    <div className="app-shell public-shell">
      <Header />
      <main className="public-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
