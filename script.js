// ================================================
// BARBEARIA BW — script.js
// Supabase Auth + Agendamento
// ================================================

const SUPABASE_URL = "https://ufczmjdgfbavfnuhmtwc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmY3ptamRnZmJhdmZudWhtdHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTQ1NzUsImV4cCI6MjA5Mjk3MDU3NX0.a7QqxHoMFXvbRaIOZMkpmZEswWyxrtuUK1ub63obiCU";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORIAS = {
    "Combos":              ["Corte Barba Sobrancelha"],
    "Corte":               ["Corte Degradê","Corte Social","Corte Infantil","Corte Todo na Tesoura","Corte 1 Máquina","Navalhar","Pezinho"],
    "Barba":               ["Barba Completa (Toalha Quente)","Design de Barba Navalha","Barba na Máquina","Afinar Bigode"],
    "Química Cabelo":      ["Luzes e Corte","Nevou","Colorimetria"],
    "Serviços Adicionais": ["Limpeza de Pele","Pigmentação","Limpeza Auricular/Nasal","Design Sobrancelha Navalha"]
};

const DESCRICOES = {
    "Corte Barba Sobrancelha":        "O pacote completo",
    "Corte Degradê":                  "Moderno e navalhado",
    "Corte Social":                   "Clássico e alinhado",
    "Corte Infantil":                 "Cuidado especial",
    "Corte Todo na Tesoura":          "Artesanal",
    "Corte 1 Máquina":                "Praticidade",
    "Navalhar":                       "Acabamento na navalha",
    "Pezinho":                        "Apenas o contorno",
    "Barba Completa (Toalha Quente)": "Barboterapia",
    "Design de Barba Navalha":        "Alinhamento",
    "Barba na Máquina":               "Aparo rápido",
    "Afinar Bigode":                  "Ajuste fino",
    "Luzes e Corte":                  "Aprox. 3 horas",
    "Nevou":                          "Descoloração Global",
    "Colorimetria":                   "Aplicação de cor",
    "Limpeza de Pele":                "Remoção impurezas",
    "Pigmentação":                    "Cobertura de falhas",
    "Limpeza Auricular/Nasal":        "Remoção pelos",
    "Design Sobrancelha Navalha":     "Na navalha"
};

const HORARIOS = ['09:00','09:30','10:00','10:30','11:00','11:20','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:20'];

let usuarioLogado = null;
let servicoSelecionado = null;

// ================================================
// INICIALIZAÇÃO
// ================================================
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        usuarioLogado = session.user;
        await atualizarBarraUsuario();
        document.getElementById('headerLoginBtn').style.display = 'none';
    } else {
        document.getElementById('headerLoginBtn').style.display = 'block';
    }

    _supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            usuarioLogado = session.user;
            await atualizarBarraUsuario();
            iniciarRealtimeCliente();
            document.getElementById('headerLoginBtn').style.display = 'none';
        } else {
            usuarioLogado = null;
            document.getElementById('userBar').style.display = 'none';
            document.getElementById('headerLoginBtn').style.display = 'block';
        }
    });

    await carregarServicos();
    iniciarEventosAuth();
    iniciarEventosAgendamento();
});

// ================================================
// REALTIME
// ================================================
function iniciarRealtimeCliente() {
    _supabase
        .channel('client-appointments')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments' }, () => {
            const tela = document.getElementById('telaAgendamentos');
            if (tela && tela.style.display !== 'none') carregarMeusAgendamentos();
        })
        .subscribe();
}

// ================================================
// BARRA DO USUÁRIO LOGADO
// ================================================
async function atualizarBarraUsuario() {
    const { data: profile } = await _supabase
        .from('profiles').select('nome_completo').eq('id', usuarioLogado.id).single();
    const nome = profile?.nome_completo || usuarioLogado.email;
    document.getElementById('userBarName').innerText = nome.split(' ')[0];
    document.getElementById('userBarAvatar').innerText = nome.charAt(0).toUpperCase();
    document.getElementById('userBar').style.display = 'flex';
}

