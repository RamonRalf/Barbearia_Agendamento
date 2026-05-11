export default function Landing({ onEntrar }) {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <span className="landing-logo">✂ BarberApp</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost btn-sm" onClick={onEntrar}>Entrar</button>
          <button className="btn btn-primary btn-sm" onClick={onEntrar}>Começar grátis</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div>
          <div className="hero-tag">
            ✦ Sistema de agendamento profissional
          </div>
          <h1>Sua barbearia<br />organizada.</h1>
          <p>
            Gerencie sua agenda, seus clientes e seus serviços em um só lugar.
            Cada barbeiro tem o seu próprio painel — simples assim.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onEntrar}>
              Acessar sistema →
            </button>
          </div>
        </div>

        {/* Visual decorativo */}
        <div className="hero-visual">
          <div style={{ marginBottom: '8px' }}>
            <small style={{ fontWeight: 500, color: 'var(--gray-600)' }}>Agenda de hoje</small>
          </div>
          {[
            { nome: 'Lucas Ferreira', servico: 'Degradê', hora: '09:00', status: 'green' },
            { nome: 'Rafael Souza',   servico: 'Barba',   hora: '10:30', status: 'green' },
            { nome: 'Pedro Alves',    servico: 'Corte',   hora: '11:15', status: 'orange' },
            { nome: 'Mateus Lima',    servico: 'Degradê', hora: '13:00', status: 'gray' },
          ].map((item, i) => (
            <div className="mini-card" key={i}>
              <div className={`dot ${item.status}`}></div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--black)', fontWeight: 500, fontSize: '0.88rem', marginBottom: '2px' }}>{item.nome}</p>
                <small>{item.servico}</small>
              </div>
              <small style={{ fontWeight: 500, color: 'var(--gray-600)' }}>{item.hora}</small>
            </div>
          ))}
          <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between' }}>
            <small>4 clientes hoje</small>
            <small style={{ color: 'var(--success)', fontWeight: 500 }}>R$ 220 confirmado</small>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        {[
          { icon: '📅', titulo: 'Agenda inteligente', desc: 'Visualize todos os agendamentos do dia, confirme ou cancele com um clique.' },
          { icon: '✂️', titulo: 'Sua barbearia, seu link', desc: 'Cada barbeiro tem um link exclusivo para compartilhar com seus clientes.' },
          { icon: '🔒', titulo: 'Acesso por convite', desc: 'Barbeiros entram apenas com convite. Clientes se cadastram livremente.' },
          { icon: '📊', titulo: 'Controle de serviços', desc: 'Cadastre seus serviços com preço e duração. Faturamento calculado automaticamente.' },
          { icon: '👥', titulo: 'Multi-profissional', desc: 'Adicione toda a equipe. Cada barbeiro gerencia apenas a sua própria agenda.' },
          { icon: '📱', titulo: 'Funciona no celular', desc: 'Interface responsiva. Seus clientes agendam direto pelo celular, sem app.' },
        ].map((f, i) => (
          <div className="feature-item" key={i}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.titulo}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA final */}
      <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-100)' }}>
        <h2 style={{ marginBottom: '12px' }}>Pronto para organizar sua barbearia?</h2>
        <p style={{ marginBottom: '2rem' }}>Entre em contato para receber seu convite de acesso.</p>
        <button className="btn btn-primary" onClick={onEntrar}>Acessar agora →</button>
      </div>

      <footer className="landing-footer">
        <small>© {new Date().getFullYear()} BarberApp · Feito com cuidado</small>
      </footer>
    </div>
  )
}
