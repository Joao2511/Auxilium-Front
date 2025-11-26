import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";

const agendaController = {
  eventosPorDia: {},
  stats: { pendente: 0, atrasada: 0, concluida: 0 },

  async index() {
    const app = document.getElementById("app");
    const res = await fetch("pages/agenda.html");
    app.innerHTML = await res.text();

    this.selectedDate = new Date();
    this.currentMonth = this.selectedDate.getMonth();
    this.currentYear = this.selectedDate.getFullYear();

    await this.carregarEventosDoAluno();

    this.renderCalendar();
    this.loadEventsForDate(this.selectedDate);
    this.updateEventStats();

    document.getElementById("prev-month").addEventListener("click", () => {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      this.renderCalendar();
    });

    document.getElementById("next-month").addEventListener("click", () => {
      this.currentMonth++;
      if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
      this.renderCalendar();
    });
  },

  async carregarEventosDoAluno() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // disciplinas do aluno
    const { data: relacoes } = await supabase
      .from("usuario_disciplina")
      .select("id_disciplina")
      .eq("id_usuario", user.id);

    if (!relacoes || relacoes.length === 0) return;

    const disciplinas = relacoes.map((r) => r.id_disciplina);

    // tarefas dessas disciplinas
    const { data: tarefas } = await supabase
      .from("tarefa")
      .select("id_tarefa, titulo, data_entrega, id_disciplina")
      .in("id_disciplina", disciplinas);

    // entregas do aluno
    const { data: entregas } = await supabase
      .from("entrega_tarefa")
      .select("id_tarefa, status, data_submissao")
      .eq("id_aluno", user.id);

    const entregasMap = {};
    entregas?.forEach((e) => {
      entregasMap[e.id_tarefa] = e;
    });

    this.eventosPorDia = {};
    this.stats = { pendente: 0, atrasada: 0, concluida: 0 };

    const hoje = new Date();

    tarefas.forEach((t) => {
      const data = t.data_entrega.split("T")[0];
      const entrega = entregasMap[t.id_tarefa];

      let status = "pendente";

      if (entrega) {
        if (entrega.status === "AVALIADA" || entrega.status === "ENVIADA") {
          status = "concluida";
        }
      } else if (new Date(t.data_entrega) < hoje) {
        status = "atrasada";
      }

      if (!this.eventosPorDia[data]) this.eventosPorDia[data] = [];
      this.eventosPorDia[data].push({
        ...t,
        status,
      });

      this.stats[status]++;
    });
  },

  renderCalendar() {
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    document.getElementById("currentMonth").textContent = `${
      monthNames[this.currentMonth]
    } ${this.currentYear}`;

    const container = document.getElementById("calendarDays");
    container.innerHTML = "";

    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(
      this.currentYear,
      this.currentMonth + 1,
      0
    ).getDate();

    // Dias vazios antes do início do mês
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      container.appendChild(empty);
    }

    // Dias reais
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(this.currentYear, this.currentMonth, d);
      const dateStr = date.toISOString().split("T")[0];

      const btn = document.createElement("div");
      btn.className = "agenda-day";
      btn.innerHTML = `<div class="agenda-day-circle">${d}</div>`;

      if (this.hasEventsOnDate(date)) {
        const indicator = document.createElement("div");
        indicator.className = "agenda-event-indicator";
        btn.appendChild(indicator);
      }

      if (this.isSameDate(date, this.selectedDate)) {
        btn.classList.add("agenda-day-selected");
      }

      btn.addEventListener("click", () => {
        this.selectedDate = date;
        this.renderCalendar();
        this.loadEventsForDate(date);
        document.getElementById(
          "selectedDateTitle"
        ).textContent = `Tarefas do Dia - ${this.formatDate(date)}`;
      });

      container.appendChild(btn);
    }
  },

  hasEventsOnDate(date) {
    const key = date.toISOString().split("T")[0];
    return this.eventosPorDia[key] && this.eventosPorDia[key].length > 0;
  },

  async loadEventsForDate(date) {
    const lista = document.getElementById("eventsList");
    const key = date.toISOString().split("T")[0];
    const eventos = this.eventosPorDia[key] || [];

    if (eventos.length === 0) {
      lista.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          Nenhuma tarefa para esta data
        </div>`;
      return;
    }

    lista.innerHTML = eventos
      .map((e) => {
        const statusColor =
          e.status === "concluida"
            ? "text-green-600"
            : e.status === "atrasada"
            ? "text-red-600"
            : "text-purple-600";

        return `
        <div class="agenda-event-card" onclick="window.router.navigate('/tarefas?disc=${
          e.id_disciplina
        }')">
          <div class="agenda-event-header">
            <h4 class="agenda-event-title">${e.titulo}</h4>
            <span class="text-sm font-semibold ${statusColor}">
              ${e.status.toUpperCase()}
            </span>
          </div>

          <div class="agenda-event-time">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" ...></svg>
            <span>
              ${new Date(e.data_entrega).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      `;
      })
      .join("");
  },

  updateEventStats() {
    document.getElementById("completedCount").textContent =
      this.stats.concluida;
    document.getElementById("pendingCount").textContent = this.stats.pendente;
    document.getElementById("overdueCount").textContent = this.stats.atrasada;
  },

  isSameDate(d1, d2) {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  },

  formatDate(date) {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  },
};

export default agendaController;
