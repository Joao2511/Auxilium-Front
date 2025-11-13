import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";

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
        html += disciplinas
          .map(
            (d) => `
          <div class="p-4 bg-white dark:bg-dark-800 rounded-lg shadow flex justify-between items-center modern-card fade-in">
            <div>
              <p class="text-lg font-semibold">${d.disciplina.nome}</p>
              <p class="text-sm text-gray-500">
                Prof. ${d.disciplina.professor?.nome_completo || "—"}
              </p>
            </div>
            <a href="/tarefas?disc=${d.disciplina.id_disciplina}" data-navigo
              class="text-[#8E24AA] font-medium hover:underline">
              Ver tarefas
            </a>
          </div>
        `
          )
          .join("");
      } else {
        html += `
          <div class="p-6 bg-white dark:bg-dark-800 rounded-lg shadow text-center modern-card fade-in">
            <p class="text-gray-600 dark:text-gray-300 mb-3">
              Você ainda não está matriculado em nenhuma disciplina.
            </p>
          </div>
        `;
      }

      html += `
        <div class="p-6 bg-white dark:bg-dark-800 rounded-lg shadow text-center modern-card mt-5 fade-in">
          <button id="btnEntrar" class="bg-[#8E24AA] text-white px-5 py-2 rounded-full font-medium">
            Entrar em uma disciplina
          </button>
          <div id="formEntrar" class="mt-5 hidden">
            <input id="codigoDisciplina" type="text" placeholder="Digite o código da disciplina"
       class="border border-gray-300 rounded-full px-4 py-2 w-full text-center
              focus:outline-none focus:ring-2 focus:ring-[#8E24AA]" />
      <button id="btnConfirmar" class="mt-3 bg-[#8E24AA] text-white px-5 py-2 rounded-full font-medium w-full">
              Confirmar
  </button>
            <p id="msgErro" class="text-red-500 text-sm mt-2 hidden"></p>
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

        alert(`Matriculado com sucesso em ${disc.nome}!`);
        await carregarDisciplinas();
      });
    }

    await carregarDisciplinas();
  },
};