// ================================================
// CARREGAR SERVIÇOS
// ================================================
async function carregarServicos() {
    const listaEl = document.getElementById('lista-servicos');
    listaEl.innerHTML = '<p style="text-align:center;color:#666;padding:40px">Carregando serviços...</p>';

    const { data: servicos, error } = await _supabase.from('services').select('*').order('id');
    if (error) { listaEl.innerHTML = '<p style="text-align:center;color:#e74c3c;padding:40px">Erro ao carregar serviços.</p>'; return; }

    const servicoMap = {};
    servicos.forEach(s => servicoMap[s.nome] = s);

    let html = '';
    Object.entries(CATEGORIAS).forEach(([categoria, nomes]) => {
        const lista = nomes.filter(n => servicoMap[n]).map(n => servicoMap[n]);
        if (!lista.length) return;
        const cards = lista.map(s => {
            const preco = parseFloat(s.preco).toFixed(2).replace('.', ',');
            return `<div class="service-card" data-duration="${s.duracao}" data-price="${preco}" data-nome="${s.nome}">
                <div class="service-info"><h3>${s.nome}</h3><p>${DESCRICOES[s.nome] || ''}</p></div>
                <div class="price">R$ ${preco}</div>
            </div>`;
        }).join('');
        html += `<div class="category-item">
            <div class="category-header"><span>${categoria}</span><span class="arrow">▼</span></div>
            <div class="category-content"><div class="services-grid">${cards}</div></div>
        </div>`;
    });
    html += `<div class="footer-action"><button class="btn-confirm" id="btnAgendar">Agendar Agora</button></div>`;
    listaEl.innerHTML = html;

    document.querySelectorAll('.category-header').forEach(h => { h.onclick = () => h.parentElement.classList.toggle('open'); });
    document.querySelectorAll('.service-card').forEach(c => {
        c.onclick = () => { document.querySelectorAll('.service-card').forEach(el => el.classList.remove('active')); c.classList.add('active'); servicoSelecionado = c; };
    });

    document.getElementById('btnAgendar').onclick = () => {
        if (!servicoSelecionado) return alert("Selecione um serviço primeiro!");
        if (!usuarioLogado) { abrirModalAuth(); } else { abrirModalAgendamento(); }
    };

    document.getElementById('btnLogout').onclick = async () => { await _supabase.auth.signOut(); alert("Você saiu da sua conta."); };
}

// ================================================
// MODAL AUTH
// ================================================
function iniciarEventosAuth() {
    const modalAuth = document.getElementById('modalAuth');
    ['closeModalAuth','closeModalAuth2','closeModalAuth3'].forEach(id => { document.getElementById(id).onclick = () => fecharModalAuth(); });
    modalAuth.onclick = (e) => { if (e.target === modalAuth) fecharModalAuth(); };
    document.getElementById('btnIrLogin').onclick    = () => irParaEtapa('login');
    document.getElementById('btnIrCadastro').onclick = () => irParaEtapa('cadastro');
    document.getElementById('btnVoltarLogin').onclick    = () => irParaEtapa('escolha');
    document.getElementById('btnVoltarCadastro').onclick = () => irParaEtapa('escolha');
    document.getElementById('btnIrCadastro2').onclick = () => irParaEtapa('cadastro');
    document.getElementById('btnIrLogin2').onclick    = () => irParaEtapa('login');

    document.getElementById('btnLogin').onclick = async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const senha = document.getElementById('loginSenha').value;
        const erroEl = document.getElementById('loginErro');
        const btn = document.getElementById('btnLogin');
        if (!email || !senha) return mostrarErro(erroEl, 'Preencha e-mail e senha.');
        btn.disabled = true; btn.innerText = 'Entrando...';
        const { data: loginData, error } = await _supabase.auth.signInWithPassword({ email, password: senha });
        btn.disabled = false; btn.innerText = 'Entrar';
        if (error) { mostrarErro(erroEl, 'E-mail ou senha incorretos.'); return; }

        // Verifica se é barbeiro e redireciona
        if (loginData.user) {
            const { data: profile } = await _supabase
                .from('profiles')
                .select('tipo_usuario')
                .eq('id', loginData.user.id)
                .single();

            if (profile?.tipo_usuario === 'barbeiro') {
                window.location.href = '/Barbearia_Agendamento/barbeiro.html';
                return;
            }

            await _supabase.from('profiles').upsert({ id: loginData.user.id, tipo_usuario: 'cliente' }, { onConflict: 'id', ignoreDuplicates: true });
        }

        fecharModalAuth();
        // Se veio do botão do header (sem serviço selecionado), só fecha o modal
        if (servicoSelecionado) {
            setTimeout(() => abrirModalAgendamento(), 300);
        }
    };

    document.getElementById('btnCadastrar').onclick = async () => {
        const nome = document.getElementById('cadNome').value.trim();
        const email = document.getElementById('cadEmail').value.trim();
        const telefone = document.getElementById('cadTelefone').value.trim();
        const senha = document.getElementById('cadSenha').value;
        const erroEl = document.getElementById('cadErro');
        const btn = document.getElementById('btnCadastrar');
        if (!nome || !email || !telefone || !senha) return mostrarErro(erroEl, 'Preencha todos os campos.');
        if (senha.length < 6) return mostrarErro(erroEl, 'Senha deve ter no mínimo 6 caracteres.');
        btn.disabled = true; btn.innerText = 'Criando conta...';
        const { data, error } = await _supabase.auth.signUp({ email, password: senha });
        if (error) { btn.disabled = false; btn.innerText = 'Criar Conta'; return mostrarErro(erroEl, 'Erro ao criar conta: ' + error.message); }
        if (data.user) { await _supabase.from('profiles').upsert({ id: data.user.id, nome_completo: nome, telefone, tipo_usuario: 'cliente' }); }
        btn.disabled = false; btn.innerText = 'Criar Conta';
        fecharModalAuth();
        setTimeout(() => abrirModalAgendamento(), 300);
    };
}

