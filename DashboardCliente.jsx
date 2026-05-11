import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function DashboardCliente({ session, slug }) {
  const [barbearia, setBarbearia] = useState(null)
  const [servicos, setServicos] = useState([])
  const [agendamentos, setAgendamentos] = useState([])
  const [etapa, setEtapa] = useState(1) // 1: Serviço, 2: Data/Hora, 3: Confirmar
  const [sel, setSel] = useState({ servico: null, data: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { carregar() }, [slug, session])

  const carregar = async () => {
    let query = supabase.from('barbearias').select('*')
    if (slug) query = query.eq('slug', slug)
    const { data: b } = await query.limit(1).single()

    if (b) {
      setBarbearia(b)
      const [{ data: sv }, { data: ag }] = await Promise.all([
        supabase.from('servicos').select('*').eq('barbearia_id', b.id),
        supabase.from('agendamentos').select('*, servicos(nome)').eq('user_id', session.user.id).order('data_hora'),
      ])
      setServicos(sv || [])
      setAgendamentos(ag || [])
    }
  }

  const confirmar = async () => {
    if (!sel.data) return setMsg({ tipo: 'error', texto: 'Selecione um horário.' })
    setLoading(true)
    setMsg(null)

    const { error } = await supabase.from('agendamentos').insert([{
      barbearia_id: barbearia.id,
      user_id: session.user.id,
      servico_id: sel.servico.id,
      nome_cliente: session.user.email.split('@')[0],
      data_hora: sel.data,
      status: 'pendente',
    }])

    setLoading(false)
    if (!error) {
      setMsg({ tipo: 'success', texto: 'Agendamento realizado! Aguarde a confirmação.' })
      setEtapa(1)
      setSel({ servico: null, data: '' })
      carregar()
    } else {
      setMsg({ tipo: 'error', texto: 'Erro ao agendar. Tente novamente.' })
    }
  }

  const fmt = (dt) => new Date(dt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })

  const statusLabel = { pendente: 'Pendente', confirmado: 'Confirmado', cancelado: 'Cancelado' }
  const statusBadge = { pendente: 'warn', confirmado: 'success', cancelado: 'danger' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>

      {/* Topo */}
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--gray-200)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1rem' }}>{barbearia?.nome || 'Carregando...'}</h3>
          {barbearia?.endereco && <small>{barbearia.endereco}</small>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <small style={{ color: 'var(--gray-600)' }}>{session.user.email}</small>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => supabase.auth.signOut()}>
            Sair
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Card de agendamento */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Agendar horário</h2>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.88rem' }}>Escolha o serviço e o melhor horário para você.</p>

          {/* Steps */}
          <div className="steps">
            {[1, 2, 3].map(n => (
              <div key={n} className={`step-dot${etapa >= n ? ' active' : ''}`} />
            ))}
          </div>

          {/* Etapa 1: Serviço */}
          {etapa === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}>Selecione o serviço</p>
              {servicos.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '1rem 0' }}>Nenhum serviço disponível.</p>
              ) : servicos.map(s => (
                <div
                  key={s.id}
                  className={`select-card${sel.servico?.id === s.id ? ' selected' : ''}`}
                  onClick={() => setSel({ ...sel, servico: s })}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'var(--black)', fontWeight: 500, fontSize: '0.95rem', marginBottom: '2px' }}>{s.nome}</p>
                    <small>{s.duracao_minutos} min</small>
                  </div>
                  <span style={{ fontWeight: 500, color: 'var(--black)' }}>R$ {s.preco}</span>
                </div>
              ))}
              <button
                className="btn btn-primary"
                style={{ marginTop: '8px' }}
                disabled={!sel.servico}
                onClick={() => setEtapa(2)}
              >
                Continuar →
              </button>
            </div>
          )}

          {/* Etapa 2: Data/Hora */}
          {etapa === 2 && (
            <div>
              <div className="field" style={{ marginBottom: '1.25rem' }}>
                <label>Data e horário</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={sel.data}
                  onChange={e => setSel({ ...sel, data: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline" onClick={() => setEtapa(1)}>← Voltar</button>
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={!sel.data} onClick={() => setEtapa(3)}>
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Etapa 3: Confirmar */}
          {etapa === 3 && (
            <div>
              <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '16px 18px', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resumo</p>
                <p style={{ color: 'var(--black)', fontWeight: 500, marginBottom: '4px' }}>{sel.servico?.nome}</p>
                <small>{fmt(sel.data)} · R$ {sel.servico?.preco} · {sel.servico?.duracao_minutos} min</small>
              </div>

              {msg && (
                <div className={`msg msg-${msg.tipo === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>
                  {msg.texto}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline" onClick={() => setEtapa(2)}>← Voltar</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmar} disabled={loading}>
                  {loading ? 'Confirmando...' : 'Confirmar agendamento'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Meus agendamentos */}
        <div className="card">
          <h2 style={{ marginBottom: '1.25rem' }}>Meus agendamentos</h2>
          {agendamentos.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '1rem 0' }}>Nenhum agendamento ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {agendamentos.map(a => (
                <div className="timeline-item" key={a.id}>
                  <div className={`timeline-dot ${a.status}`} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ color: 'var(--black)', fontWeight: 500, fontSize: '0.9rem', marginBottom: '2px' }}>
                        {a.servicos?.nome}
                      </p>
                      <span className={`badge badge-${statusBadge[a.status]}`}>
                        {statusLabel[a.status]}
                      </span>
                    </div>
                    <small>{fmt(a.data_hora)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
