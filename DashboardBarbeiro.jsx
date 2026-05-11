import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const ABAS = [
  { id: 'agenda',   label: 'Agenda',    icon: '📅' },
  { id: 'horarios', label: 'Horários',  icon: '🕐' },
  { id: 'servicos', label: 'Serviços',  icon: '✂️' },
  { id: 'config',   label: 'Barbearia', icon: '⚙️' },
]

export default function DashboardBarbeiro({ session }) {
  const [aba, setAba] = useState('agenda')
  const [barbearia, setBarbearia] = useState(null)
  const [agendamentos, setAgendamentos] = useState([])
  const [servicos, setServicos] = useState([])
  const [horariosBloqueados, setHorariosBloqueados] = useState([])

  // Formulários
  const [cfg, setCfg] = useState({ nome: '', endereco: '', slug: '', telefone: '' })
  const [novoServico, setNovoServico] = useState({ nome: '', preco: '', duracao: '' })
  const [bloqueio, setBloqueio] = useState({ data_hora_inicio: '', data_hora_fim: '', motivo: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { carregar() }, [session])

  const carregar = async () => {
    // Busca barbearia do barbeiro logado
    const { data: b } = await supabase
      .from('barbearias')
      .select('*')
      .eq('owner_id', session.user.id)
      .maybeSingle()

    if (b) {
      setBarbearia(b)
      setCfg({ nome: b.nome || '', endereco: b.endereco || '', slug: b.slug || '', telefone: b.telefone || '' })
      await carregarDados(b.id)
    }
  }

  const carregarDados = async (id) => {
    const [{ data: ag }, { data: sv }, { data: hb }] = await Promise.all([
      supabase.from('agendamentos').select('*, servicos(nome, preco)').eq('barbearia_id', id).order('data_hora'),
      supabase.from('servicos').select('*').eq('barbearia_id', id),
      supabase.from('horarios_bloqueados').select('*').eq('barbearia_id', id).order('data_hora_inicio'),
    ])
    setAgendamentos(ag || [])
    setServicos(sv || [])
    setHorariosBloqueados(hb || [])
  }

  const salvarBarbearia = async () => {
    setLoading(true)
    setMsg(null)
    const payload = {
      ...cfg,
      slug: cfg.slug.toLowerCase().replace(/\s+/g, '-').trim(),
      owner_id: session.user.id,
    }
    if (barbearia) payload.id = barbearia.id

    const { data, error } = await supabase.from('barbearias').upsert([payload]).select()
    if (!error) {
      setBarbearia(data[0])
      setMsg({ tipo: 'success', texto: 'Configurações salvas!' })
      carregarDados(data[0].id)
    } else {
      setMsg({ tipo: 'error', texto: error.message })
    }
    setLoading(false)
  }

  const adicionarServico = async () => {
    if (!barbearia) return setMsg({ tipo: 'error', texto: 'Salve a barbearia primeiro.' })
    const { error } = await supabase.from('servicos').insert([{
      nome: novoServico.nome,
      preco: parseFloat(novoServico.preco),
      duracao_minutos: parseInt(novoServico.duracao),
      barbearia_id: barbearia.id,
    }])
    if (!error) {
      setNovoServico({ nome: '', preco: '', duracao: '' })
      carregarDados(barbearia.id)
    }
  }

  const removerServico = async (id) => {
    if (!confirm('Remover este serviço?')) return
    await supabase.from('servicos').delete().eq('id', id)
    carregarDados(barbearia.id)
  }

  const confirmarAgendamento = async (id) => {
    await supabase.from('agendamentos').update({ status: 'confirmado' }).eq('id', id)
    carregarDados(barbearia.id)
  }

  const cancelarAgendamento = async (id) => {
    if (!confirm('Cancelar este agendamento?')) return
    await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id)
    carregarDados(barbearia.id)
  }

  const bloquearHorario = async () => {
    if (!barbearia) return setMsg({ tipo: 'error', texto: 'Salve a barbearia primeiro.' })
    const { error } = await supabase.from('horarios_bloqueados').insert([{
      barbearia_id: barbearia.id,
      data_hora_inicio: bloqueio.data_hora_inicio,
      data_hora_fim: bloqueio.data_hora_fim,
      motivo: bloqueio.motivo || 'Horário bloqueado',
    }])
    if (!error) {
      setBloqueio({ data_hora_inicio: '', data_hora_fim: '', motivo: '' })
      carregarDados(barbearia.id)
    }
  }

  const removerBloqueio = async (id) => {
    await supabase.from('horarios_bloqueados').delete().eq('id', id)
    carregarDados(barbearia.id)
  }

  const faturamento = agendamentos
    .filter(a => a.status === 'confirmado')
    .reduce((acc, a) => acc + (a.servicos?.preco || 0), 0)

  const pendentes = agendamentos.filter(a => a.status === 'pendente').length

  const fmt = (dt) => new Date(dt).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })

  const linkCliente = barbearia?.slug
    ? `${window.location.origin}/${barbearia.slug}`
    : '— configure o slug em Barbearia'

  return (
    <div className="sidebar-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h3>{barbearia?.nome || 'Minha Barbearia'}</h3>
          <p>{session.user.email}</p>
        </div>

        <nav className="nav">
          {ABAS.map(a => (
            <button
              key={a.id}
              className={`nav-item${aba === a.id ? ' active' : ''}`}
              onClick={() => setAba(a.id)}
            >
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <button className="btn btn-ghost btn-sm btn-full" style={{ color: 'var(--danger)', justifyContent: 'flex-start' }} onClick={() => supabase.auth.signOut()}>
            Sair
          </button>
        </div>
      </aside>

      <main className="main">

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Agendamentos</div>
            <div className="stat-value">{agendamentos.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pendentes</div>
            <div className="stat-value" style={{ color: pendentes > 0 ? 'var(--warn)' : 'inherit' }}>{pendentes}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Faturamento</div>
            <div className="stat-value">R$ {faturamento.toFixed(2)}</div>
          </div>
        </div>

        {/* ── AGENDA ── */}
        {aba === 'agenda' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2>Agenda</h2>
              {barbearia?.slug && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <small>Link do cliente:</small>
                  <code style={{ fontSize: '0.8rem', background: 'var(--gray-100)', padding: '4px 8px', borderRadius: '6px' }}>
                    {linkCliente}
                  </code>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(linkCliente)}>
                    Copiar
                  </button>
                </div>
              )}
            </div>

            {agendamentos.length === 0 ? (
              <p style={{ padding: '2rem 0', textAlign: 'center' }}>Nenhum agendamento ainda.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Serviço</th>
                      <th>Data / Hora</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentos.map(ag => (
                      <tr key={ag.id}>
                        <td style={{ fontWeight: 500 }}>{ag.nome_cliente}</td>
                        <td>{ag.servicos?.nome}</td>
                        <td>{fmt(ag.data_hora)}</td>
                        <td>
                          <span className={`badge badge-${ag.status === 'confirmado' ? 'success' : ag.status === 'cancelado' ? 'danger' : 'warn'}`}>
                            {ag.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {ag.status === 'pendente' && (
                              <button className="btn btn-sm btn-outline" onClick={() => confirmarAgendamento(ag.id)}>
                                Confirmar
                              </button>
                            )}
                            {ag.status !== 'cancelado' && (
                              <button className="btn btn-sm btn-danger" onClick={() => cancelarAgendamento(ag.id)}>
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── HORÁRIOS BLOQUEADOS ── */}
        {aba === 'horarios' && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="card">
              <h2 style={{ marginBottom: '1.25rem' }}>Bloquear horário</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="field">
                  <label>Início</label>
                  <input type="datetime-local" className="input"
                    value={bloqueio.data_hora_inicio}
                    onChange={e => setBloqueio({ ...bloqueio, data_hora_inicio: e.target.value })} />
                </div>
                <div className="field">
                  <label>Fim</label>
                  <input type="datetime-local" className="input"
                    value={bloqueio.data_hora_fim}
                    onChange={e => setBloqueio({ ...bloqueio, data_hora_fim: e.target.value })} />
                </div>
              </div>
              <div className="field" style={{ marginTop: '12px' }}>
                <label>Motivo (opcional)</label>
                <input type="text" className="input" placeholder="Ex: Almoço, Reunião..."
                  value={bloqueio.motivo}
                  onChange={e => setBloqueio({ ...bloqueio, motivo: e.target.value })} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={bloquearHorario}>
                Bloquear horário
              </button>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '1.25rem' }}>Horários bloqueados</h2>
              {horariosBloqueados.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '1rem 0' }}>Nenhum horário bloqueado.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {horariosBloqueados.map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: 'var(--black)', fontWeight: 500, fontSize: '0.9rem', marginBottom: '2px' }}>{h.motivo}</p>
                        <small>{fmt(h.data_hora_inicio)} → {fmt(h.data_hora_fim)}</small>
                      </div>
                      <button className="btn btn-sm btn-danger" onClick={() => removerBloqueio(h.id)}>Remover</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SERVIÇOS ── */}
        {aba === 'servicos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <h2 style={{ marginBottom: '1.25rem' }}>Novo serviço</h2>
              <div className="field">
                <label>Nome</label>
                <input type="text" className="input" placeholder="Ex: Degradê navalhado"
                  value={novoServico.nome} onChange={e => setNovoServico({ ...novoServico, nome: e.target.value })} />
              </div>
              <div className="field">
                <label>Preço (R$)</label>
                <input type="number" className="input" placeholder="45.00"
                  value={novoServico.preco} onChange={e => setNovoServico({ ...novoServico, preco: e.target.value })} />
              </div>
              <div className="field">
                <label>Duração (minutos)</label>
                <input type="number" className="input" placeholder="30"
                  value={novoServico.duracao} onChange={e => setNovoServico({ ...novoServico, duracao: e.target.value })} />
              </div>
              <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={adicionarServico}>
                Salvar serviço
              </button>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '1.25rem' }}>Serviços ativos</h2>
              {servicos.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '1rem 0' }}>Nenhum serviço cadastrado.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {servicos.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: 'var(--black)', fontWeight: 500, fontSize: '0.9rem', marginBottom: '2px' }}>{s.nome}</p>
                        <small>{s.duracao_minutos} min</small>
                      </div>
                      <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>R$ {s.preco}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => removerServico(s.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CONFIG BARBEARIA ── */}
        {aba === 'config' && (
          <div className="card" style={{ maxWidth: '520px' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Dados da barbearia</h2>

            {msg && (
              <div className={`msg msg-${msg.tipo === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>
                {msg.texto}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="field">
                <label>Nome da barbearia</label>
                <input type="text" className="input" placeholder="Barbearia do João"
                  value={cfg.nome} onChange={e => setCfg({ ...cfg, nome: e.target.value })} />
              </div>
              <div className="field">
                <label>Endereço</label>
                <input type="text" className="input" placeholder="Rua das Flores, 123 — São Paulo"
                  value={cfg.endereco} onChange={e => setCfg({ ...cfg, endereco: e.target.value })} />
              </div>
              <div className="field">
                <label>Telefone / WhatsApp</label>
                <input type="text" className="input" placeholder="(11) 99999-9999"
                  value={cfg.telefone} onChange={e => setCfg({ ...cfg, telefone: e.target.value })} />
              </div>
              <div className="field">
                <label>Slug (link do cliente)</label>
                <input type="text" className="input" placeholder="barbearia-do-joao"
                  value={cfg.slug} onChange={e => setCfg({ ...cfg, slug: e.target.value })} />
                <small style={{ marginTop: '6px', display: 'block' }}>
                  Link gerado: <strong>{window.location.origin}/{cfg.slug || '...'}</strong>
                </small>
              </div>
            </div>

            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={salvarBarbearia} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
