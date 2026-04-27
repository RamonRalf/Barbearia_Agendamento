// ================================================
// BARBEARIA BW — script.js
// Integração com Supabase
// ================================================

const SUPABASE_URL = "https://durmzijnybyakrudukvz.supabase.co";
const SUPABASE_KEY = "sb_publishable_aOq2nOXVTWWGGRDxLxkJzw_quoaVYVv";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Categorias para agrupar os serviços do banco
const CATEGORIAS = {
    "Combos":              ["Corte Barba Sobrancelha"],
    "Corte":               ["Corte Degradê","Corte Social","Corte Infantil","Corte Todo na Tesoura","Corte 1 Máquina","Navalhar","Pezinho"],
    "Barba":               ["Barba Completa (Toalha Quente)","Design de Barba Navalha","Barba na Máquina","Afinar Bigode"],
    "Química Cabelo":      ["Luzes e Corte","Nevou","Colorimetria"],
    "Serviços Adicionais": ["Limpeza de Pele","Pigmentação","Limpeza Auricular/Nasal","Design Sobrancelha Navalha"]
};

const DESCRICOES = {
    "Corte Barba Sobrancelha":       "O pacote completo",
    "Corte Degradê":                 "Moderno e navalhado",
    "Corte Social":                  "Clássico e alinhado",
    "Corte Infantil":                "Cuidado especial",
    "Corte Todo na Tesoura":         "Artesanal",
    "Corte 1 Máquina":               "Praticidade",
    "Navalhar":                      "Acabamento na navalha",
    "Pezinho":                       "Apenas o contorno",
    "Barba Completa (Toalha Quente)":"Barboterapia",
    "Design de Barba Navalha":       "Alinhamento",
    "Barba na Máquina":              "Aparo rápido",
    "Afinar Bigode":                 "Ajuste fino",
    "Luzes e Corte":                 "Aprox. 3 horas",
    "Nevou":                         "Descoloração Global",
    "Colorimetria":                  "Aplicação de cor",
    "Limpeza de Pele":               "Remoção impurezas",
    "Pigmentação":                   "Cobertura de falhas",
    "Limpeza Auricular/Nasal":       "Remoção pelos",
    "Design Sobrancelha Navalha":    "Na navalha"
};

const HORARIOS = ['09:00','09:30','10:00','10:30','11:00','11:20','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:20'];

// ================================================
// 1. CARREGAR SERVIÇOS DO SUPABASE
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
        console.error(error);
        return;
    }

    // Mapeia serviços por nome para acesso rápido
    const servicoMap = {};
    servicos.forEach(s => servicoMap[s.nome] = s);

    // Monta o HTML das categorias
    let html = '';
    Object.entries(CATEGORIAS).forEach(([categoria, nomes]) => {
        const servicosDaCategoria = nomes
            .filter(n => servicoMap[n])
            .map(n => servicoMap[n]);

        if (servicosDaCategoria.length === 0) return;

        const cards = servicosDaCategoria.map(s => {
            const preco = parseFloat(s.preco).toFixed(2).replace('.', ',');
            const descricao = DESCRICOES[s.nome] || '';
            return `
                <div class="service-card" data-duration="${s.duracao}" data-price="${preco}" data-nome="${s.nome}">
                    <div class="service-info">
                        <h3>${s.nome}</h3>
                        <p>${descricao}</p>
                    </div>
                    <div class="price">R$ ${preco}</div>
                </div>`;
        }).join('');

        html += `
            <div class="category-item">
                <div class="category-header"><span>${categoria}</span><span class="arrow">▼</span></div>
                <div class="category-content">
                    <div class="services-grid">${cards}</div>
                </div>
            </div>`;
    });

    // Botão agendar
    html += `
        <div class="footer-action">
            <button class="btn-confirm" id="btnAgendar">Agendar Agora</button>
        </div>`;

    listaEl.innerHTML = html;

    // Reanexa eventos depois de montar o HTML
    iniciarEventos();
}

