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
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-700 mb-1">Nenhum aluno matriculado</h3>
            <p class="text-gray-500 text-sm">Não há alunos matriculados nesta disciplina.</p>
          </div>
        `;
        return;
      }

      let html = "";
      alunos.forEach((a, index) => {
        html += `
          <div class="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold truncate">${a.nome}</h4>
                <p class="text-xs text-gray-500 truncate">${a.email}</p>
              </div>
              <div class="flex gap-2 flex-shrink-0">
                <button class="btn-remover px-3 py-2 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-md transition text-sm" data-index="${index}">
                  Remover
                </button>
              </div>
            </div>
          </div>
        `;
      });

      lista.innerHTML = html;

      // Add event listeners
      document.querySelectorAll(".btn-remover").forEach((btn, index) => {
        btn.addEventListener("click", () => handleRemover(alunos[index]));
      });
    }

    function handleRemover(aluno) {
      // Use the new confirmation modal
      Utils.showConfirmationModal(
        "Remover aluno?",
        `Tem certeza que deseja remover ${aluno.nome} da disciplina?\n\nEsta ação não pode ser desfeita.`,
        "Remover aluno",
        "Cancelar"
      ).then((confirmed) => {
        if (!confirmed) return;

        removerAluno(aluno.id_usuario, id_disciplina)
          .then(() => {
            Utils.showMessageToast(
              "success",
              "Aluno removido!",
              `${aluno.nome} foi removido da disciplina.`,
              3000
            );
            return carregarAlunos();
          })
          .catch((error) => {
            console.error("Erro ao remover aluno:", error);
            Utils.showMessageToast("error", "Erro ao remover", error.message, 5000);
          });
      });
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