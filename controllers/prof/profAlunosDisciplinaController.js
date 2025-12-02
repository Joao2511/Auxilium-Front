import { router } from "../../app.js";
import {
  listarAlunosMatriculados,
  removerAluno,
} from "../../models/prof/profAlunosDisciplinaModel.js";
import Utils from "../../utils.js";

export default {
  async index(params) {
    const app = document.getElementById("app");
    const res = await fetch("pages/prof/profalunos_disciplina.html");
    app.innerHTML = await res.text();

    // Get discipline ID
    let id_disciplina;

    if (params && params.data && params.data.disc) {
      id_disciplina = parseInt(params.data.disc, 10);
    } else if (params && params.disc) {
      id_disciplina = parseInt(params.disc, 10);
    } else {
      const paramsString = window.location.hash.split("?")[1];
      if (paramsString) {
        const urlParams = new URLSearchParams(paramsString);
        const discParam = urlParams.get("disc");
        if (discParam) {
          id_disciplina = parseInt(discParam, 10);
        }
      }
    }

    if (!id_disciplina || isNaN(id_disciplina)) {
      app.innerHTML = `
        <div class="p-8 bg-red-50 rounded-2xl border-2 border-red-200 text-center">
          <p class="text-red-600 font-semibold">Disciplina inválida.</p>
        </div>
      `;
      return;
    }

    const lista = document.getElementById("listaAlunos");
    const searchInput = document.getElementById("searchAlunos");
    let alunosCache = [];

    async function carregarAlunos() {
      try {
        alunosCache = await listarAlunosMatriculados(id_disciplina);
        renderizarAlunos(alunosCache);
        
        // Update counter
        const countElement = document.getElementById("alunosCount");
        if (countElement) {
          countElement.textContent = alunosCache.length;
        }
      } catch (error) {
        console.error("Erro ao carregar alunos:", error);
        lista.innerHTML = `
          <div class="text-red-500 p-4 text-center">
            Erro ao carregar alunos: ${error.message}
          </div>
        `;
      }
    }

    function renderizarAlunos(alunos) {
      if (!alunos || alunos.length === 0) {
        lista.innerHTML = `
          <div class="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 text-center">
            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <p class="text-gray-600 font-medium">Nenhum aluno matriculado</p>
            <p class="text-sm text-gray-500 mt-2">Aguarde as solicitações de matrícula.</p>
          </div>
        `;
        return;
      }

      const html = alunos
        .map(
          (a) => `
        <div class="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-purple-300 transition-all" data-aluno-id="${a.id_usuario}">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <h4 class="text-lg font-bold text-gray-900 mb-1 truncate">${a.nome}</h4>
              <div class="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span class="truncate">${a.email}</span>
              </div>
              <div class="flex items-center space-x-2 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Matriculado em ${new Date(a.data_inscricao).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
            <div class="flex-shrink-0">
              <button class="btn-remover bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:shadow-lg transition-all active:scale-95 whitespace-nowrap">
                🗑️ Remover
              </button>
            </div>
          </div>
        </div>
      `
        )
        .join("");

      lista.innerHTML = html;

      // Add event listeners
      document.querySelectorAll(".btn-remover").forEach((btn, index) => {
        btn.addEventListener("click", () => handleRemover(alunos[index]));
      });
    }

    async function handleRemover(aluno) {
      // Show confirmation modal
      const confirmar = confirm(
        `Tem certeza que deseja remover ${aluno.nome} da disciplina?\n\nEsta ação não pode ser desfeita.`
      );

      if (!confirmar) return;

      try {
        await removerAluno(aluno.id_usuario, id_disciplina);
        Utils.showMessageToast(
          "success",
          "Aluno removido!",
          `${aluno.nome} foi removido da disciplina.`,
          3000
        );
        await carregarAlunos();
      } catch (error) {
        console.error("Erro ao remover aluno:", error);
        Utils.showMessageToast("error", "Erro ao remover", error.message, 5000);
      }
    }

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (!searchTerm) {
          renderizarAlunos(alunosCache);
        } else {
          const filtered = alunosCache.filter(
            (a) =>
              a.nome.toLowerCase().includes(searchTerm) ||
              a.email.toLowerCase().includes(searchTerm)
          );
          renderizarAlunos(filtered);
        }
      });
    }

    await carregarAlunos();
  },
};
