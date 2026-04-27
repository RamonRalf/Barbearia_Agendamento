// ================================================
// BARBEARIA BW — script.js
// Supabase Auth + Agendamento
// ================================================

const SUPABASE_URL = "https://durmzijnybyakrudukvz.supabase.co";
const SUPABASE_KEY = "sb_publishable_aOq2nOXVTWWGGRDxLxkJzw_quoaVYVv";
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

    // Verifica sessão ativa
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        usuarioLogado = session.user;
        await atualizarBarraUsuario();
    }

    // Escuta mudanças de auth
    _supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            usuarioLogado = session.user;
            await atualizarBarraUsuario();
        } else {
            usuarioLogado = null;
            document.getElementById('userBar').style.display = 'none';
        }
    });

    await carregarServicos();
    iniciarEventosAuth();
    iniciarEventosAgendamento();
});

// ================================================
// BARRA DO USUÁRIO LOGADO
// ================================================
async function atualizarBarraUsuario() {
    const { data: profile } = await _supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', usuarioLogado.id)
        .single();

    const nome = profile?.nome_completo || usuarioLogado.email;
    const inicial = nome.charAt(0).toUpperCase();

    document.getElementById('userBarName').innerText = nome.split(' ')[0];
    document.getElementById('userBarAvatar').innerText = inicial;
    document.getElementById('userBar').style.display = 'flex';
}

// ================================================
// CARREGAR SERVIÇOS DO SUPABASE
// ================================================
async function carregarServicos() {
    const listaEl = document.getElementById('lista-servicos');
    listaEl.innerHTML = '<p style="text-align:center;color:#666;padding:40px">Carregando serviços...</p>';

    const { data: servicos, error } = await _supabase
        .from('services')
        .select('*')
        .order('id');

    if (error) {
        listaEl.innerHTML = '<p style="text-align:center;color:#e74c3c;padding:40px">Erro ao carregar serviços.</p>';
        return;
    }

    const servicoMap = {};
    servicos.forEach(s => servicoMap[s.nome] = s);

    let html = '';
    Object.entries(CATEGORIAS).forEach(([categoria, nomes]) => {
        const lista = nomes.filter(n => servicoMap[n]).map(n => servicoMap[n]);
        if (!lista.length) return;

        const cards = lista.map(s => {
            const preco = parseFloat(s.preco).toFixed(2).replace('.', ',');
            return `
                <div class="service-card" data-duration="${s.duracao}" data-price="${preco}" data-nome="${s.nome}">
                    <div class="service-info">
                        <h3>${s.nome}</h3>
                        <p>${DESCRICOES[s.nome] || ''}</p>
                    </div>
                    <div class="price">R$ ${preco}</div>
                </div>`;
        }).join('');

        html += `
            <div class="category-item">
                <div class="category-header"><span>${categoria}</span><span class="arrow">▼</span></div>
                <div class="category-content"><div class="services-grid">${cards}</div></div>
            </div>`;
    });

    html += `<div class="footer-action"><button class="btn-confirm" id="btnAgendar">Agendar Agora</button></div>`;
    listaEl.innerHTML = html;

    // Accordion
    document.querySelectorAll('.category-header').forEach(h => {
        h.onclick = () => h.parentElement.classList.toggle('open');
    });

    // Seleção de serviço
    document.querySelectorAll('.service-card').forEach(c => {
        c.onclick = () => {
            document.querySelectorAll('.service-card').forEach(el => el.classList.remove('active'));
            c.classList.add('active');
            servicoSelecionado = c;
        };
    });

    // Botão agendar — verifica login antes
    document.getElementById('btnAgendar').onclick = () => {
        if (!servicoSelecionado) return alert("Selecione um serviço primeiro!");
        if (!usuarioLogado) {
            // Abre modal de auth
            abrirModalAuth();
        } else {
            abrirModalAgendamento();
        }
    };

    // Logout
    document.getElementById('btnLogout').onclick = async () => {
        await _supabase.auth.signOut();
        alert("Você saiu da sua conta.");
    };
}

