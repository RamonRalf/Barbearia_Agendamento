import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login({ onVoltar, slug }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modo, setModo] = useState('login') // 'login' | 'cadastro'
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null) // { tipo: 'error'|'success', texto }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password: senha })
        if (error) throw error
        setMsg({ tipo: 'success', texto: 'Conta criada! Verifique seu e-mail e faça login.' })
        setModo('login')
      }
    } catch (err) {
      const msgs = {
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'User already registered': 'Este e-mail já está cadastrado. Faça login.',
        'Password should be at least 6 characters': 'A senha precisa ter pelo menos 6 caracteres.',
      }
      setMsg({ tipo: 'error', texto: msgs[err.message] || err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-center">
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Voltar */}
        {onVoltar && !slug && (
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }} onClick={onVoltar}>
            ← Voltar
          </button>
        )}

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '12px' }}>✂</div>
          <h2 style={{ marginBottom: '4px' }}>
            {modo === 'login' ? 'Entrar na conta' : 'Criar conta'}
          </h2>
          <p style={{ fontSize: '0.88rem' }}>
            {slug
              ? `Agende seu horário na barbearia`
              : 'Acesse seu painel ou crie sua conta'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              className="input"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
            />
          </div>

          {msg && (
            <div className={`msg msg-${msg.tipo === 'error' ? 'error' : 'success'}`}>
              {msg.texto}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Processando...' : (modo === 'login' ? 'Entrar' : 'Criar conta')}
          </button>
        </form>

        {/* Toggle */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setModo(modo === 'login' ? 'cadastro' : 'login'); setMsg(null) }}
          >
            {modo === 'login' ? 'Novo por aqui? Cadastre-se' : 'Já tem conta? Entrar'}
          </button>
        </div>

      </div>
    </div>
  )
}
