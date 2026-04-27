// ATENÇÃO: Substitua pelas suas chaves do EmailJS
const PUBLIC_KEY = "SUA_PUBLIC_KEY";
const SERVICE_ID = "service_jeq2yep";
const TEMPLATE_BARBEIRO = "TEMPLATE_BARBEIRO_ID";

(function() { emailjs.init(PUBLIC_KEY); })();

let currentMonth = 3; // Abril
let currentYear = 2026;

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
        renderTimes();
    };

    document.getElementById('closeModal').onclick = fecharModal;

    // 4. Calendário Dinâmico
    window.renderCalendar = function() {
        const cal = document.getElementById('calendar');
        cal.innerHTML = '';
        const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        document.getElementById('monthDisplay').innerText = `${meses[currentMonth]}, ${currentYear}`;

        const diasSemana = ['dom','seg','ter','qua','qui','sex','sáb'];
        diasSemana.forEach(d => cal.innerHTML += `<div style="font-weight:bold; font-size:0.7rem; color:var(--accent)">${d}</div>`);
        
        for(let i = 1; i <= 30; i++) {
            const isPast = (i < 26 && currentMonth === 3); 
            const dEl = document.createElement('div');
            dEl.className = `calendar-day ${isPast ? 'disabled' : ''}`;
            dEl.innerText = i;
            if(!isPast) {
                dEl.onclick = () => {
                    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'));
                    dEl.classList.add('active');
                    document.getElementById('dateDisplay').innerText = `Para ${i}/${currentMonth+1}/${currentYear}`;
                };
            }
            cal.appendChild(dEl);
        }
    }

    window.changeMonth = function(dir) {
        currentMonth += dir;
        if(currentMonth > 11) { currentMonth = 0; currentYear++; }
        else if(currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
    }

    // 5. Horários (BW Style)
    window.renderTimes = function() {
        const grid = document.getElementById('timeGrid');
        const hBW = ['09:00','09:30','10:00','11:20','13:00','14:30','16:00','17:30','18:20'];
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

    // 6. Enviar Agendamento
    document.getElementById('btnFinalizar').onclick = () => {
        const ativo = document.querySelector('.service-card.active');
        const horaAtiva = document.querySelector('.time-slot.active');
        const diaAtivo = document.querySelector('.calendar-day.active');

        const params = {
            cliente_nome: document.getElementById('userName').value,
            cliente_email: document.getElementById('userEmail').value,
            cliente_fone: document.getElementById('userPhone').value,
            servico: document.getElementById('resumo-servico').innerText,
            data: diaAtivo ? diaAtivo.innerText + "/" + (currentMonth+1) : "",
            horario: horaAtiva ? horaAtiva.innerText : "",
            observacoes: document.getElementById('userObs').value,
            barbeiro: document.getElementById('selectProf').value
        };

        if(!params.cliente_nome || !params.cliente_email || !params.horario) {
            return alert("Verifique se preencheu tudo!");
        }

        emailjs.send(SERVICE_ID, TEMPLATE_BARBEIRO, params)
            .then(() => {
                alert("Pedido enviado! João Vitor analisará e você receberá a confirmação por e-mail.");
                fecharModal();
            })
            .catch(err => alert("Erro ao enviar. Verifique suas chaves do EmailJS."));
    };
});

function fecharModal() { document.getElementById('modal').style.display = 'none'; }
