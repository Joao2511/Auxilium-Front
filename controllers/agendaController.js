import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";

const agendaController = {
  eventosPorDia: {},
  stats: { pendente: 0, atrasada: 0, concluido: 0 },

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

    document.getElementById("btnAddEvento").addEventListener("click", () => {
      this.abrirModalNovoEvento(this.selectedDate);
    });
  },

  async carregarEventosDoAluno() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: relacoes } = await supabase
      .from("usuario_disciplina")
      .select("id_disciplina")
      .eq("id_usuario", user.id);

    if (!relacoes || relacoes.length === 0) return;

    const disciplinas = relacoes.map((r) => r.id_disciplina);

    const { data: tarefas } = await supabase
      .from("tarefa")
      .select("id_tarefa, titulo, data_entrega, id_disciplina")
      .in("id_disciplina", disciplinas);

    const { data: entregas } = await supabase
      .from("entrega_tarefa")
      .select("id_tarefa, status, data_submissao")
      .eq("id_aluno", user.id);

    const entregasMap = {};
    entregas?.forEach((e) => {
      entregasMap[e.id_tarefa] = e;
    });

    this.eventosPorDia = {};
    this.stats = { pendente: 0, atrasada: 0, concluido: 0 };

    const hoje = new Date();

    tarefas.forEach((t) => {
      const data = t.data_entrega.split("T")[0];
      const entrega = entregasMap[t.id_tarefa];

      let status = "pendente";

      if (entrega) {
        if (entrega.status === "AVALIADA" || entrega.status === "ENVIADA") {
          status = "concluido";
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

    const { data: eventosPessoais } = await supabase
      .from("agenda_evento")
      .select("id_evento, data, hora, descricao, status")
      .eq("id_usuario", user.id);

    eventosPessoais?.forEach((ev) => {
      console.log("🔥 STATUS RECEBIDO DO BANCO:", ev.id_evento, ev.status);

      const key = ev.data;
      if (!this.eventosPorDia[key]) this.eventosPorDia[key] = [];

      this.eventosPorDia[key].push({
        tipo: "evento",
        id_evento: ev.id_evento,
        titulo: ev.descricao,
        data: ev.data,
        hora: ev.hora,
        data_entrega: `${ev.data}T${ev.hora}`,
        status: ev.status || "pendente",
        id_disciplina: null,
      });
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

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      container.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(this.currentYear, this.currentMonth, d);
      const dateStr = date.toISOString().split("T")[0];

      const btn = document.createElement("div");
      btn.className = "agenda-day";
      btn.innerHTML = `<div class="agenda-day-circle">${d}</div>`;

      const eventos = this.eventosPorDia[dateStr] || [];

      if (eventos.length > 0) {
        const indicator = document.createElement("div");

        const temConcluidos = eventos.some((ev) => ev.status === "concluido");
        const temAtrasados = eventos.some((ev) => ev.status === "atrasada");
        const temPendentes = eventos.some((ev) => ev.status === "pendente");

        let cor = "bg-green-500";

        if (temAtrasados) cor = "bg-red-600";
        else if (temPendentes) cor = "bg-yellow-500";
        else if (temConcluidos) cor = "bg-green-600";

        indicator.className = `agenda-event-indicator ${cor}`;
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
        if (e.tipo === "evento") {
          const isDone = e.status === "concluido";

          return `
            <div class="agenda-event-card ${
              isDone ? "opacity-60" : ""
            } cursor-pointer"
                data-id-evento="${e.id_evento}">
              <div class="agenda-event-header">
                <h4 class="agenda-event-title ${
                  isDone ? "line-through text-gray-500" : ""
                }">
                  ${e.titulo}
                </h4>
                <span class="text-xs font-semibold ${
                  isDone ? "text-green-600" : "text-blue-600"
                }">
                  ${isDone ? "CONCLUÍDO" : "EVENTO"}
                </span>
              </div>

              <div class="agenda-event-time flex gap-2 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>
                  ${new Date(e.data_entrega).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          `;
        }

        const statusColor =
          e.status === "concluido"
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
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
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

    lista.querySelectorAll("[data-id-evento]").forEach((card) => {
      const id = card.dataset.idEvento;

      const evento = eventos.find(
        (ev) => ev.tipo === "evento" && String(ev.id_evento) === String(id)
      );

      if (!evento) return;

      card.addEventListener("click", () => {
        this.abrirModalDetalheEvento(evento);
      });
    });
  },

  abrirModalDetalheEvento(evento) {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black/60 flex items-center justify-center z-50";

    const dataFormatada = new Date(evento.data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const horaFormatada = (evento.hora || "").substring(0, 5);

    const isDone = evento.status === "concluido";

    modal.innerHTML = `
    <div class="bg-white rounded-2xl p-6 w-11/12 max-w-md shadow-xl animate-fadeInUp">
      <h2 class="text-xl font-bold mb-4 text-gray-900">Detalhes do evento</h2>

      <div class="space-y-2 mb-4 text-sm">
        <div>
          <span class="font-medium text-gray-700">Título:</span>
          <p class="text-gray-900">${evento.titulo}</p>
        </div>
        <div class="flex justify-between">
          <div>
            <span class="font-medium text-gray-700">Data:</span>
            <p class="text-gray-900">${dataFormatada}</p>
          </div>
          <div>
            <span class="font-medium text-gray-700">Horário:</span>
            <p class="text-gray-900">${horaFormatada}</p>
          </div>
        </div>
        <div>
          <span class="font-medium text-gray-700">Status:</span>
          <p class="${
            isDone ? "text-green-600" : "text-purple-600"
          } font-semibold">
            ${isDone ? "Concluído" : "Pendente"}
          </p>
        </div>
      </div>

      <div class="flex gap-2">
        <button id="btnConcluirEvento"
          class="flex-1 ${
            isDone
              ? "bg-gray-300 text-gray-700 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          } rounded-full py-2 font-semibold flex items-center justify-center gap-2">
          ${isDone ? "Já concluído" : "Concluir"}
        </button>

        <button id="btnFecharDetalhe"
          class="flex-1 border border-gray-400 text-gray-700 rounded-full py-2">
          Fechar
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);

    const btnFechar = modal.querySelector("#btnFecharDetalhe");
    const btnConcluir = modal.querySelector("#btnConcluirEvento");
    const controller = this;

    btnFechar.addEventListener("click", () => {
      modal.remove();
    });

    if (!isDone) {
      btnConcluir.addEventListener("click", async () => {
        btnConcluir.disabled = true;
        btnConcluir.innerHTML = `
        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 00-8 8h4z"></path>
        </svg>
        Salvando...
      `;

        const { error } = await supabase
          .from("agenda_evento")
          .update({ status: "concluido" })
          .eq("id_evento", evento.id_evento);

        if (error) {
          console.error(error);
          alert("Erro ao atualizar evento.");
          btnConcluir.disabled = false;
          btnConcluir.textContent = "Concluir";
          return;
        }

        await controller.carregarEventosDoAluno();
        controller.renderCalendar();
        controller.loadEventsForDate(controller.selectedDate);

        modal.remove();
      });
    }
  },

  abrirModalNovoEvento(selectedDate) {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black/60 flex items-center justify-center z-50";

    modal.innerHTML = `
    <div class="bg-white rounded-2xl p-6 w-11/12 max-w-md shadow-xl animate-fadeInUp">
      <h2 class="text-xl font-bold mb-4 text-gray-900">Novo Evento</h2>

      <label class="block text-sm font-medium mb-1 text-gray-700">Dia</label>
      <input id="novoDia" type="date"
        value="${selectedDate.toISOString().split("T")[0]}"
        class="w-full p-2 border rounded mb-3 text-sm outline-purple-500">

      <label class="block text-sm font-medium mb-1 text-gray-700">Horário</label>
      <input id="novoHora" type="time"
        class="w-full p-2 border rounded mb-3 text-sm outline-purple-500">

      <label class="block text-sm font-medium mb-1 text-gray-700">Descrição</label>
      <textarea id="novoDesc" rows="3"
        placeholder="Ex: reunião, estudo, lembrete..."
        class="w-full p-2 border rounded mb-4 text-sm outline-purple-500"></textarea>

      <div class="flex gap-2">
        <button id="btnSalvarEvento"
          class="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full py-2 font-semibold">
          Salvar
        </button>

        <button id="btnFecharModal"
          class="flex-1 border border-gray-400 text-gray-700 rounded-full py-2">
          Cancelar
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);

    modal.querySelector("#btnFecharModal").addEventListener("click", () => {
      modal.remove();
    });

    modal
      .querySelector("#btnSalvarEvento")
      .addEventListener("click", async () => {
        const dia = modal.querySelector("#novoDia").value;
        const hora = modal.querySelector("#novoHora").value;
        const desc = modal.querySelector("#novoDesc").value.trim();

        if (!desc) return alert("Digite uma descrição.");
        if (!hora) return alert("Escolha um horário.");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { error } = await supabase.from("agenda_evento").insert({
          id_usuario: user.id,
          data: dia,
          hora,
          descricao: desc,
        });

        if (error) {
          console.error(error);
          return alert("Erro ao salvar evento.");
        }

        alert("Evento salvo com sucesso!");

        modal.remove();

        await this.carregarEventosDoAluno();
        this.renderCalendar();
        this.loadEventsForDate(this.selectedDate);
      });
  },

  updateEventStats() {
    document.getElementById("completedCount").textContent =
      this.stats.concluido;
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

window.agenda_markDone = async (id_evento, marcar) => {
  const novoStatus = marcar === "true" ? "concluido" : "pendente";

  const { error } = await supabase
    .from("agenda_evento")
    .update({ status: novoStatus })
    .eq("id_evento", id_evento);

  if (error) {
    console.error(error);
    return alert("Erro ao atualizar evento.");
  }

  await agendaController.carregarEventosDoAluno();
  agendaController.renderCalendar();
  agendaController.loadEventsForDate(agendaController.selectedDate);
};

export default agendaController;
