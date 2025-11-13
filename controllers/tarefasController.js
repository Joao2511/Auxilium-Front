import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";

export default {
  async index() {
    const app = document.getElementById("app");
    const res = await fetch("pages/tarefas.html");
    app.innerHTML = await res.text();

    await new Promise((r) => requestAnimationFrame(r));

    const lista = document.getElementById("tarefasLista");

    // Better URL parameter parsing
    const hashParts = window.location.hash.split("?");
    const params = new URLSearchParams(hashParts[1] || "");
    const id_disciplina = parseInt(params.get("disc"), 10);

    console.log("Debug - URL Hash:", window.location.hash);
    console.log("Debug - Discipline ID:", id_disciplina);

    // Validate discipline ID
    if (!id_disciplina || isNaN(id_disciplina)) {
      lista.innerHTML = `
        <div class="p-8 bg-red-50 rounded-2xl border-2 border-red-200 text-center">
          <p class="text-red-600 font-medium mb-2">
            Erro: ID da disciplina inválido ou não fornecido.
          </p>
          <button onclick="window.router.navigate('/disciplinas')" class="mt-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full font-semibold text-sm hover:shadow-lg transition-all">
            Voltar para Disciplinas
          </button>
        </div>
      `;
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login.html";
      return;
    }

    // Load discipline name
    const { data: disciplina, error: discError } = await supabase
      .from("disciplina")
      .select("nome")
      .eq("id_disciplina", id_disciplina)
      .single();

    console.log("Debug - Discipline query result:", disciplina, discError);

    if (disciplina) {
      const nameElement = document.getElementById("disciplineName");
      if (nameElement) {
        nameElement.textContent = disciplina.nome;
      }
    } else if (discError) {
      console.error("Error loading discipline:", discError);
      lista.innerHTML = `
        <div class="p-8 bg-red-50 rounded-2xl border-2 border-red-200 text-center">
          <p class="text-red-600 font-medium mb-2">
            Erro ao carregar disciplina: ${discError.message}
          </p>
          <button onclick="window.router.navigate('/disciplinas')" class="mt-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full font-semibold text-sm hover:shadow-lg transition-all">
            Voltar para Disciplinas
          </button>
        </div>
      `;
      return;
    }

    // Add back button functionality
    const backButton = document.getElementById("back-button");
    if (backButton) {
      backButton.addEventListener("click", () => {
        router.navigate("/disciplinas");
      });
    }

    const { data: tarefas, error } = await supabase
      .from("tarefa")
      .select("id_tarefa, titulo, descricao, data_entrega, pontos_maximos")
      .eq("id_disciplina", id_disciplina)
      .order("data_entrega", { ascending: true });

    console.log("Debug - Tasks query:");
    console.log("  - Discipline ID used:", id_disciplina);
    console.log("  - Tasks found:", tarefas?.length || 0);
    console.log("  - Error:", error);
    console.log("  - Tasks data:", tarefas);

    if (error) {
      lista.innerHTML = `
        <div class="p-8 bg-red-50 rounded-2xl border-2 border-red-200 text-center">
          <p class="text-red-600 font-medium mb-2">Erro ao buscar tarefas: ${
            error.message
          }</p>
          <p class="text-sm text-red-500 mt-2">Código: ${
            error.code || "N/A"
          }</p>
        </div>
      `;
      console.error("Task query error:", error);
      return;
    }

    const { data: entregas } = await supabase
      .from("entrega_tarefa")
      .select("id_tarefa, data_submissao, concluida")
      .eq("id_aluno", session.user.id);

    const entregasMap = {};
    entregas?.forEach((e) => (entregasMap[e.id_tarefa] = e));

    // Update counter
    const countElement = document.getElementById("tarefasCount");
    if (countElement) {
      countElement.textContent = tarefas.length;
    }

    // Update status text
    const completedCount = tarefas.filter(
      (t) => entregasMap[t.id_tarefa]?.concluida
    ).length;
    const statusElement = document.getElementById("statusText");
    if (statusElement) {
      statusElement.textContent = `${completedCount} de ${tarefas.length} concluídas`;
    }

    if (tarefas.length === 0) {
      lista.innerHTML = `
        <div class="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 text-center">
          <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p class="text-gray-600 font-medium mb-2">
            Nenhuma tarefa cadastrada ainda.
          </p>
          <p class="text-sm text-gray-500">
            As tarefas aparecerão aqui quando forem criadas pelo professor.
          </p>
        </div>
      `;
      return;
    }

    document.getElementById("tarefasLista").innerHTML = "";

    tarefas.forEach((t) => {
      const data = new Date(t.data_entrega);
      const agora = new Date();
      const entrega = entregasMap[t.id_tarefa];
      const isCompleted = entrega?.concluida;
      const isOverdue = !isCompleted && data < agora;

      const statusBadge = isCompleted
        ? '<span class="inline-flex items-center bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><polyline points="20 6 9 17 4 12"/></svg>Concluída</span>'
        : isOverdue
        ? '<span class="inline-flex items-center bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Atrasada</span>'
        : '<span class="inline-flex items-center bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Pendente</span>';

      const cardHTML = `
        <div class="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-purple-300 transition-all ${
          isCompleted ? "opacity-75" : ""
        }">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex-1 min-w-0">
              <h4 class="text-lg font-bold text-gray-900 mb-1 truncate">${
                t.titulo
              }</h4>
              <p class="text-sm text-gray-600 line-clamp-2">${
                t.descricao || "Sem descrição."
              }</p>
            </div>
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                <span class="text-lg font-bold text-purple-600">${
                  t.pontos_maximos
                }</span>
              </div>
            </div>
          </div>
          
          <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div class="flex items-center space-x-3 text-sm text-gray-600">
              <div class="flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>${data.toLocaleDateString()}</span>
              </div>
              <div class="flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>${data.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</span>
              </div>
            </div>
            ${statusBadge}
          </div>

          ${
            !isCompleted
              ? `
            <div class="flex items-center gap-2">
              <label class="flex-1 cursor-pointer">
                <input type="file" class="hidden task-file-input" data-task-id="${t.id_tarefa}" />
                <div class="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-200 transition-all active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Upload arquivo</span>
                </div>
              </label>
              <button class="task-complete-btn bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:shadow-lg transition-all active:scale-95 flex items-center space-x-1" data-task-id="${t.id_tarefa}">
                <span>Concluir</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          `
              : ""
          }
        </div>
      `;

      lista.insertAdjacentHTML("beforeend", cardHTML);
    });

    // Add event listeners
    document.querySelectorAll(".task-file-input").forEach((input) => {
      input.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const taskId = parseInt(e.target.dataset.taskId);

        try {
          const filePath = `${session.user.id}/${taskId}/${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("entregas")
            .upload(filePath, file, { upsert: true });
          if (uploadError) throw uploadError;

          const { error: insertError } = await supabase
            .from("entrega_tarefa")
            .insert({
              id_tarefa: taskId,
              id_aluno: session.user.id,
              caminho_arquivo: filePath,
              data_submissao: new Date().toISOString(),
              concluida: true,
            });
          if (insertError) throw insertError;

          alert(`Arquivo enviado e tarefa marcada como concluída!`);
          router.navigate(`/tarefas?disc=${id_disciplina}`);
        } catch (err) {
          alert("Erro ao enviar arquivo: " + err.message);
        }
      });
    });

    document.querySelectorAll(".task-complete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const taskId = parseInt(e.currentTarget.dataset.taskId);

        try {
          const { error: insertError } = await supabase
            .from("entrega_tarefa")
            .insert({
              id_tarefa: taskId,
              id_aluno: session.user.id,
              caminho_arquivo: null,
              data_submissao: new Date().toISOString(),
              concluida: true,
            });
          if (insertError) throw insertError;

          alert("Tarefa marcada como concluída!");
          router.navigate(`/tarefas?disc=${id_disciplina}`);
        } catch (err) {
          alert("Erro ao concluir tarefa: " + err.message);
        }
      });
    });
  },
};
