(function() {
    // Inicialização com a tua Chave Pública real
    emailjs.init("g_p4l-PMMcMlwbbQA"); 
})();

document.addEventListener('DOMContentLoaded', () => {
    // 1. Accordion das Categorias
    document.querySelectorAll('.category-header').forEach(header => {
        header.onclick = () => header.parentElement.classList.toggle('open');
    });

    // 2. Seleção de Serviço
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            serviceCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });

    // 3. Controlo do Modal
    const modal = document.getElementById('modal');
    const btnAgendar = document.getElementById('btnAgendar');
    const btnClose = document.getElementById('closeModal');

    btnAgendar.onclick = () => {
        const ativo = document.querySelector('.service-card.active');
        if (!ativo) return alert("Por favor, selecione um serviço primeiro!");
        
        document.getElementById('resumo-servico').innerText = ativo.querySelector('h3').innerText;
        document.getElementById('resumo-detalhes').innerText = `${ativo.dataset.duration} • R$ ${ativo.dataset.price}`;
        
        modal.style.display = 'flex';
        renderCalendar();
        renderTimes();
    };

    btnClose.onclick = () => modal.style.display = 'none';

    // 4. Lógica do Calendário (Abril 2026)
    function renderCalendar() {
        const cal = document.getElementById('calendar');
        cal.innerHTML = '';
        const diasSemana = ['dom','seg','ter','qua','qui','sex','sáb'];
        diasSemana.forEach(d => cal.innerHTML += `<div style="font-weight:bold; font-size:0.7rem; color:#d4af37; text-align:center;">${d}</div>`);
        
        for(let i = 1; i <= 30; i++) {
            const isPast = i < 26; 
            const dEl = document.createElement('div');
            dEl.className = `calendar-day ${isPast ? 'disabled' : ''}`;
            dEl.innerText = i;
            if(!isPast) {
                dEl.onclick = () => {
                    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'));
                    dEl.classList.add('active');
                };
            }
            cal.appendChild(dEl);
        }
    }

    // 5. Horários Reais
    function renderTimes() {
        const grid = document.getElementById('timeGrid');
        const horarios = ['09:00','09:30','10:00','10:30','11:00','11:20','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:20'];
        grid.innerHTML = '';
        horarios.forEach(h => {
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

    // 6. Envio do Agendamento
    document.getElementById('btnFinalizar').onclick = () => {
        const diaAtivo = document.querySelector('.calendar-day.active');
        const horaAtiva = document.querySelector('.time-slot.active');

        const params = {
            cliente_nome: document.getElementById('userName').value,
            cliente_email: document.getElementById('userEmail').value,
            cliente_fone: document.getElementById('userPhone').value,
            servico: document.getElementById('resumo-servico').innerText,
            data: diaAtivo ? diaAtivo.innerText + "/04/2026" : "",
            horario: horaAtiva ? horaAtiva.innerText : "",
            observacoes: document.getElementById('userObs').value || "Nenhuma"
        };

        if(!params.cliente_nome || !params.cliente_email || !params.horario) {
            return alert("Preencha todos os campos e escolha o horário!");
        }

        // NOTA: Substitui "ID_DO_TEU_TEMPLATE_BARBEIRO" pelo ID que aparece no teu EmailJS
        emailjs.send("service_jeq2yep", "ID_DO_TEU_TEMPLATE_BARBEIRO", params)
            .then(() => {
                alert("Pedido enviado! O João Vitor recebeu a solicitação.");
                modal.style.display = 'none';
            })
            .catch(err => alert("Erro ao enviar: " + JSON.stringify(err)));
    };
});
