import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";

export default {
  async index() {
    const app = document.getElementById("app");
    const res = await fetch("pages/tarefas.html");
    app.innerHTML = await res.text();

    const paramsString = window.location.hash.split("?")[1];
    const params = new URLSearchParams(paramsString);
    const id_disciplina = parseInt(params.get("disc"), 10);

    const lista = document.getElementById("listaTarefas");

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
        <div class="modern-card p-4 flex justify-between items-center">
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
            class="bg-[#8E24AA] text-white px-4 py-2 rounded-full font-medium hover:bg-[#7b1fa2] transition"
          >
            Ver / Enviar
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
        "fixed inset-0 bg-black/60 flex items-center justify-center z-50";

      modal.innerHTML = `
    <div class="bg-white dark:bg-dark-800 rounded-2xl p-6 w-11/12 max-w-lg overflow-y-auto max-h-[90vh]">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">${
        tarefa.titulo
      }</h2>
      <p class="text-gray-700 dark:text-gray-300 mb-2">${
        tarefa.descricao || "Sem descrição."
      }</p>
      <p class="text-sm text-gray-500 mb-4">
        <b>Entrega até:</b> ${new Date(
          tarefa.data_entrega
        ).toLocaleString()}<br>
        <b>Pontos:</b> ${tarefa.pontos_maximos}
      </p>

      <div id="listaEntregas" class="space-y-2 mb-4"></div>

      <label class="block mb-2 font-medium text-sm text-gray-700 dark:text-gray-300">
        Anexar arquivos (máx 20 MB cada)
      </label>
      <input id="arquivoInput" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png,.zip" class="mb-4 w-full text-sm" />

      <button id="btnEnviarEntrega"
        class="w-full bg-[#8E24AA] hover:bg-[#7b1fa2] text-white rounded-full py-2 font-medium transition">
        Enviar arquivos
      </button>
      <button id="btnFechar"
        class="mt-3 w-full border border-gray-400 text-gray-700 rounded-full py-2">
        Fechar
      </button>
    </div>
  `;

      document.body.appendChild(modal);

      document.body.classList.add("modal-open");

      const listaEntregas = modal.querySelector("#listaEntregas");
      const btnEnviar = modal.querySelector("#btnEnviarEntrega");
      const btnFechar = modal.querySelector("#btnFechar");

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
        <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-700">
          <p class="text-sm"><b>Arquivo:</b> ${e.caminho_arquivo
            .split("/")
            .pop()}</p>
          <p class="text-sm"><b>Data:</b> ${new Date(
            e.data_submissao
          ).toLocaleString()}</p>
          <p class="text-sm"><b>Status:</b> ${e.status || "Enviado"}</p>
          <p class="text-sm"><b>Nota:</b> ${
            e.nota?.[0]?.nota_valor ?? e.nota_calculada ?? "—"
          }</p>
          ${
            e.nota?.[0]?.observacoes
              ? `<p class="text-sm"><b>Observações:</b> ${e.nota[0].observacoes}</p>`
              : ""
          }
        </div>`
          )
          .join("");
      } else {
        listaEntregas.innerHTML = `<p class="text-gray-500 text-sm">Nenhum arquivo enviado ainda.</p>`;
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
        modal.remove();
        document.body.classList.remove("modal-open");
      });
    }
  },
};