// ================================================
// 2. EVENTOS DE INTERFACE
// ================================================
function iniciarEventos() {

    // Accordion
    document.querySelectorAll('.category-header').forEach(h => {
        h.onclick = () => h.parentElement.classList.toggle('open');
    });

    // Seleção de serviço
    document.querySelectorAll('.service-card').forEach(c => {
        c.onclick = () => {
            document.querySelectorAll('.service-card').forEach(el => el.classList.remove('active'));
            c.classList.add('active');
        };
    });

    // Botão agendar
    const modal = document.getElementById('modal');
    document.getElementById('btnAgendar').onclick = () => {
        const ativo = document.querySelector('.service-card.active');
        if (!ativo) return alert("Selecione um serviço primeiro!");

        document.getElementById('resumo-servico').innerText = ativo.querySelector('h3').innerText;
        document.getElementById('resumo-detalhes').innerText = `${ativo.dataset.duration} • R$ ${ativo.dataset.price}`;

        modal.style.display = 'flex';
        renderCalendar();
        document.getElementById('timeGrid').innerHTML = '';
        document.getElementById('area-cliente').style.display = 'none';
    };

    document.getElementById('closeModal').onclick = () => modal.style.display = 'none';
}

// ================================================
// 3. SELETOR DE BARBEIRO (CARROSSEL)
// ================================================
window.selectBarber = function(el) {
    document.querySelectorAll('.barber-card').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('selectProf').value = el.dataset.barber;
};

// ================================================
// 4. CALENDÁRIO DINÂMICO
// ================================================
function renderCalendar() {
    const cal = document.getElementById('calendar');
    cal.innerHTML = '';
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const diaHoje = hoje.getDate();

    const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    document.getElementById('monthLabel').innerText = `${nomesMes[mes]}, ${ano}`;

    const diasSemana = ['D','S','T','Q','Q','S','S'];
    diasSemana.forEach(d => {
        const el = document.createElement('div');
        el.style.cssText = 'font-weight:600; font-size:0.62rem; color:#444; padding-bottom:10px; text-align:center; letter-spacing:1px;';
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
                document.getElementById('area-cliente').style.display = 'none';
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
// 5. HORÁRIOS
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
            document.getElementById('area-cliente').style.display = 'block';
        };
        grid.appendChild(div);
    });
}

// ================================================
// 6. CONFIRMAR AGENDAMENTO → SUPABASE
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    // Carrega os serviços ao iniciar
    carregarServicos();

    document.getElementById('btnFinalizar').onclick = async () => {
        const diaEl = document.querySelector('.calendar-day.active');
        const horaEl = document.querySelector('.time-slot.active');

        if (!diaEl) return alert("Selecione um dia no calendário!");
        if (!horaEl) return alert("Selecione um horário!");

        const nome  = document.getElementById('userName').value.trim();
        const email = document.getElementById('userEmail').value.trim();
        const fone  = document.getElementById('userPhone').value.trim();

        if (!nome || !email || !fone) return alert("Preencha nome, e-mail e WhatsApp!");

        const dia = diaEl.dataset.dia.padStart(2, '0');
        const mes = diaEl.dataset.mes.padStart(2, '0');
        const ano = diaEl.dataset.ano;
        const dataISO = `${ano}-${mes}-${dia}T${horaEl.innerText}:00`;

        const btn = document.getElementById('btnFinalizar');
        btn.disabled = true;
        btn.innerText = "Salvando...";

        const novoAgendamento = {
            barbeiro_nome: document.getElementById('selectProf').value,
            servico_nome:  document.getElementById('resumo-servico').innerText,
            data_hora:     dataISO,
            status:        'pendente'
        };

        const { error } = await _supabase
            .from('appointments')
            .insert([novoAgendamento]);

        btn.disabled = false;
        btn.innerText = "Confirmar Agendamento";

        if (error) {
            console.error("Erro Supabase:", error);
            return alert("Erro ao salvar agendamento: " + error.message);
        }

        alert("✅ Agendamento enviado! Em breve o barbeiro confirmará.");
        document.getElementById('modal').style.display = 'none';
    };
});
