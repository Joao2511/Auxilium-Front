import { router } from "../../app.js";
import { listarAlunosDaDisciplina } from "../../models/prof/profDisciplinaModel.js";
import {
  criarTarefa,
  listarTarefas,
  deletarTarefa,
} from "../../models/prof/profTarefaModel.js";
import Utils from "../../utils.js";

export default {
  async index(params) {
    const app = document.getElementById("app");
    const res = await fetch("pages/prof/proftarefas.html");
    app.innerHTML = await res.text();

    // Get discipline ID - try multiple methods
    console.log("Router params:", params);
    
    let id_disciplina;
    
    // Method 1: Try to get from router params data (new format)
    if (params && params.data && params.data.disc) {
      id_disciplina = parseInt(params.data.disc, 10);
      console.log("Got discipline ID from router params data:", id_disciplina);
    } 
    // Method 2: Try to get from router params directly (alternative format)
    else if (params && params.disc) {
      id_disciplina = parseInt(params.disc, 10);
      console.log("Got discipline ID from router params directly:", id_disciplina);
    }
    // Method 3: Try to get from URL query parameters (old format)
    else {
      console.log("Full hash:", window.location.hash);
      console.log("Hash parts:", window.location.hash.split("?"));
      
      const paramsString = window.location.hash.split("?")[1];
      console.log("Params string:", paramsString);
      
      if (paramsString) {
        const urlParams = new URLSearchParams(paramsString);
        console.log("URL params object:", urlParams);
        console.log("Disc param:", urlParams.get("disc"));
        
        const discParam = urlParams.get("disc");
        if (discParam) {
          id_disciplina = parseInt(discParam, 10);
          console.log("Parsed discipline ID from query params:", id_disciplina);
        }
      }
    }
    
    // Validate discipline ID
    if (!id_disciplina || isNaN(id_disciplina)) {
      console.error("Invalid discipline ID:", id_disciplina);
      document.getElementById("app").innerHTML = `
        <div class="p-8 bg-red-50 rounded-2xl border-2 border-red-200 text-center">
          <p class="text-red-600 font-semibold">Disciplina inválida.</p>
          <p class="text-red-500 mt-2">ID da disciplina não encontrado ou inválido.</p>
          <p class="text-red-500 mt-2">Hash: ${window.location.hash}</p>
          <p class="text-red-500 mt-2">Params: ${JSON.stringify(params)}</p>
        </div>
      `;
      return;
    }

    const alunosBox = document.getElementById("alunos");
    const lista = document.getElementById("listaTarefas");
    const btn = document.getElementById("btnNovaTarefa");

    async function pintarAlunos() {
      try {
        const alunos = await listarAlunosDaDisciplina(id_disciplina);
        alunosBox.textContent = alunos.length
          ? alunos.map((a) => a.nome).join(", ")
          : "Nenhum aluno ainda.";
      } catch (error) {
        console.error("Erro ao carregar alunos:", error);
        alunosBox.innerHTML = `<span class="text-red-500">Erro ao carregar alunos: ${error.message}</span>`;
      }
    }

    // Setup navigation buttons
    const btnPedidosPendentes = document.getElementById("btnPedidosPendentes");
    const btnListaAlunos = document.getElementById("btnListaAlunos");
    
    if (btnPedidosPendentes) {
      btnPedidosPendentes.setAttribute("href", `/profpedidos?disc=${id_disciplina}`);
      btnPedidosPendentes.setAttribute("data-navigo", "");
    }
    
    if (btnListaAlunos) {
      btnListaAlunos.setAttribute("href", `/profalunos?disc=${id_disciplina}`);
      btnListaAlunos.setAttribute("data-navigo", "");
    }

    async function pintarTarefas() {
      try {
        const dados = await listarTarefas(id_disciplina);
        const tpl = document.getElementById("tpl-tarefa");
        lista.innerHTML = "";
        
        // Check if template exists
        if (!tpl) {
          console.error("Template 'tpl-tarefa' not found");
          lista.innerHTML = `<div class="text-red-500 p-4">Erro ao carregar template de tarefas</div>`;
          return;
        }
        
        // Check if dados is an array
        if (!Array.isArray(dados)) {
          console.error("Dados de tarefas is not an array:", dados);
          lista.innerHTML = `<div class="text-red-500 p-4">Erro nos dados de tarefas</div>`;
          return;
        }
        
        dados.forEach((t) => {
          const el = tpl.content.cloneNode(true);
          el.querySelector(".__titulo").textContent = t.titulo;
          el.querySelector(".__entrega").textContent = new Date(
            t.data_entrega
          ).toLocaleString();
          el.querySelector(".__pontos").textContent = t.pontos_maximos;
          
          // Fix the selector to match the actual HTML element
          const openLink = el.querySelector(".__open");
          if (openLink) {
            openLink.setAttribute(
              "href",
              `/proftarefa?tid=${t.id_tarefa}`
            );
            // Add the data-navigo attribute for proper routing
            openLink.setAttribute("data-navigo", "");
          }
          
          // Add delete button handler
          const deleteBtn = el.querySelector(".__delete");
          if (deleteBtn) {
            deleteBtn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDeletarTarefa(t);
            });
          }
          
          lista.appendChild(el);
        });
        
        // If no tasks, show a message
        if (dados.length === 0) {
          lista.innerHTML = `<div class="text-gray-500 text-center p-8">Nenhuma tarefa cadastrada</div>`;
        }
        
        router.updatePageLinks();
      } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
        lista.innerHTML = `<div class="text-red-500 p-4">Erro ao carregar tarefas: ${error.message}</div>`;
      }
    }

    async function handleDeletarTarefa(tarefa) {
      const confirmar = confirm(
        `Tem certeza que deseja deletar a tarefa "${tarefa.titulo}"?\n\nEsta ação não pode ser desfeita e todas as entregas serão perdidas.`
      );

      if (!confirmar) return;

      try {
        await deletarTarefa(tarefa.id_tarefa);
        Utils.showMessageToast(
          "success",
          "Tarefa deletada!",
          `A tarefa "${tarefa.titulo}" foi removida com sucesso.`,
          3000
        );
        await pintarTarefas();
      } catch (error) {
        console.error("Erro ao deletar tarefa:", error);
        Utils.showMessageToast(
          "error",
          "Erro ao deletar",
          error.message,
          5000
        );
      }
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
