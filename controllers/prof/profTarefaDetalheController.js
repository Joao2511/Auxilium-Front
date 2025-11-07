import { router } from "../../app.js";
import {
  listarEntregasDaTarefa,
  avaliarEntrega,
} from "../../models/prof/profTarefaModel.js";
import { supabase } from "../../utils/supabaseClient.js";

async function getPublicUrl(path) {
  const { data } = supabase.storage.from("entregas").getPublicUrl(path);
  return data.publicUrl;
}

export default {
  async index() {
    const app = document.getElementById("app");
    const res = await fetch("pages/prof/proftarefa_detalhe.html");
    app.innerHTML = await res.text();

    const paramsString = window.location.hash.split("?")[1];
    const params = new URLSearchParams(paramsString);
    const id_tarefa = parseInt(params.get("tid"), 10);

    if (!id_tarefa || isNaN(id_tarefa)) {
      console.error("⚠️ ID da tarefa inválido:", params.get("tid"));
      alert("Tarefa inválida. Retornando...");
      return router.navigate("/profdisciplinas");
    }

    const lista = document.getElementById("listaEntregas");
    const tpl = document.getElementById("tpl-entrega");

    async function pintar() {
      lista.innerHTML = "";
      const entregas = await listarEntregasDaTarefa(id_tarefa);

      for (const e of entregas) {
        const el = tpl.content.cloneNode(true);

        el.querySelector(".__aluno").textContent =
          e.usuario?.nome_completo || e.id_aluno;

        const statusEl = el.querySelector(".__status");
        statusEl.textContent = e.status || "—";
        if (e.status === "AVALIADA") statusEl.classList.add("text-green-600");
        else if (e.status === "ENVIADA")
          statusEl.classList.add("text-blue-600");
        else statusEl.classList.add("text-gray-400");

        el.querySelector(".__quando").textContent = e.data_submissao
          ? new Date(e.data_submissao).toLocaleString()
          : "—";

        const href = await getPublicUrl(e.caminho_arquivo);
        el.querySelector(".__download").setAttribute("href", href);

        const notaInput = el.querySelector(".__nota");
        const obsInput = el.querySelector(".__obs");

        if (e.nota) {
          notaInput.value = e.nota.nota_valor ?? "";
          obsInput.value = e.nota.observacoes ?? "";
        }

        el.querySelector(".__salvar").addEventListener("click", async () => {
          const nota = parseFloat(notaInput.value);
          if (Number.isNaN(nota)) return alert("Informe uma nota válida.");

          await avaliarEntrega({
            id_entrega: e.id_entrega,
            nota_valor: nota,
            observacoes: obsInput.value || null,
          });

          alert("✅ Avaliação salva com sucesso!");
          await pintar();
        });

        lista.appendChild(el);
      }

      router.updatePageLinks();
    }

    await pintar();
  },
};
