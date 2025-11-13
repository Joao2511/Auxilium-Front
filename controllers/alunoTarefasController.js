import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";

export default {
  async index() {
    const app = document.getElementById("app");
    const res = await fetch("pages/tarefas.html");
    app.innerHTML = await res.text();

    // Wait for DOM to be ready
    await new Promise((r) => requestAnimationFrame(r));

    const paramsString = window.location.hash.split("?")[1];
    const params = new URLSearchParams(paramsString);
    const id_disciplina = parseInt(params.get("disc"), 10);

    const lista = document.getElementById("tarefasLista");

    if (!lista) {
      console.error("Error: tarefasLista element not found in DOM");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login.html";
      return;
    }

    const { data: tarefas, error } = await supabase
      .from("tarefa")
      .select("id_tarefa, titulo, descricao, data_entrega, pontos_maximos")
      .eq("id_disciplina", id_disciplina)
      .order("data_entrega", { ascending: true });

    if (error) {
      console.error("Erro ao carregar tarefas:", error);
      lista.innerHTML =
        '<p class="text-red-500 text-center">Erro ao carregar tarefas.</p>';
      return;
    }

    if (!tarefas || tarefas.length === 0) {
      lista.innerHTML =
        '<p class="text-gray-500 text-center">Nenhuma tarefa disponível ainda.</p>';
      return;
    }

    lista.innerHTML = tarefas
      .map(
        (t) => `
        <div class="modern-card p-4 flex justify-between items-center ">
          <div>
            <h3 class="text-lg font-semibold">${t.titulo}</h3>
            <p class="text-sm text-gray-500">
              Entrega até: ${new Date(t.data_entrega).toLocaleString()}<br>
              Pontos: ${t.pontos_maximos}
            </p>
          </div>
          <button
            data-open-entrega
            data-id="${t.id_tarefa}"
            class="bg-[#8E24AA] text-white px-4 py-2 rounded-full font-medium hover:bg-[#7b1fa2] transition ml-2"
          >
            Enviar
          </button>
        </div>
      `
      )
      .join("");

    lista.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-open-entrega]");
      if (!btn) return;
      const id_tarefa = parseInt(btn.dataset.id, 10);
      if (!id_tarefa || Number.isNaN(id_tarefa))
        return alert("Tarefa inválida.");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await abrirModalEntrega(id_tarefa, session.user.id);
    });

    async function abrirModalEntrega(id_tarefa, id_aluno) {
      const { data: tarefa, error: tarefaError } = await supabase
        .from("tarefa")
        .select("titulo, descricao, data_entrega, pontos_maximos")
        .eq("id_tarefa", id_tarefa)
        .single();

      if (tarefaError || !tarefa) {
        console.error(tarefaError);
        alert("Erro ao carregar detalhes da tarefa.");
        return;
      }

      const modal = document.createElement("div");
      modal.className =
        "fixed inset-0 bg-black/50 flex items-center justify-center z-50 modal-overlay";
      modal.style.opacity = "0";
      modal.style.transition = "opacity 0.3s ease";

      modal.innerHTML = `
    <div class="modal-content-wrapper w-full h-full flex items-center justify-center" style="transform: scale(0.7); opacity: 0; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
      <div class="bg-white w-full h-full sm:w-[95%] sm:h-[95%] md:w-[90%] md:h-[90%] lg:max-w-3xl lg:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        <!-- Close Button -->
        <button id="btnFechar" class="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 w-10 h-10 flex items-center justify-center text-white hover:text-white hover:bg-white/20 rounded-full transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 sm:px-8 py-6 sm:py-8">
          <div class="flex items-start justify-between mb-3 pl-12">
            <div class="flex-1 min-w-0">
              <h2 class="text-xl sm:text-2xl font-bold mb-2 pr-2 break-words">${
                tarefa.titulo
              }</h2>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm opacity-90">
                <div class="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>${new Date(
                    tarefa.data_entrega
                  ).toLocaleDateString()}</span>
                </div>
                <div class="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>${new Date(tarefa.data_entrega).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</span>
                </div>
              </div>
            </div>
            <div class="flex-shrink-0">
              <div class="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <div class="text-center">
                  <div class="text-xl sm:text-2xl font-bold">${
                    tarefa.pontos_maximos
                  }</div>
                  <div class="text-xs opacity-90">pontos</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          
          <!-- Description -->
          <div class="bg-gray-50 rounded-2xl p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span>Descrição da Tarefa</span>
            </h3>
            <p class="text-gray-700 leading-relaxed">${
              tarefa.descricao || "Sem descrição fornecida."
            }</p>
          </div>

          <!-- Previous Submissions -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <span>Entregas Anteriores</span>
            </h3>
            <div id="listaEntregas" class="space-y-3"></div>
          </div>

          <!-- Upload Section -->
          <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-purple-200">
            <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>Nova Entrega</span>
            </h3>
            <label for="arquivoInput" class="block mb-3">
              <div class="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3 text-purple-500">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p class="text-sm font-semibold text-gray-700 mb-1">Clique para selecionar arquivos</p>
                <p class="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG, ZIP (máx 20 MB cada)</p>
              </div>
              <input id="arquivoInput" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png,.zip" class="hidden" />
            </label>
            <div id="selectedFiles" class="text-sm text-gray-600 mb-3"></div>
          </div>

        </div>

        <!-- Footer Actions -->
        <div class="px-6 sm:px-8 py-4 sm:py-6 bg-gray-50 border-t border-gray-200">
          <button id="btnEnviarEntrega"
            class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full py-3 font-semibold hover:shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Enviar Arquivos</span>
          </button>
        </div>

      </div>
    </div>
  `;

      document.body.appendChild(modal);
      document.body.classList.add("modal-open");

      // Trigger animation
      requestAnimationFrame(() => {
        modal.style.opacity = "1";
        const wrapper = modal.querySelector(".modal-content-wrapper");
        wrapper.style.transform = "scale(1)";
        wrapper.style.opacity = "1";
      });

      const listaEntregas = modal.querySelector("#listaEntregas");
      const btnEnviar = modal.querySelector("#btnEnviarEntrega");
      const btnFechar = modal.querySelector("#btnFechar");
      const fileInput = modal.querySelector("#arquivoInput");
      const selectedFilesDiv = modal.querySelector("#selectedFiles");

      // File input change handler
      fileInput.addEventListener("change", () => {
        const files = fileInput.files;
        if (files.length > 0) {
          selectedFilesDiv.innerHTML = `
            <div class="bg-white rounded-lg p-3 space-y-2">
              <p class="font-semibold text-purple-600 text-xs mb-2">${
                files.length
              } arquivo(s) selecionado(s):</p>
              ${Array.from(files)
                .map(
                  (f) => `
                <div class="flex items-center space-x-2 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-500">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                  </svg>
                  <span class="flex-1 truncate">${f.name}</span>
                  <span class="text-gray-500">${(f.size / 1024 / 1024).toFixed(
                    2
                  )} MB</span>
                </div>
              `
                )
                .join("")}
            </div>
          `;
        } else {
          selectedFilesDiv.innerHTML = "";
        }
      });

      const { data: entregas, error: entregasError } = await supabase
        .from("entrega_tarefa")
        .select(
          `
    id_entrega,
    caminho_arquivo,
    data_submissao,
    status,
    nota_calculada,
    nota:nota(
      nota_valor,
      observacoes
    )
  `
        )
        .eq("id_tarefa", id_tarefa)
        .eq("id_aluno", id_aluno)
        .order("data_submissao", { ascending: true });

      if (entregasError) {
        console.error("Erro ao carregar entregas:", entregasError);
        return;
      }

      if (entregas?.length) {
        listaEntregas.innerHTML = entregas
          .map(
            (e) => `
        <div class="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-all">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-600 flex-shrink-0">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <polyline points="13 2 13 9 20 9"/>
                </svg>
                <span class="font-semibold text-gray-900 truncate">${e.caminho_arquivo
                  .split("/")
                  .pop()}</span>
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                <div class="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>${new Date(
                    e.data_submissao
                  ).toLocaleDateString()}</span>
                </div>
                <div class="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>${new Date(e.data_submissao).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</span>
                </div>
              </div>
            </div>
            <div class="flex-shrink-0">
              ${
                e.nota?.[0]?.nota_valor !== undefined ||
                e.nota_calculada !== undefined
                  ? `
                <div class="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                  <span class="text-lg font-bold text-green-700">${
                    e.nota?.[0]?.nota_valor ?? e.nota_calculada
                  }</span>
                </div>
              `
                  : `
                <span class="inline-flex items-center bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                  ${e.status || "Enviado"}
                </span>
              `
              }
            </div>
          </div>
          ${
            e.nota?.[0]?.observacoes
              ? `
            <div class="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
              <p class="text-xs font-semibold text-yellow-800 mb-1">Observações do Professor:</p>
              <p class="text-xs text-yellow-700">${e.nota[0].observacoes}</p>
            </div>
          `
              : ""
          }
        </div>`
          )
          .join("");
      } else {
        listaEntregas.innerHTML = `
          <div class="text-center py-8">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
            </div>
            <p class="text-gray-500 text-sm font-medium">Nenhum arquivo enviado ainda</p>
            <p class="text-gray-400 text-xs mt-1">Faça o upload dos seus arquivos abaixo</p>
          </div>
        `;
      }

      btnEnviar.addEventListener("click", async () => {
        const files = modal.querySelector("#arquivoInput").files;
        if (!files.length) return alert("Selecione pelo menos um arquivo.");

        for (const file of files) {
          if (file.size > 20 * 1024 * 1024) {
            alert(`O arquivo ${file.name} ultrapassa 20 MB!`);
            continue;
          }

          const path = `${id_aluno}/${id_tarefa}/${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from("entregas")
            .upload(path, file, { upsert: true });

          if (uploadError) {
            console.error(uploadError);
            alert(`Erro ao enviar ${file.name}`);
            continue;
          }

          await supabase.from("entrega_tarefa").insert({
            id_tarefa,
            id_aluno,
            caminho_arquivo: path,
            status: "ENVIADA",
          });
        }

        alert("Arquivos enviados com sucesso!");
        modal.remove();
        document.body.classList.remove("modal-open");
        router.navigate(`/tarefas?disc=${id_disciplina}`);
      });

      btnFechar.addEventListener("click", () => {
        const wrapper = modal.querySelector(".modal-content-wrapper");
        modal.style.opacity = "0";
        wrapper.style.transform = "scale(0.7)";
        wrapper.style.opacity = "0";

        setTimeout(() => {
          modal.remove();
          document.body.classList.remove("modal-open");
        }, 300);
      });
    }
  },
};
