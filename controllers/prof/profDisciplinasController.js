import { router } from "../../app.js";
import {
  listarDisciplinasDoProfessor,
  criarDisciplina,
} from "../../models/prof/profDisciplinaModel.js";
import { renderLista } from "../../views/prof/profDisciplinasView.js";

export default {
  async index() {
    const app = document.getElementById("app");
    const res = await fetch("pages/prof/profdisciplinas.html");
    app.innerHTML = await res.text();

    // Wait a bit for the template to be available in the DOM
    await new Promise(resolve => setTimeout(resolve, 0));

    const lista = document.getElementById("listaDisciplinas");
    const btn = document.getElementById("btnNovaDisc");

    const carregar = async () => {
      try {
        const dados = await listarDisciplinasDoProfessor();
        console.log("Disciplinas carregadas:", dados); // Debug log
        renderLista(lista, dados);
        router.updatePageLinks();
      } catch (error) {
        console.error("Erro ao carregar disciplinas:", error);
        lista.innerHTML = `<div class="text-red-500 p-4">Erro ao carregar disciplinas: ${error.message}</div>`;
      }
    };

    btn.addEventListener("click", async () => {
      const nome = prompt("Nome da disciplina:");
      if (!nome) return;
      
      try {
        const novaDisciplina = await criarDisciplina(nome);
        console.log("Disciplina criada:", novaDisciplina); // Debug log
        await carregar();
      } catch (error) {
        console.error("Erro ao criar disciplina:", error);
        alert(`Erro ao criar disciplina: ${error.message}`);
      }
    });

    // Listen for reload event from delete action
    window.addEventListener("reloadDisciplinas", carregar);

    await carregar();
  },
};