// ================================================
// MODAL AUTH — EVENTOS
// ================================================
function iniciarEventosAuth() {
    const modalAuth = document.getElementById('modalAuth');

    // Fechar
    ['closeModalAuth','closeModalAuth2','closeModalAuth3'].forEach(id => {
        document.getElementById(id).onclick = () => fecharModalAuth();
    });

    modalAuth.onclick = (e) => { if (e.target === modalAuth) fecharModalAuth(); };

    // Navegar entre etapas
    document.getElementById('btnIrLogin').onclick    = () => irParaEtapa('login');
    document.getElementById('btnIrCadastro').onclick = () => irParaEtapa('cadastro');
    document.getElementById('btnVoltarLogin').onclick    = () => irParaEtapa('escolha');
    document.getElementById('btnVoltarCadastro').onclick = () => irParaEtapa('escolha');
    document.getElementById('btnIrCadastro2').onclick = () => irParaEtapa('cadastro');
    document.getElementById('btnIrLogin2').onclick    = () => irParaEtapa('login');

    // Login
    document.getElementById('btnLogin').onclick = async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const senha = document.getElementById('loginSenha').value;
        const erroEl = document.getElementById('loginErro');
        const btn = document.getElementById('btnLogin');

        if (!email || !senha) return mostrarErro(erroEl, 'Preencha e-mail e senha.');

        btn.disabled = true;
        btn.innerText = 'Entrando...';

        const { data: loginData, error } = await _supabase.auth.signInWithPassword({ email, password: senha });

        btn.disabled = false;
        btn.innerText = 'Entrar';

        if (error) {
            mostrarErro(erroEl, 'E-mail ou senha incorretos.');
        } else {
            // Garante que o perfil existe no banco
            if (loginData.user) {
                await _supabase.from('profiles').upsert({
                    id: loginData.user.id,
                    tipo_usuario: 'cliente'
                }, { onConflict: 'id', ignoreDuplicates: true });
            }
            fecharModalAuth();
            setTimeout(() => abrirModalAgendamento(), 300);
        }
    };

    // Cadastro
    document.getElementById('btnCadastrar').onclick = async () => {
        const nome     = document.getElementById('cadNome').value.trim();
        const email    = document.getElementById('cadEmail').value.trim();
        const telefone = document.getElementById('cadTelefone').value.trim();
        const senha    = document.getElementById('cadSenha').value;
        const erroEl   = document.getElementById('cadErro');
        const btn      = document.getElementById('btnCadastrar');

        if (!nome || !email || !telefone || !senha) return mostrarErro(erroEl, 'Preencha todos os campos.');
        if (senha.length < 6) return mostrarErro(erroEl, 'Senha deve ter no mínimo 6 caracteres.');

        btn.disabled = true;
        btn.innerText = 'Criando conta...';

        const { data, error } = await _supabase.auth.signUp({ email, password: senha });

        if (error) {
            btn.disabled = false;
            btn.innerText = 'Criar Conta';
            return mostrarErro(erroEl, 'Erro ao criar conta: ' + error.message);
        }

        // Salva perfil na tabela profiles
        if (data.user) {
            await _supabase.from('profiles').upsert({
                id: data.user.id,
                nome_completo: nome,
                telefone: telefone,
                tipo_usuario: 'cliente'
            });
        }

        btn.disabled = false;
        btn.innerText = 'Criar Conta';
        fecharModalAuth();
        setTimeout(() => abrirModalAgendamento(), 300);
    };
}

function abrirModalAuth() {
    irParaEtapa('escolha');
    document.getElementById('modalAuth').style.display = 'flex';
}

function fecharModalAuth() {
    document.getElementById('modalAuth').style.display = 'none';
}

