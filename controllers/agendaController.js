import { supabase } from "../utils/supabaseClient.js";

const agendaController = {
  async index() {
    // Load the agenda HTML
    const app = document.getElementById("app");
    const res = await fetch("pages/agenda.html");
    app.innerHTML = await res.text();

    // Initialize the agenda
    this.initAgenda();
  },

  async initAgenda() {
    // Get current date
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    // Set initial selected date to today
    let selectedDate = new Date(today);

    // Render initial calendar
    this.renderCalendar(currentMonth, currentYear, selectedDate);

    // Load events for today
    await this.loadEventsForDate(selectedDate);

    // Update stats
    this.updateEventStats();

    // Add event listeners
    document.getElementById("prev-month").addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      this.renderCalendar(currentMonth, currentYear, selectedDate);
    });

    document.getElementById("next-month").addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      this.renderCalendar(currentMonth, currentYear, selectedDate);
    });

    // Add today button functionality
    const todayBtn = document.createElement("button");
    todayBtn.className = "agenda-nav-button";
    todayBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    `;
    todayBtn.title = "Hoje";
    todayBtn.addEventListener("click", () => {
      currentMonth = today.getMonth();
      currentYear = today.getFullYear();
      selectedDate = new Date(today);
      this.renderCalendar(currentMonth, currentYear, selectedDate);
      this.loadEventsForDate(selectedDate);
      document.getElementById(
        "selectedDateTitle"
      ).textContent = `Tarefas do Dia - ${this.formatDate(selectedDate)}`;
    });

    document.querySelector(".agenda-calendar-header").appendChild(todayBtn);

    // Add new event button functionality
    document.getElementById("new-event-btn").addEventListener("click", () => {
      this.openNewEventModal(selectedDate);
    });
  },

  renderCalendar(month, year, selectedDate) {
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

    // Update month/year display
    document.getElementById(
      "currentMonth"
    ).textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get previous month's days
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Create calendar grid
    const calendarDays = document.getElementById("calendarDays");
    calendarDays.innerHTML = "";

    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day);
      const dayElement = this.createDayElement(day, date, false, selectedDate);
      calendarDays.appendChild(dayElement);
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isToday = this.isSameDate(date, new Date());
      const isSelected = this.isSameDate(date, selectedDate);
      const dayElement = this.createDayElement(
        i,
        date,
        true,
        selectedDate,
        isToday,
        isSelected
      );
      calendarDays.appendChild(dayElement);
    }

    // Next month's days
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      const dayElement = this.createDayElement(i, date, false, selectedDate);
      calendarDays.appendChild(dayElement);
    }
  },

  createDayElement(
    day,
    date,
    isCurrentMonth,
    selectedDate,
    isToday = false,
    isSelected = false
  ) {
    const dayElement = document.createElement("div");
    dayElement.className = "agenda-day";

    if (!isCurrentMonth) {
      dayElement.classList.add("agenda-day-other-month");
    }

    if (isToday) {
      dayElement.classList.add("agenda-day-today");
    } else if (isSelected) {
      dayElement.classList.add("agenda-day-selected");
    }

    const dayCircle = document.createElement("div");
    dayCircle.className = "agenda-day-circle";

    // Add event indicator
    if (isCurrentMonth && this.hasEventsOnDate(date)) {
      const indicator = document.createElement("div");
      indicator.className = "agenda-event-indicator";
      dayElement.appendChild(indicator);
    }

    dayCircle.textContent = day;
    dayElement.appendChild(dayCircle);

    if (isCurrentMonth) {
      dayElement.addEventListener("click", () => {
        selectedDate = new Date(date);
        this.loadEventsForDate(selectedDate);
        document.getElementById(
          "selectedDateTitle"
        ).textContent = `Tarefas do Dia - ${this.formatDate(selectedDate)}`;

        // Re-render calendar to update selection
        const currentMonth = date.getMonth();
        const currentYear = date.getFullYear();
        this.renderCalendar(currentMonth, currentYear, selectedDate);
      });
    }

    return dayElement;
  },

  async loadEventsForDate(date) {
    const eventsList = document.getElementById("eventsList");

    // Show loading state
    eventsList.innerHTML = `
      <div class="skeleton h-24 rounded-2xl"></div>
      <div class="skeleton h-24 rounded-2xl"></div>
    `;

    try {
      // Get user ID from session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        eventsList.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <p>Faça login para ver suas tarefas</p>
          </div>
        `;
        return;
      }

      // Format date for query
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

      // Fetch tasks for the selected date
      const { data: tarefas, error } = await supabase
        .from("tarefa")
        .select(
          `
          id_tarefa,
          titulo,
          descricao,
          data_entrega,
          pontos_maximos,
          id_disciplina,
          disciplina (nome)
        `
        )
        .or(`data_entrega.eq.${formattedDate}`)
        .order("data_entrega", { ascending: true });

      if (error) throw error;

      // Update event count
      document.getElementById("eventosCount").textContent = tarefas.length;

      // Render events
      if (tarefas.length === 0) {
        eventsList.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>Nenhuma tarefa para esta data</p>
          </div>
        `;
        return;
      }

      // Render tasks
      let html = "";
      tarefas.forEach((tarefa) => {
        // Determine priority color
        const priorityClass =
          tarefa.pontos_maximos > 20
            ? "agenda-event-points-high"
            : tarefa.pontos_maximos > 10
            ? "agenda-event-points-medium"
            : "agenda-event-points-low";

        html += `
          <div class="agenda-event-card" onclick="window.router.navigate('/tarefas?disc=${
            tarefa.id_disciplina
          }')">
            <div class="agenda-event-header">
              <div class="agenda-event-content">
                <h4 class="agenda-event-title">${tarefa.titulo}</h4>
                <div class="agenda-event-time">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>${this.formatTime(new Date(tarefa.data_entrega))}</span>
                </div>
                <div class="agenda-event-discipline">
                  <span>${tarefa.disciplina?.nome || "Disciplina"}</span>
                </div>
              </div>
              <div class="agenda-event-meta">
                <span class="agenda-event-points ${priorityClass}">
                  ${tarefa.pontos_maximos} pts
                </span>
                <button class="agenda-event-action">
                  Ver
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `;
      });

      eventsList.innerHTML = html;
    } catch (error) {
      console.error("Error loading events:", error);
      eventsList.innerHTML = `
        <div class="text-center py-8 text-red-500">
          <p>Erro ao carregar tarefas: ${error.message}</p>
        </div>
      `;
    }
  },

  async updateEventStats() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get all tasks for the user
      const { data: tarefas, error } = await supabase
        .from("tarefa")
        .select("id_tarefa, data_entrega")
        .order("data_entrega", { ascending: true });

      if (error) throw error;

      // Calculate stats
      const today = new Date();
      let completed = 0;
      let pending = 0;
      let overdue = 0;

      tarefas.forEach((tarefa) => {
        const dueDate = new Date(tarefa.data_entrega);
        if (dueDate < today) {
          overdue++;
        } else {
          pending++;
        }
      });

      // Update UI
      document.getElementById("completedCount").textContent = completed;
      document.getElementById("pendingCount").textContent = pending;
      document.getElementById("overdueCount").textContent = overdue;

      // Update status text
      const statusText = document.getElementById("statusText");
      if (pending > 0) {
        statusText.textContent = `${pending} pendentes esta semana`;
      } else {
        statusText.textContent = "Nenhuma tarefa pendente";
      }
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  },

  hasEventsOnDate(date) {
    // This would normally check against actual events
    // For now, we'll simulate some events
    const today = new Date();
    const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));

    // Simulate events on certain days
    return [0, 2, 5, 7, 10, 14, 15, 20, 25].includes(diffDays);
  },

  isSameDate(date1, date2) {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  },

  formatDate(date) {
    const options = { weekday: "long", day: "numeric", month: "long" };
    return date.toLocaleDateString("pt-BR", options);
  },

  formatTime(date) {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  openNewEventModal(selectedDate) {
    // Create modal overlay
    const modal = document.createElement("div");
    modal.className = "agenda-modal-overlay";

    // Create modal content
    modal.innerHTML = `
      <div class="agenda-modal-content-wrapper">
        <div class="agenda-modal">
          
          <!-- Close Button -->
          <button id="btnFecharModal" class="agenda-modal-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          
          <!-- Header -->
          <div class="agenda-modal-header">
            <div class="agenda-modal-title">
              <h2>Nova Tarefa</h2>
              <p>Adicione uma nova tarefa à sua agenda</p>
            </div>
          </div>
          
          <!-- Form -->
          <div class="agenda-modal-body">
            <form id="newEventForm" class="agenda-form">
              <div class="agenda-form-group">
                <label class="agenda-form-label">Título da Tarefa</label>
                <input type="text" id="eventTitle" class="agenda-form-input" placeholder="Ex: Relatório de Química" required>
              </div>
              
              <div class="agenda-form-group">
                <label class="agenda-form-label">Descrição</label>
                <textarea id="eventDescription" class="agenda-form-textarea" rows="3" placeholder="Detalhes da tarefa..."></textarea>
              </div>
              
              <div class="agenda-form-grid">
                <div class="agenda-form-group">
                  <label class="agenda-form-label">Data</label>
                  <input type="date" id="eventDate" class="agenda-form-input" value="${
                    selectedDate.toISOString().split("T")[0]
                  }" required>
                </div>
                
                <div class="agenda-form-group">
                  <label class="agenda-form-label">Hora</label>
                  <input type="time" id="eventTime" class="agenda-form-input" required>
                </div>
              </div>
              
              <div class="agenda-form-group">
                <label class="agenda-form-label">Disciplina</label>
                <select id="eventDiscipline" class="agenda-form-select" required>
                  <option value="">Selecione uma disciplina</option>
                  <option value="1">Matemática</option>
                  <option value="2">Português</option>
                  <option value="3">História</option>
                  <option value="4">Geografia</option>
                  <option value="5">Ciências</option>
                </select>
              </div>
              
              <div class="agenda-form-group">
                <label class="agenda-form-label">Pontos</label>
                <input type="number" id="eventPoints" class="agenda-form-input" min="1" max="100" placeholder="Ex: 10" required>
              </div>
              
              <div class="agenda-form-group">
                <label class="agenda-form-label">Prioridade</label>
                <div class="agenda-priority-grid">
                  <button type="button" class="agenda-priority-btn" data-value="low">
                    Baixa
                  </button>
                  <button type="button" class="agenda-priority-btn active" data-value="medium">
                    Média
                  </button>
                  <button type="button" class="agenda-priority-btn" data-value="high">
                    Alta
                  </button>
                </div>
                <input type="hidden" id="eventPriority" value="medium">
              </div>
            </form>
          </div>
          
          <!-- Footer -->
          <div class="agenda-modal-footer">
            <button id="saveEventBtn" class="agenda-modal-submit">
              Salvar Tarefa
            </button>
          </div>
        </div>
      </div>
    `;

    // Add modal to document
    document.body.appendChild(modal);

    // Trigger entrance animation
    setTimeout(() => {
      modal.classList.add("active");
      modal
        .querySelector(".agenda-modal-content-wrapper")
        .classList.add("active");
    }, 10);

    // Add event listeners
    document.getElementById("btnFecharModal").addEventListener("click", () => {
      this.closeModal(modal);
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });

    // Priority buttons
    document.querySelectorAll(".agenda-priority-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".agenda-priority-btn").forEach((b) => {
          b.classList.remove("active");
        });

        btn.classList.add("active");

        document.getElementById("eventPriority").value = btn.dataset.value;
      });
    });

    // Save event button
    document
      .getElementById("saveEventBtn")
      .addEventListener("click", async () => {
        await this.saveEvent();
        this.closeModal(modal);
        // Refresh events
        this.loadEventsForDate(selectedDate);
        this.updateEventStats();
      });
  },

  closeModal(modal) {
    modal.classList.remove("active");
    modal
      .querySelector(".agenda-modal-content-wrapper")
      .classList.remove("active");

    setTimeout(() => {
      document.body.removeChild(modal);
    }, 300);
  },

  async saveEvent() {
    // In a real application, this would save to the database
    console.log("Saving event...");

    // Get form values
    const title = document.getElementById("eventTitle").value;
    const description = document.getElementById("eventDescription").value;
    const date = document.getElementById("eventDate").value;
    const time = document.getElementById("eventTime").value;
    const discipline = document.getElementById("eventDiscipline").value;
    const points = document.getElementById("eventPoints").value;
    const priority = document.getElementById("eventPriority").value;

    console.log({
      title,
      description,
      date,
      time,
      discipline,
      points,
      priority,
    });

    // Show success message
    alert("Tarefa salva com sucesso!");
  },
};

export default agendaController;
