(function() {
    emailjs.init("g_p4I-PMMcMIwbbQA");
})();

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

    const modal = document.getElementById('modal');

    document.getElementById('btnAgendar').onclick = () => {
        const ativo = document.querySelector('.service-card.active');
        if (!ativo) return alert("Selecione um serviço primeiro!");

        document.getElementById('resumo-servico').innerText = ativo.querySelector('h3').innerText;
        document.getElementById('resumo-detalhes').innerText = `${ativo.dataset.duration} • R$ ${ativo.dataset.price}`;

        modal.style.display = 'flex';
        renderCalendar();
        // FIX #5: limpa os horários ao abrir o modal (serão renderizados ao clicar no dia)
        document.getElementById('timeGrid').innerHTML = '';
        document.getElementById('area-cliente').style.display = 'none';
    };

    document.getElementById('closeModal').onclick = () => modal.style.display = 'none';

    // 3. Calendário — FIX #1 e #2: dinâmico, baseado na data atual
    function renderCalendar() {
        const cal = document.getElementById('calendar');
        cal.innerHTML = '';

        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = hoje.getMonth(); // 0-indexado
        const diaHoje = hoje.getDate();

        // FIX #6: atualiza o label do mês dinamicamente
        const nomesMes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        document.getElementById('monthLabel').innerText = `${nomesMes[mes]}, ${ano}`;

        const diasSemana = ['D','S','T','Q','Q','S','S'];
        diasSemana.forEach(d => {
            const el = document.createElement('div');
            el.style.cssText = 'font-weight:bold; font-size:0.7rem; color:#666; padding-bottom:10px;';
            el.innerText = d;
            cal.appendChild(el);
        });

        // Calcula o dia da semana do primeiro dia do mês atual
        const primeiroDia = new Date(ano, mes, 1).getDay();
        for (let s = 0; s < primeiroDia; s++) {
            cal.appendChild(document.createElement('div'));
        }

        // Total de dias no mês
        const totalDias = new Date(ano, mes + 1, 0).getDate();

        let primeiroDiaValido = null;

        for (let i = 1; i <= totalDias; i++) {
            const isPast = i < diaHoje;
            const d = document.createElement('div');
            d.className = `calendar-day ${isPast ? 'disabled' : ''}`;
            d.innerText = i < 10 ? '0' + i : i;
            d.dataset.dia = i;
            d.dataset.mes = mes + 1; // 1-indexado para exibição
            d.dataset.ano = ano;

            if (!isPast) {
                if (!primeiroDiaValido) primeiroDiaValido = d;
                d.onclick = () => {
                    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'));
                    d.classList.add('active');
                    // FIX #5: rerenderiza horários ao trocar de dia
                    renderTimes();
                    document.getElementById('area-cliente').style.display = 'none';
                };
            }
            cal.appendChild(d);
        }

        // Seleciona o primeiro dia disponível por padrão
        if (primeiroDiaValido) {
            primeiroDiaValido.classList.add('active');
            renderTimes();
        }
    }

    // 4. Horários — FIX #5: chamado ao clicar em cada dia
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

    // 5. Envio — FIX #3: validação inclui dia; data formatada dinamicamente
    document.getElementById('btnFinalizar').onclick = () => {
        const diaEl = document.querySelector('.calendar-day.active');
        const hora = document.querySelector('.time-slot.active');

        // FIX #3: data incluída na validação
        if (!diaEl) return alert("Selecione um dia no calendário!");
        if (!hora) return alert("Selecione um horário!");

        const dia = diaEl.dataset.dia.padStart(2, '0');
        const mes = diaEl.dataset.mes.padStart(2, '0');
        const ano = diaEl.dataset.ano;
        const dataFormatada = `${dia}/${mes}/${ano}`;

        const params = {
            cliente_nome: document.getElementById('userName').value,
            cliente_email: document.getElementById('userEmail').value,
            cliente_fone: document.getElementById('userPhone').value,
            servico: document.getElementById('resumo-servico').innerText,
            barbeiro: document.getElementById('selectProf').value,
            data: dataFormatada,
            horario: hora.innerText,
            observacoes: document.getElementById('userObs').value || "Nenhuma"
        };

        if (!params.cliente_nome || !params.cliente_email || !params.cliente_fone) {
            return alert("Preencha nome, e-mail e WhatsApp antes de confirmar!");
        }

        emailjs.send("service_jeq2yep", "template_5j3p7ie", params)
            .then(() => {
                alert("✅ Sucesso! Agendamento enviado para o João Vitor.");
                modal.style.display = 'none';
            })
            .catch(err => alert("Erro ao enviar: " + (err.text || err)));
    };
});