function abrirModalAuth() { irParaEtapa('escolha'); document.getElementById('modalAuth').style.display = 'flex'; }
function fecharModalAuth() { document.getElementById('modalAuth').style.display = 'none'; }

function irParaEtapa(etapa) {
    document.getElementById('authEtapa1').style.display        = etapa === 'escolha'  ? 'block' : 'none';
    document.getElementById('authEtapaLogin').style.display    = etapa === 'login'    ? 'block' : 'none';
    document.getElementById('authEtapaCadastro').style.display = etapa === 'cadastro' ? 'block' : 'none';
    ['loginErro','cadErro'].forEach(id => { const el = document.getElementById(id); el.style.display = 'none'; el.innerText = ''; });
}

function mostrarErro(el, msg) { el.innerText = msg; el.style.display = 'block'; }

// ================================================
// MODAL AGENDAMENTO
// ================================================
function iniciarEventosAgendamento() {
    const modal = document.getElementById('modal');
    document.getElementById('closeModal').onclick = () => modal.style.display = 'none';
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    document.getElementById('btnFinalizar').onclick = async () => {
        const diaEl  = document.querySelector('.calendar-day.active');
        const horaEl = document.querySelector('.time-slot.active');
        if (!diaEl)  return alert("Selecione um dia!");
        if (!horaEl) return alert("Selecione um horário!");

        const btn = document.getElementById('btnFinalizar');
        btn.disabled = true; btn.innerText = 'Salvando...';

        const dia = diaEl.dataset.dia.padStart(2, '0');
        const mes = diaEl.dataset.mes.padStart(2, '0');
        const dataISO = `${diaEl.dataset.ano}-${mes}-${dia}T${horaEl.innerText}:00`;

        await _supabase.from('profiles').upsert({ id: usuarioLogado.id, tipo_usuario: 'cliente' }, { onConflict: 'id', ignoreDuplicates: true });

        const precoTexto = servicoSelecionado?.dataset.price || '0';
        const preco = parseFloat(precoTexto.replace(',', '.')) || 0;

        const { error } = await _supabase.from('appointments').insert([{
            cliente_id:    usuarioLogado.id,
            barbeiro_nome: document.getElementById('selectProf').value,
            servico_nome:  document.getElementById('resumo-servico').innerText,
            data_hora:     dataISO,
            status:        'pendente',
            preco:         preco
        }]);

        btn.disabled = false; btn.innerText = 'Confirmar Agendamento';
        if (error) { console.error(error); return alert("Erro ao salvar: " + error.message); }
        alert("✅ Agendamento realizado! Em breve o barbeiro confirmará.");
        modal.style.display = 'none';
    };
}

