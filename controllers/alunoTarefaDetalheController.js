import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";

export default {
  async index() {
    const app = document.getElementById("app");
    const res = await fetch("pages/tarefa_detalhe.html");
    app.innerHTML = await res.text();

    const hash = window.location.hash;
    const paramsString = hash.split("?")[1] || "";
    const params = new URLSearchParams(paramsString);
    const id_tarefa = parseInt(params.get("tid"), 10);
    if (!id_tarefa || isNaN(id_tarefa)) {
      alert("Tarefa inválida.");
      return router.navigate("/disciplinas");
    }

    const card = document.getElementById("tarefaWrapper");
    const btnEnviar = document.getElementById("btnEnviar");
    const listaEntregas = document.getElementById("entregasLista");
    const btnVoltar = document.getElementById("btnVoltar");

    btnVoltar.addEventListener("click", () => history.back());

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = "/login.html";
      return;
    }

    const id_aluno = session.user.id;

    const { data: tarefa, error: tarefaError } = await supabase
      .from("tarefa")
      .select(
        `
    id_tarefa,
    titulo,
    descricao,
    data_entrega,
    pontos_maximos,
    entrega_tarefa (
      id_entrega,
      caminho_arquivo,
      data_submissao,
      status,
      nota_calculada,
      nota:nota (
        nota_valor,
        observacoes
      )
    )
  `
      )
      .eq("id_tarefa", id_tarefa)
      .eq("entrega_tarefa.id_aluno", id_aluno)
      .single();

    if (tarefaError || !tarefa) {
      alert("Erro ao carregar tarefa.");
      console.error(tarefaError);
      return;
    }

    card.querySelector(".__titulo").textContent = tarefa.titulo;
    card.querySelector(".__descricao").textContent =
      tarefa.descricao || "Sem descrição.";
    card.querySelector(".__pontos").textContent = tarefa.pontos_maximos;
    const dt = new Date(tarefa.data_entrega);
    card.querySelector(".__data").textContent = dt.toLocaleDateString();
    card.querySelector(".__hora").textContent = dt.toLocaleTimeString();

    if (new Date() > dt) {
      document.getElementById("alertAtraso").classList.remove("hidden");
    }

    const { data: entregas } = await supabase
      .from("entrega_tarefa")
      .select(
        "id_entrega, caminho_arquivo, data_submissao, status, nota_calculada"
      )
      .eq("id_tarefa", id_tarefa)
      .eq("id_aluno", id_aluno)
      .order("data_submissao", { ascending: true });

    if (tarefa.entrega_tarefa?.length) {
      listaEntregas.innerHTML = tarefa.entrega_tarefa
        .map(
          (e) => `
        <div class="p-2 border rounded-lg bg-gray-50 dark:bg-dark-700">
          <p><b>Arquivo:</b> ${e.caminho_arquivo.split("/").pop()}</p>
          <p><b>Enviado:</b> ${new Date(e.data_submissao).toLocaleString()}</p>
          <p><b>Status:</b> ${e.status || "—"}</p>
          <p><b>Nota:</b> ${e.nota?.nota_valor ?? e.nota_calculada ?? "—"}</p>
          ${
            e.nota?.observacoes
              ? `<p><b>Observações:</b> ${e.nota.observacoes}</p>`
              : ""
          }
        </div>
      `
        )
        .join("");
    } else {
      listaEntregas.innerHTML = `<p class="text-gray-500">Nenhuma entrega enviada ainda.</p>`;
    }

    btnEnviar.addEventListener("click", async () => {
      const file = document.getElementById("arquivoInput").files[0];
      if (!file) return alert("Selecione um arquivo primeiro.");

      const path = `${id_aluno}/${id_tarefa}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("entregas")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        console.error(uploadError);
        return alert("Erro ao enviar arquivo.");
      }

      const { error: insertError } = await supabase
        .from("entrega_tarefa")
        .insert({
          id_tarefa,
          id_aluno,
          caminho_arquivo: path,
          status: "ENVIADA",
        });

      if (insertError) {
        console.error(insertError);
        alert("Erro ao registrar entrega.");
      } else {
        alert("Entrega enviada com sucesso!");
        router.navigate(`/tarefa?tid=${id_tarefa}`);
      }
    });
  },
};
