import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";
import Utils from "../utils.js";

export default function agendaModel() {
  console.log("📅 Auxilium | Agenda acadêmica carregada");

  const app = document.getElementById("app");

  let selectedDate = new Date();

  const formatMonth = (date) =>
    date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const formatDate = (date) =>
    date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const toYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  async function carregarPagina() {
    const res = await fetch("pages/agenda.html");
    app.innerHTML = await res.text();

    renderCalendario(selectedDate);
    carregarEventos(selectedDate);

    document
      .getElementById("btnAddEvento")
      ?.addEventListener("click", abrirModalNovoEvento);
  }
  function renderCalendario(baseDate) {
    const container = document.getElementById("calendarDays");
    const titulo = document.getElementById("calendarMonth");
    if (!container || !titulo) return;

    titulo.textContent = formatMonth(baseDate);
    container.innerHTML = "";

    const first = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const last = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);

    for (let d = 1; d <= last.getDate(); d++) {
      const day = new Date(baseDate.getFullYear(), baseDate.getMonth(), d);
      const btn = document.createElement("button");
      btn.className =
        "p-2 w-10 h-10 rounded-full text-sm hover:bg-purple-100 dark:hover:bg-gray-700 transition";
      btn.textContent = d;

      if (day.toDateString() === selectedDate.toDateString()) {
        btn.classList.add("bg-[#8E24AA]", "text-white");
      }

      btn.addEventListener("click", () => {
        selectedDate = day;
        renderCalendario(baseDate);
        carregarEventos(selectedDate);
      });

      container.appendChild(btn);
    }
  }
  async function carregarEventos(date) {
    const lista = document.getElementById("listaEventos");
    lista.innerHTML = `<p class="text-gray-500 text-center">Carregando...</p>`;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login.html";
      return;
    }
    const data = [
      { titulo: "Entrega do trabalho de IA", hora: "10:00" },
      { titulo: "Reunião com grupo de projeto", hora: "18:30" },
    ];

    lista.innerHTML =
      data.length === 0
        ? `<p class="text-gray-500 text-center">Nenhum evento neste dia.</p>`
        : data
            .map(
              (e) => `
      <div class="modern-card glass-card p-3 mb-2 flex justify-between items-center">
        <div>
          <h3 class="font-semibold">${e.titulo}</h3>
          <p class="text-sm text-gray-500">${e.hora}</p>
        </div>
        <button class="text-gray-400 hover:text-red-500">
          <i class="fas fa-trash"></i>
        </button>
      </div>`
            )
            .join("");
  }

  function abrirModalNovoEvento() {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black/60 flex items-center justify-center z-50";

    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 w-11/12 max-w-md">
        <h2 class="text-lg font-semibold mb-4">Novo Evento</h2>
        <input id="tituloEvento" type="text" placeholder="Título do evento"
          class="w-full p-2 border rounded mb-3 text-sm">
        <input id="horaEvento" type="time"
          class="w-full p-2 border rounded mb-4 text-sm">
        <div class="flex gap-2">
          <button id="salvarEvento" 
            class="flex-1 bg-[#8E24AA] hover:bg-[#7b1fa2] text-white rounded-full py-2 font-medium">
            Salvar
          </button>
          <button id="fecharModal" 
            class="flex-1 border border-gray-400 text-gray-700 rounded-full py-2">
            Cancelar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add("modal-open");

    const btnFechar = modal.querySelector("#fecharModal");
    const btnSalvar = modal.querySelector("#salvarEvento");

    btnFechar.addEventListener("click", () => {
      modal.remove();
      document.body.classList.remove("modal-open");
    });

    btnSalvar.addEventListener("click", async () => {
      const titulo = modal.querySelector("#tituloEvento").value.trim();
      const hora = modal.querySelector("#horaEvento").value.trim();

      if (!titulo) {
        Utils.showMessageToast(
          "warning",
          "Título obrigatório",
          "Digite um título para o evento.",
          3000
        );
        return;
      }

      Utils.showMessageToast(
        "success",
        "Evento salvo",
        "Evento salvo com sucesso!",
        3000
      );
      modal.remove();
      document.body.classList.remove("modal-open");
      carregarEventos(selectedDate);
    });
  }
  carregarPagina();
}