async function abrirModalAgendamento() {
    document.getElementById('resumo-servico').innerText = servicoSelecionado.querySelector('h3').innerText;
    document.getElementById('resumo-detalhes').innerText = `${servicoSelecionado.dataset.duration} • R$ ${servicoSelecionado.dataset.price}`;
    document.getElementById('timeGrid').innerHTML = '';
    document.getElementById('area-confirmar').style.display = 'none';
    document.getElementById('secaoHorarios').style.display = 'none';
    document.getElementById('modal').style.display = 'flex';
    await carregarBarbeiros();
    await renderCalendar();
}

async function carregarBarbeiros() {
    const picker = document.getElementById('barberPicker');
    picker.innerHTML = '<p style="color:var(--dim);font-size:0.8rem;padding:8px">Carregando...</p>';
    const { data: barbeiros, error } = await _supabase.from('profiles').select('id, nome_completo').eq('tipo_usuario', 'barbeiro').order('nome_completo');
    if (error || !barbeiros?.length) { picker.innerHTML = '<p style="color:var(--dim);font-size:0.8rem;padding:8px">Nenhum barbeiro disponível.</p>'; return; }
    picker.innerHTML = '';
    barbeiros.forEach((b, idx) => {
        const nome = b.nome_completo || 'Barbeiro';
        const iniciais = nome.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase();
        const card = document.createElement('div');
        card.className = `barber-card ${idx === 0 ? 'active' : ''}`;
        card.dataset.barber = nome;
        card.onclick = () => selectBarber(card);
        card.innerHTML = `<div class="barber-card-avatar">${iniciais}</div><div class="barber-card-name">${nome.split(' ')[0]}</div><div class="barber-card-role">Barbeiro</div><div class="barber-card-dot"></div>`;
        picker.appendChild(card);
        if (idx === 0) document.getElementById('selectProf').value = nome;
    });
}

// ================================================
// CARROSSEL DE BARBEIROS
// ================================================
window.selectBarber = async function(el) {
    document.querySelectorAll('.barber-card').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('selectProf').value = el.dataset.barber;
    document.getElementById('area-confirmar').style.display = 'none';
    document.getElementById('secaoHorarios').style.display = 'block';
    await renderTimes();
};

// ================================================
// CALENDÁRIO
// ================================================
async function renderCalendar() {
    const cal = document.getElementById('calendar');
    cal.innerHTML = '';
    const hoje = new Date();
    const ano = hoje.getFullYear(), mes = hoje.getMonth(), diaHoje = hoje.getDate();
    const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    document.getElementById('monthLabel').innerText = `${nomesMes[mes]}, ${ano}`;
    ['D','S','T','Q','Q','S','S'].forEach(d => {
        const el = document.createElement('div');
        el.style.cssText = 'font-weight:600;font-size:0.62rem;color:#444;padding-bottom:10px;text-align:center;letter-spacing:1px;';
        el.innerText = d; cal.appendChild(el);
    });
    const primeiroDia = new Date(ano, mes, 1).getDay();
    for (let s = 0; s < primeiroDia; s++) cal.appendChild(document.createElement('div'));
    const totalDias = new Date(ano, mes + 1, 0).getDate();
    let primeiroDiaValido = null;
    for (let i = 1; i <= totalDias; i++) {
        const isPast = i < diaHoje;
        const d = document.createElement('div');
        d.className = `calendar-day ${isPast ? 'disabled' : ''}`;
        d.innerText = i < 10 ? '0' + i : i;
        d.dataset.dia = i; d.dataset.mes = mes + 1; d.dataset.ano = ano;
        if (!isPast) {
            if (!primeiroDiaValido) primeiroDiaValido = d;
            d.onclick = () => {
                document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'));
                d.classList.add('active');
                renderTimes();
                document.getElementById('area-confirmar').style.display = 'none';
            };
        }
        cal.appendChild(d);
    }
    if (primeiroDiaValido) { primeiroDiaValido.classList.add('active'); await renderTimes(); }
}