function irParaEtapa(etapa) {
    document.getElementById('authEtapa1').style.display       = etapa === 'escolha'  ? 'block' : 'none';
    document.getElementById('authEtapaLogin').style.display   = etapa === 'login'    ? 'block' : 'none';
    document.getElementById('authEtapaCadastro').style.display = etapa === 'cadastro' ? 'block' : 'none';
    // Limpa erros
    ['loginErro','cadErro'].forEach(id => {
        const el = document.getElementById(id);
        el.style.display = 'none';
        el.innerText = '';
    });
}

function mostrarErro(el, msg) {
    el.innerText = msg;
    el.style.display = 'block';
}

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
        btn.disabled = true;
        btn.innerText = 'Salvando...';

        const dia = diaEl.dataset.dia.padStart(2, '0');
        const mes = diaEl.dataset.mes.padStart(2, '0');
        const dataISO = `${diaEl.dataset.ano}-${mes}-${dia}T${horaEl.innerText}:00`;

        // Garante que o perfil existe antes de inserir o agendamento
        await _supabase.from('profiles').upsert({
            id: usuarioLogado.id,
            tipo_usuario: 'cliente'
        }, { onConflict: 'id', ignoreDuplicates: true });

        const { error } = await _supabase.from('appointments').insert([{
            cliente_id:    usuarioLogado.id,
            barbeiro_nome: document.getElementById('selectProf').value,
            servico_nome:  document.getElementById('resumo-servico').innerText,
            data_hora:     dataISO,
            status:        'pendente'
        }]);

        btn.disabled = false;
        btn.innerText = 'Confirmar Agendamento';

        if (error) {
            console.error(error);
            return alert("Erro ao salvar: " + error.message);
        }

        alert("✅ Agendamento realizado! Em breve o barbeiro confirmará.");
        modal.style.display = 'none';
    };
}

function abrirModalAgendamento() {
    document.getElementById('resumo-servico').innerText = servicoSelecionado.querySelector('h3').innerText;
    document.getElementById('resumo-detalhes').innerText = `${servicoSelecionado.dataset.duration} • R$ ${servicoSelecionado.dataset.price}`;
    document.getElementById('timeGrid').innerHTML = '';
    document.getElementById('area-confirmar').style.display = 'none';
    document.getElementById('modal').style.display = 'flex';
    renderCalendar();
}

// ================================================
// CARROSSEL DE BARBEIROS
// ================================================
window.selectBarber = function(el) {
    document.querySelectorAll('.barber-card').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('selectProf').value = el.dataset.barber;
};

// ================================================
// CALENDÁRIO
// ================================================
function renderCalendar() {
    const cal = document.getElementById('calendar');
    cal.innerHTML = '';
    const hoje = new Date();
    const ano  = hoje.getFullYear();
    const mes  = hoje.getMonth();
    const diaHoje = hoje.getDate();

    const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    document.getElementById('monthLabel').innerText = `${nomesMes[mes]}, ${ano}`;

    ['D','S','T','Q','Q','S','S'].forEach(d => {
        const el = document.createElement('div');
        el.style.cssText = 'font-weight:600;font-size:0.62rem;color:#444;padding-bottom:10px;text-align:center;letter-spacing:1px;';
        el.innerText = d;
        cal.appendChild(el);
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
        d.dataset.dia = i;
        d.dataset.mes = mes + 1;
        d.dataset.ano = ano;

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

    if (primeiroDiaValido) {
        primeiroDiaValido.classList.add('active');
        renderTimes();
    }
}

// ================================================
// HORÁRIOS
// ================================================
function renderTimes() {
    const grid = document.getElementById('timeGrid');
    grid.innerHTML = '';
    HORARIOS.forEach(h => {
        const div = document.createElement('div');
        div.className = 'time-slot';
        div.innerText = h;
        div.onclick = () => {
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('active'));
            div.classList.add('active');
            document.getElementById('area-confirmar').style.display = 'block';
        };
        grid.appendChild(div);
    });
}
