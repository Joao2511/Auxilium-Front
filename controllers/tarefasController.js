import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";

export default {
  async index() {
    const app = document.getElementById("app");
    const res = await fetch("pages/tarefas.html");
    app.innerHTML = await res.text();

    const lista = document.getElementById("tarefasLista");

    const params = new URLSearchParams(window.location.hash.split("?")[1]);
    const id_disciplina = parseInt(params.get("disc"), 10);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return router.navigate("/login");

    const { data: tarefas, error } = await supabase
      .from("tarefa")
      .select("id_tarefa, titulo, descricao, data_entrega, pontos_maximos")
      .eq("id_disciplina", id_disciplina)
      .order("data_entrega", { ascending: true });

    if (error) {
      lista.innerHTML = `<p class="text-red-500">Erro ao buscar tarefas.</p>`;
      console.error(error);
      return;
    }

    lista.innerHTML = "";
    const tpl = document.getElementById("tpl-tarefa-aluno");

    const { data: entregas } = await supabase
      .from("entrega_tarefa")
      .select("id_tarefa, data_submissao, concluida")
      .eq("id_aluno", session.user.id);

    const entregasMap = {};
    entregas?.forEach((e) => (entregasMap[e.id_tarefa] = e));

    tarefas.forEach((t) => {
      const clone = tpl.content.cloneNode(true);
      clone.querySelector(".__titulo").textContent = t.titulo;
      clone.querySelector(".__descricao").textContent =
        t.descricao || "Sem descrição.";
      clone.querySelector(".__pontos").textContent = t.pontos_maximos;

      const data = new Date(t.data_entrega);
      clone.querySelector(".__data").textContent = data.toLocaleDateString();
      clone.querySelector(".__hora").textContent = data.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const entrega = entregasMap[t.id_tarefa];
      const alertBox = clone.querySelector("#alertBox");
      const alertMsg = clone.querySelector(".__alert-msg");
      const btnConcluir = clone.querySelector(".__btn-concluir");
      const inputFile = clone.querySelector(".__file-input");

      const agora = new Date();
      if (!entrega) {
        if (data < agora) {
          alertBox.classList.remove("hidden");
          alertMsg.textContent = "Atividade Atrasada — prazo encerrado.";
        }
      } else if (entrega.concluida) {
        alertBox.classList.remove("hidden");
        alertBox.classList.replace("bg-red-100", "bg-green-100");
        alertBox.classList.replace("text-red-700", "text-green-700");
        alertMsg.textContent = "Atividade Concluída ✅";
        btnConcluir.disabled = true;
        btnConcluir.classList.add("opacity-50", "cursor-not-allowed");
      }

      inputFile.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const filePath = `${session.user.id}/${t.id_tarefa}/${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("entregas")
            .upload(filePath, file, { upsert: true });
          if (uploadError) throw uploadError;

          const { error: insertError } = await supabase
            .from("entrega_tarefa")
            .insert({
              id_tarefa: t.id_tarefa,
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

      btnConcluir.addEventListener("click", async () => {
        try {
          const { error: insertError } = await supabase
            .from("entrega_tarefa")
            .insert({
              id_tarefa: t.id_tarefa,
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

      lista.appendChild(clone);
    });
  },
};
