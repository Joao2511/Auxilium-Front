import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";
import Utils from "../utils.js";

export default {
  async index() {
    const app = document.getElementById("app");
    const res = await fetch("pages/disciplinas.html");
    app.innerHTML = await res.text();

    const lista = document.getElementById("disciplinasLista");

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login.html";
      return;
    }

    async function carregarDisciplinas() {
      const { data: disciplinas, error } = await supabase
        .from("usuario_disciplina")
        .select(
          `
          id_disciplina,
          disciplina:disciplina (
            id_disciplina,
            nome,
            codigo_matricula,
            professor:usuario!disciplina_id_professor_fkey ( nome_completo )
          )
        `
        )
        .eq("id_usuario", session.user.id);

      if (error) {
        console.error("Erro ao buscar disciplinas:", error);
        lista.innerHTML = `<p class="text-red-500">Erro ao buscar disciplinas.</p>`;
        return;
      }

      let html = "";

      if (disciplinas && disciplinas.length > 0) {
        // Update counter
        const countElement = document.getElementById('disciplinasCount');
        if (countElement) {
          countElement.textContent = disciplinas.length;
        }

        html += disciplinas
          .map(
            (d) => `
          <div class="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group">
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 min-w-0">
                <h4 class="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-1 truncate">${d.disciplina.nome}</h4>
                <div class="flex items-center space-x-2 text-sm text-gray-600 min-w-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span class="truncate">Prof. ${d.disciplina.professor?.nome_completo || "—"}</span>
                </div>
                <div class="mt-2">
                  <span class="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full truncate max-w-full">${d.disciplina.codigo_matricula || "—"}</span>
                </div>
              </div>
              <a href="/tarefas?disc=${d.disciplina.id_disciplina}" data-navigo
                class="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full font-semibold text-sm hover:shadow-lg transition-all active:scale-95 flex-shrink-0 whitespace-nowrap">
                <span>Ver tarefas</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </a>
            </div>
          </div>
        `
          )
          .join("");
      } else {
        html += `
          <div class="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 text-center">
            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <p class="text-gray-600 font-medium mb-2">
              Você ainda não está matriculado em nenhuma disciplina.
            </p>
            <p class="text-sm text-gray-500">
              Use o código fornecido pelo professor para entrar em uma disciplina.
            </p>
          </div>
        `;
      }

      html += `
        <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200 mt-4">
          <button id="btnEntrar" class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold text-sm hover:shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Entrar em uma disciplina</span>
          </button>
          <div id="formEntrar" class="mt-4 hidden">
            <input id="codigoDisciplina" type="text" placeholder="Digite o código da disciplina"
              class="border-2 border-gray-300 rounded-full px-4 py-3 w-full text-center font-medium
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            <button id="btnConfirmar" class="mt-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold w-full hover:shadow-lg transition-all active:scale-95">
              Confirmar
            </button>
            <p id="msgErro" class="text-red-500 text-sm mt-3 font-medium hidden"></p>
          </div>
        </div>
      `;

      lista.innerHTML = html;
      router.updatePageLinks();

      const btnEntrar = document.getElementById("btnEntrar");
      const formEntrar = document.getElementById("formEntrar");
      const btnConfirmar = document.getElementById("btnConfirmar");
      const msgErro = document.getElementById("msgErro");

      btnEntrar.addEventListener("click", () => {
        formEntrar.classList.toggle("hidden");
      });

      btnConfirmar.addEventListener("click", async () => {
        msgErro.classList.add("hidden");
        const codigo = document.getElementById("codigoDisciplina").value.trim();

        if (!codigo) {
          msgErro.textContent = "Digite o código da disciplina.";
          msgErro.classList.remove("hidden");
          return;
        }

        const { data: disc, error: errDisc } = await supabase
          .from("disciplina")
          .select("id_disciplina, nome")
          .eq("codigo_matricula", codigo)
          .single();

        if (errDisc || !disc) {
          msgErro.textContent = "Código inválido ou disciplina não encontrada.";
          msgErro.classList.remove("hidden");
          return;
        }

        const { data: jaMatriculado } = await supabase
          .from("usuario_disciplina")
          .select("id_disciplina")
          .eq("id_usuario", session.user.id)
          .eq("id_disciplina", disc.id_disciplina);

        if (jaMatriculado && jaMatriculado.length > 0) {
          msgErro.textContent = "Você já está matriculado nesta disciplina.";
          msgErro.classList.remove("hidden");
          return;
        }

        const { error: insertError } = await supabase
          .from("usuario_disciplina")
          .insert({
            id_usuario: session.user.id,
            id_disciplina: disc.id_disciplina,
          });

        if (insertError) {
          msgErro.textContent = "Erro ao entrar: " + insertError.message;
          msgErro.classList.remove("hidden");
          return;
        }

        Utils.showMessageToast(
          "success",
          "Matrícula realizada!",
          `Você foi matriculado com sucesso em ${disc.nome}.`,
          3000
        );
        await carregarDisciplinas();
      });
    }

    await carregarDisciplinas();
  },
};