// ================================================
// HORÁRIOS
// ================================================
async function renderTimes() {
    const grid = document.getElementById('timeGrid');
    grid.innerHTML = '<div style="grid-column:span 4;text-align:center;color:#666;padding:16px;font-size:0.8rem;">Verificando horários...</div>';
    const diaEl = document.querySelector('.calendar-day.active');
    if (!diaEl) return;

    const dia = diaEl.dataset.dia.padStart(2, '0');
    const mes = diaEl.dataset.mes.padStart(2, '0');
    const ano = diaEl.dataset.ano;
    const dataInicio = `${ano}-${mes}-${dia}T00:00:00`;
    const dataFim    = `${ano}-${mes}-${dia}T23:59:59`;

    const { data: agendamentos } = await _supabase
        .from('appointments').select('data_hora, barbeiro_nome, status')
        .gte('data_hora', dataInicio).lte('data_hora', dataFim).neq('status', 'cancelado');

    const barbeiro = document.getElementById('selectProf').value;
    const ocupados = new Set();
    (agendamentos || []).forEach(a => {
        const nomeBarbeiro = (a.barbeiro_nome || '').trim().toLowerCase();
        const barbeiroSelecionado = (barbeiro || '').trim().toLowerCase();
        if (nomeBarbeiro === barbeiroSelecionado && ['pendente','confirmado','bloqueado'].includes(a.status)) {
            ocupados.add(a.data_hora.slice(11, 16));
        }
    });

    const agora = new Date();
    const isDiaHoje = parseInt(diaEl.dataset.dia) === agora.getDate() &&
        parseInt(diaEl.dataset.mes) === agora.getMonth() + 1 &&
        parseInt(diaEl.dataset.ano) === agora.getFullYear();
    const horaAgora = agora.getHours() * 60 + agora.getMinutes();

    grid.innerHTML = '';
    HORARIOS.forEach(h => {
        const [hh, mm] = h.split(':').map(Number);
        const minutos = hh * 60 + mm;
        const isPast = isDiaHoje && minutos <= horaAgora;
        const isOcupado = ocupados.has(h);
        const indisponivel = isPast || isOcupado;
        const div = document.createElement('div');
        div.className = `time-slot ${indisponivel ? 'ocupado' : ''}`;
        div.innerText = h;
        if (!indisponivel) {
            div.onclick = () => {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('active'));
                div.classList.add('active');
                document.getElementById('area-confirmar').style.display = 'block';
            };
        }
        grid.appendChild(div);
    });
}

// ================================================
// MEUS AGENDAMENTOS
// ================================================
let filtroAtual = 'atuais';

function abrirMeusAgendamentos() {
    const tela = document.getElementById('telaAgendamentos');
    tela.style.display = 'flex';
    tela.style.flexDirection = 'column';
    filtroAtual = 'atuais';
    document.getElementById('tabAtuais').classList.add('active');
    document.getElementById('tabPassados').classList.remove('active');
    carregarMeusAgendamentos();
}

function fecharMeusAgendamentos() { document.getElementById('telaAgendamentos').style.display = 'none'; }

async function carregarMeusAgendamentos() {
    if (!usuarioLogado) return;
    const lista = document.getElementById('agendamentosLista');
    lista.innerHTML = '<div class="agendamentos-loading">Carregando...</div>';

    const agora = new Date().toISOString();
    let query = _supabase.from('appointments').select('*').eq('cliente_id', usuarioLogado.id).order('data_hora', { ascending: filtroAtual === 'atuais' });
    if (filtroAtual === 'atuais') {
        query = query.gte('data_hora', agora).neq('status', 'cancelado');
    } else {
        query = query.or(`data_hora.lt.${agora},status.eq.cancelado`);
    }

    const { data: agendamentosFinal, error } = await query;

    if (error || !agendamentosFinal?.length) {
        lista.innerHTML = `<div class="agendamentos-vazio"><div class="vazio-icon">📅</div><p>${filtroAtual === 'atuais' ? 'Nenhum agendamento futuro.' : 'Nenhum agendamento passado.'}</p></div>`;
        return;
    }

    lista.innerHTML = '';
    agendamentosFinal.forEach(a => {
        const dataStr2 = a.data_hora.slice(0,16);
        const [datePart, timePart] = dataStr2.split('T');
        const [anoR, mesR, diaR] = datePart.split('-');
        const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const dia = parseInt(diaR), mes = meses[parseInt(mesR)-1], ano = anoR, hora = timePart;
        const statusLabel = { pendente:'Pendente', confirmado:'✓ Confirmado', cancelado:'Cancelado' };
        const statusClass = a.status || 'pendente';
        const podeCancel = filtroAtual === 'atuais' && a.status !== 'cancelado';
        const card = document.createElement('div');
        card.className = 'appt-card';
        card.innerHTML = `
            <div class="appt-card-top">
                <div><div class="appt-card-data">${dia} ${mes} ${ano}</div><div class="appt-card-hora">às ${hora}</div></div>
                <span class="appt-status ${statusClass}">${statusLabel[statusClass] || statusClass}</span>
            </div>
            <div class="appt-card-divider"></div>
            <div class="appt-card-servico">${a.servico_nome}</div>
            <div class="appt-card-info">✂️ ${a.barbeiro_nome}</div>
            ${podeCancel ? `<div class="appt-card-actions"><button class="btn-cancelar-appt" data-id="${a.id}">Cancelar Agendamento</button><span class="appt-card-ver">Toque para detalhes ›</span></div>` : ''}
        `;
        const btnCancel = card.querySelector('.btn-cancelar-appt');
        if (btnCancel) { btnCancel.onclick = (e) => { e.stopPropagation(); cancelarAgendamento(a.id); }; }
        card.onclick = (e) => { if (e.target.classList.contains('btn-cancelar-appt')) return; abrirDetalhe(a); };
        lista.appendChild(card);
    });
}

