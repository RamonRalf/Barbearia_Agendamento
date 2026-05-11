import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Landing from './pages/Landing'
import Login from './pages/Login'
import DashboardBarbeiro from './pages/DashboardBarbeiro'
import DashboardCliente from './pages/DashboardCliente'

export default function App() {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null) // 'barbeiro' | 'cliente' | null
  const [view, setView] = useState('landing') // 'landing' | 'login'
  const [loading, setLoading] = useState(true)

  // Slug da barbearia na URL: ex. /barbearia-do-joao
  const slug = window.location.pathname.replace(/^\//, '').replace(/\/$/, '') || null

  const detectarRole = async (email) => {
    const { data } = await supabase
      .from('convites')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()
    return data ? 'barbeiro' : 'cliente'
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        const r = await detectarRole(session.user.email)
        setRole(r)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        const r = await detectarRole(session.user.email)
        setRole(r)
      } else {
        setRole(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="page-center">
        <p style={{ color: 'var(--gray-400)' }}>Carregando...</p>
      </div>
    )
  }

  // Logado como barbeiro
  if (session && role === 'barbeiro') {
    return <DashboardBarbeiro session={session} />
  }

  // Logado como cliente
  if (session && role === 'cliente') {
    return <DashboardCliente session={session} slug={slug} />
  }

  // Aguardando role após login
  if (session && !role) {
    return (
      <div className="page-center">
        <p style={{ color: 'var(--gray-400)' }}>Identificando perfil...</p>
      </div>
    )
  }

  // Não logado
  if (view === 'login' || slug) {
    return <Login onVoltar={() => setView('landing')} slug={slug} />
  }

  return <Landing onEntrar={() => setView('login')} />
}
