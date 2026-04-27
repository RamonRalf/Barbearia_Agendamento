// Variáveis de controle de data
let dataHoje = new Date(); // domingo, 26 de Abril de 2026
let mesVisualizado = new Date(2026, 3, 1); // Começa em Abril (mês 3 no JS)

document.addEventListener('DOMContentLoaded', () => {
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

    // 3. Abrir Modal
    const modal = document.getElementById('modal');
    document.getElementById('btnAgendar').onclick = () => {
        const ativo = document.querySelector('.service-card.active');
        if(!ativo) return alert("Selecione um serviço primeiro!");
        
        document.getElementById('resumo-servico').innerText = ativo.querySelector('h3').innerText;
        document.getElementById('resumo-detalhes').innerText = `${ativo.dataset.duration} • R$ ${ativo.dataset.price}`;
        modal.style.display = 'flex';
        renderCalendar();
    };
});

// 4. Função para Mudar o Mês
function changeMonth(diff) {
    mesVisualizado.setMonth(mesVisualizado.getMonth() + diff);
    renderCalendar();
}

// 5. Renderizar Calendário Dinâmico Completo
function renderCalendar() {
    const cal = document.getElementById('calendar');
    const monthDisplay = document.getElementById('monthDisplay');
    cal.innerHTML = '';

    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const ano = mesVisualizado.getFullYear();
    const mes = mesVisualizado.getMonth();
    
    monthDisplay.innerText = `${nomesMeses[mes]}, ${ano}`;

    // Cabeçalho dos dias
    ['dom','seg','ter','qua','qui','sex','sáb'].forEach(d => {
        cal.innerHTML += `<div style="font-weight:bold; font-size:0.7rem; color:var(--accent); text-align:center;">${d}</div>`;
    });

    // O PULO DO GATO ESTÁ AQUI: Cálculo dinâmico de Abril 2026
    // new Date(2026, 3, 1).getDay() --> Retorna 3 (Quarta-feira)
    const espacosVazios = new Date(ano, mes, 1).getDay();
    
    // new Date(2026, 3 + 1, 0).getDate() --> Retorna 30 (total de dias de Abril)
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

    // Espaços vazios no início
    for (let j = 0; j < espacosVazios; j++) {
        cal.innerHTML += `<div></div>`;
    }

    // Gerar os dias (AQUI O LOOP PERCORRE TODOS OS 30 DIAS)
    for(let i = 1; i <= totalDiasMes; i++) {
        const d = document.createElement('div');
        d.innerText = i;
        
        // Zera as horas para comparar apenas as datas
        const hojeApenasData = new Date(dataHoje.getFullYear(), dataHoje.getMonth(), dataHoje.getDate());
        const dataItemApenasData = new Date(ano, mes, i);

        if (dataItemApenasData < hojeApenasData) {
            d.className = 'calendar-day past'; // Risca e desativa datas passadas
        } else {
            d.className = 'calendar-day';
            if (dataItemApenasData.getTime() === hojeApenasData.getTime()) {
                d.classList.add('active'); // Destaca o dia de hoje
                updateDateDisplay(i, mes, ano);
            }
            
            d.onclick = () => {
                document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'));
                d.classList.add('active');
                updateDateDisplay(i, mes, ano);
                renderTimes(); // Mostra horários ao clicar na data
            };
        }
        cal.appendChild(d);
    }
}

function updateDateDisplay(dia, mes, ano) {
    const nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const nomesMesesRed = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const dataObj = new Date(ano, mes, dia);
    const nomeDia = nomesDias[dataObj.getDay()];
    document.getElementById('dateDisplay').innerText = `Para ${nomeDia}, ${dia}/${nomesMesesRed[mes]}/${ano}`;
}

// 6. Horários BW
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
            document.getElementById('btnFinalizar').classList.add('ready');
        };
        grid.appendChild(div);
    });
}

function fecharModal() { 
    document.getElementById('modal').style.display = 'none'; 
}