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

    const lista = document.getElementById("listaDisciplinas");
    const btn = document.getElementById("btnNovaDisc");

    const carregar = async () => {
      const dados = await listarDisciplinasDoProfessor();
      renderLista(lista, dados);
      router.updatePageLinks();
    };

    btn.addEventListener("click", async () => {
      const nome = prompt("Nome da disciplina:");
      if (!nome) return;
      await criarDisciplina(nome);
      await carregar();
    });

    await carregar();
  },
};
