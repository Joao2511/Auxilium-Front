import { router } from "../../app.js";
import { listarAlunosDaDisciplina } from "../../models/prof/profDisciplinaModel.js";
import {
  criarTarefa,
  listarTarefas,
} from "../../models/prof/profTarefaModel.js";
import Utils from "../../utils.js";

export default {
  async index() {
    const app = document.getElementById("app");
    const res = await fetch("pages/prof/proftarefas.html");
    app.innerHTML = await res.text();

    const paramsString = window.location.hash.split("?")[1];
    const params = new URLSearchParams(paramsString);
    const id_disciplina = parseInt(params.get("disc"), 10);

    const alunosBox = document.getElementById("alunos");
    const lista = document.getElementById("listaTarefas");
    const btn = document.getElementById("btnNovaTarefa");

    async function pintarAlunos() {
      const alunos = await listarAlunosDaDisciplina(id_disciplina);
      alunosBox.textContent = alunos.length
        ? alunos.map((a) => a.nome).join(", ")
        : "Nenhum aluno ainda.";
    }

    async function pintarTarefas() {
      const dados = await listarTarefas(id_disciplina);
      const tpl = document.getElementById("tpl-tarefa");
      lista.innerHTML = "";
      dados.forEach((t) => {
        const el = tpl.content.cloneNode(true);
        el.querySelector(".__titulo").textContent = t.titulo;
        el.querySelector(".__entrega").textContent = new Date(
          t.data_entrega
        ).toLocaleString();
        el.querySelector(".__pontos").textContent = t.pontos_maximos;
        el.querySelector("[data-open]").setAttribute(
          "href",
          `/proftarefa?tid=${t.id_tarefa}`
        );
        lista.appendChild(el);
      });
      router.updatePageLinks();
    }

    btn.addEventListener("click", () => {
      document.getElementById("modalNovaTarefa").classList.remove("hidden");
    });

    document
      .getElementById("btnCancelarTarefa")
      .addEventListener("click", () => {
        document.getElementById("modalNovaTarefa").classList.add("hidden");
      });

    document
      .getElementById("btnSalvarTarefa")
      .addEventListener("click", async () => {
        const titulo = document.getElementById("tarefaTitulo").value.trim();
        const descricao = document
          .getElementById("tarefaDescricao")
          .value.trim();
        const dataStr = document.getElementById("tarefaData").value;
        const pontos = parseInt(
          document.getElementById("tarefaPontos").value,
          10
        );

        if (!titulo) {
          Utils.showMessageToast(
            "warning",
            "Título obrigatório",
            "Digite o título da tarefa.",
            3000
          );
          return;
        }

        const data_entrega = dataStr
          ? new Date(dataStr)
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        try {
          await criarTarefa({
            id_disciplina,
            titulo,
            descricao,
            data_entrega,
            pontos_maximos: pontos || 100,
          });

          Utils.showMessageToast(
            "success",
            "Tarefa criada",
            "Tarefa criada com sucesso!",
            3000
          );
          document.getElementById("modalNovaTarefa").classList.add("hidden");
          await pintarTarefas();
        } catch (e) {
          console.error(e);
          Utils.showMessageToast(
            "error",
            "Erro ao criar tarefa",
            "Erro ao criar tarefa.",
            5000
          );
        }
      });

      await pintarAlunos();
    await pintarTarefas();
  },
};
