(function() {
    emailjs.init("g_p4l-PMMcMlwbbQA");
})();

document.addEventListener('DOMContentLoaded', () => {
    // Accordion
    document.querySelectorAll('.category-header').forEach(h => {
        h.onclick = () => h.parentElement.classList.toggle('open');
    });

    // Seleção de Serviço
    document.querySelectorAll('.service-card').forEach(c => {
        c.onclick = () => {
            document.querySelectorAll('.service-card').forEach(el => el.classList.remove('active'));
            c.classList.add('active');
        };
    });

    const modal = document.getElementById('modal');
    document.getElementById('btnAgendar').onclick = () => {
        const ativo = document.querySelector('.service-card.active');
        if(!ativo) return alert("Por favor, selecione um serviço!");
        document.getElementById('resumo-servico').innerText = ativo.querySelector('h3').innerText;
        document.getElementById('resumo-detalhes').innerText = `${ativo.dataset.duration} • R$ ${ativo.dataset.price}`;
        modal.style.display = 'flex';
        renderCalendar();
        renderTimes();
    };

    document.getElementById('closeModal').onclick = () => modal.style.display = 'none';

    function renderCalendar() {
        const cal = document.getElementById('calendar');
        cal.innerHTML = '';
        const diasSemana = ['dom','seg','ter','qua','qui','sex','sáb'];
        diasSemana.forEach(d => cal.innerHTML += `<div style="font-weight:bold; font-size:0.7rem; color:#d4af37; text-align:center;">${d}</div>`);
        
        // Hoje é 26/04/2026
        for(let i=1; i<=30; i++) {
            const isPast = i < 26;
            const d = document.createElement('div');
            d.className = `calendar-day ${isPast ? 'disabled' : ''}`;
            d.innerText = i;
            if(!isPast) {
                d.onclick = () => {
                    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'));
                    d.classList.add('active');
                };
            }
            cal.appendChild(d);
        }
    }

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

    document.getElementById('btnFinalizar').onclick = () => {
        const dia = document.querySelector('.calendar-day.active');
        const hora = document.querySelector('.time-slot.active');
        const barbeiro = document.getElementById('selectProf').value;

        const params = {
            cliente_nome: document.getElementById('userName').value,
            cliente_email: document.getElementById('userEmail').value,
            cliente_fone: document.getElementById('userPhone').value,
            servico: document.getElementById('resumo-servico').innerText,
            barbeiro: barbeiro,
            data: dia ? dia.innerText + "/04/2026" : "",
            horario: hora ? hora.innerText : "",
            observacoes: document.getElementById('userObs').value || "Nenhuma"
        };

        if(!params.cliente_nome || !params.cliente_email || !params.horario) return alert("Preencha todos os campos!");

        emailjs.send("service_jeq2yep", "template_5j3p7le", params)
            .then(() => {
                alert("Pedido enviado! O barbeiro analisará seu horário.");
                modal.style.display = 'none';
            })
            .catch(err => alert("Erro: " + err.text));
    };
});
