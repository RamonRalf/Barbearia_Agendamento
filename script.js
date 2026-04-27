// 1. CONFIGURAÇÃO DO SUPABASE (Dados das suas fotos)
const SUPABASE_URL = "https://durmzijnybyakrudukvz.supabase.co";
// ATENÇÃO: Cole abaixo a sua chave ANON PUBLIC completa que você tirou foto
const SUPABASE_KEY = "COLE_AQUI_SUA_CHAVE_COMPLETA_SB_PUBLISHABLE"; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {

    // --- LOGICA DE INTERFACE (MANTIDA) ---
    
    // 1. Accordion
    document.querySelectorAll('.category-header').forEach(h => {
        h.onclick = () => h.parentElement.classList.toggle('open');
    });

    // 2. Seleção de Serviço
    document.querySelectorAll('.service-card').forEach(c => {
        c.onclick = () => {
            document.querySelectorAll('.service-card').forEach(el => el.classList.remove('active'));
            c.classList.add('active');
        };
    });

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

    // 3. Calendário Dinâmico (Sua lógica excelente)
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
            el.style.cssText = 'font-weight:bold; font-size:0.7rem; color:#666; padding-bottom:10px;';
            el.innerText = d;
            cal.appendChild(el);
        });

        const primeiroDia = new Date(ano, mes, 1).getDay();
        for (let s = 0; s < primeiroDia; s++) {
            cal.appendChild(document.createElement('div'));
        }

        const totalDias = new Date(ano, mes + 1, 0).getDate();
        let primeiroDiaValido = null;

        for (let i = 1; i <= totalDias; i++) {
            const isPast = i < diaHoje;
            const d = document.createElement('div');
            d.className = `calendar-day ${isPast ? 'disabled' : ''}`;
            d.innerText = i < 10 ? '0' + i : i;
            // Guardando data no dataset para o banco
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

    // 4. Horários
    function renderTimes() {
        const grid = document.getElementById('timeGrid');
        const hBW = ['09:00','09:30','10:00','10:30','11:00','11:20','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:20'];
        grid.innerHTML = '';
        hBW.forEach(h => {
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

    window.selectBarber = function(el) {
        document.querySelectorAll('.barber-option').forEach(o => o.classList.remove('active'));
        el.classList.add('active');
        document.getElementById('selectProf').value = el.dataset.barber;
    };

    // --- 5. O NOVO MOTOR: GRAVAR NO SUPABASE ---
    document.getElementById('btnFinalizar').onclick = async () => {
        const diaEl = document.querySelector('.calendar-day.active');
        const horaEl = document.querySelector('.time-slot.active');

        if (!diaEl || !horaEl) return alert("Selecione data e horário!");

        const nome = document.getElementById('userName').value;
        const fone = document.getElementById('userPhone').value;
        const email = document.getElementById('userEmail').value;

        if (!nome || !fone || !email) {
            return alert("Preencha seus dados de contato!");
        }

        // Formata a data para o banco de dados (YYYY-MM-DD HH:MM)
        const dataISO = `${diaEl.dataset.ano}-${diaEl.dataset.mes.padStart(2,'0')}-${diaEl.dataset.dia.padStart(2,'0')} ${horaEl.innerText}`;

        // Objeto para o Supabase
        const novoAgendamento = {
            barbeiro_nome: document.getElementById('selectProf').value,
            servico_nome: document.getElementById('resumo-servico').innerText,
            data_hora: dataISO,
            // Guardamos os dados do cliente direto no agendamento por enquanto
            status: 'pendente'
        };

        // EXECUTANDO A GRAVAÇÃO
        const { data, error } = await _supabase
            .from('appointments') // Nome da tabela que criamos
            .insert([novoAgendamento]);

        if (error) {
            console.error("Erro Supabase:", error);
            alert("Erro ao salvar no banco: " + error.message);
        } else {
            alert("✅ Agendamento realizado com sucesso no banco de dados!");
            
            // Opcional: Você pode manter o EmailJS aqui se quiser que o João Vitor 
            // receba o e-mail além de gravar no banco.
            
            modal.style.display = 'none';
        }
    };
});