function abrirDetalhe(a) {
    const [datePart2, timePart2] = a.data_hora.slice(0,16).split('T');
    const [anoD, mesD, diaD] = datePart2.split('-');
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const dataStr = `${parseInt(diaD)} ${meses[parseInt(mesD)-1]} ${anoD}`;
    const hora = timePart2;
    const statusLabel = { pendente:'Pendente ⏳', confirmado:'✓ Confirmado', cancelado:'✕ Cancelado' };
    document.getElementById('modalDetalheContent').innerHTML = `
        <div class="detalhe-header">
            <div><div class="detalhe-data">${dataStr}<br>Às ${hora}</div></div>
            <span class="appt-status ${a.status||'pendente'}">${statusLabel[a.status]||'Pendente'}</span>
        </div>
        <div class="detalhe-row"><span class="detalhe-icon">✂️</span><div><div class="detalhe-row-title">Barbearia BW</div><div class="detalhe-row-sub">Rua José Narciso Silva, 997 — Fábricas</div></div></div>
        <div class="detalhe-row"><span class="detalhe-icon">📋</span><div>
            <div class="detalhe-row-title">${a.servico_nome}</div>
            <div class="detalhe-row-sub">Profissional: ${a.barbeiro_nome}</div>
            ${a.status !== 'cancelado' && a.status !== 'confirmado' ? `<button class="btn-cancelar-detalhe" onclick="cancelarAgendamento('${a.id}')">Cancelar Agendamento</button>` : ''}
        </div></div>
        <div class="historico-item">🕐 Agendado para ${dataStr} às ${hora}</div>
        <button class="btn-confirm" style="margin-top:20px" onclick="fecharDetalhe()">Fechar</button>
    `;
    document.getElementById('modalDetalhe').style.display = 'flex';
}

function fecharDetalhe() { document.getElementById('modalDetalhe').style.display = 'none'; }

async function cancelarAgendamento(id) {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    const { error } = await _supabase.from('appointments').update({ status: 'cancelado' }).eq('id', id).eq('cliente_id', usuarioLogado.id);
    if (error) return alert('Erro ao cancelar: ' + error.message);
    fecharDetalhe();
    carregarMeusAgendamentos();
}

document.addEventListener('DOMContentLoaded', () => {
    // Botão login no header
    document.getElementById('btnHeaderLogin').onclick = () => {
        irParaEtapa('escolha');
        document.getElementById('modalAuth').style.display = 'flex';
    };

    document.getElementById('btnMeusAgendamentos').onclick = abrirMeusAgendamentos;
    document.getElementById('btnFecharAgendamentos').onclick = fecharMeusAgendamentos;
    document.getElementById('btnRefreshAgendamentos').onclick = carregarMeusAgendamentos;
    document.getElementById('modalDetalhe').onclick = (e) => { if (e.target === document.getElementById('modalDetalhe')) fecharDetalhe(); };
    document.getElementById('tabAtuais').onclick = () => { filtroAtual='atuais'; document.getElementById('tabAtuais').classList.add('active'); document.getElementById('tabPassados').classList.remove('active'); carregarMeusAgendamentos(); };
    document.getElementById('tabPassados').onclick = () => { filtroAtual='passados'; document.getElementById('tabPassados').classList.add('active'); document.getElementById('tabAtuais').classList.remove('active'); carregarMeusAgendamentos(); };
});
