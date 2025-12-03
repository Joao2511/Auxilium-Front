import { router } from "../../app.js";
import {
  listarDisciplinasDoProfessor,
  criarDisciplina,
} from "../../models/prof/profDisciplinaModel.js";
import { renderLista } from "../../views/prof/profDisciplinasView.js";

let currentHandler = null;

export default {
  async index() {
    const app = document.getElementById("app");
    const res = await fetch("pages/prof/profdisciplinas.html");
    app.innerHTML = await res.text();

    // Wait a bit for the template to be available in the DOM
    await new Promise(resolve => setTimeout(resolve, 0));

    const lista = document.getElementById("listaDisciplinas");
    const btn = document.getElementById("btnNovaDisc");
    
    // Modal elements
    const modal = document.getElementById("novaDisciplinaModal");
    const fecharModal = document.getElementById("fecharModal");
    const cancelarDisciplina = document.getElementById("cancelarDisciplina");
    const formNovaDisciplina = document.getElementById("formNovaDisciplina");

    // Remove previous listener if it exists
    if (currentHandler) {
      window.removeEventListener("reloadDisciplinas", currentHandler);
    }

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

    // Update current handler reference
    currentHandler = carregar;

    // Open modal when clicking "Nova disciplina" button
    btn.addEventListener("click", () => {
      modal.classList.remove("hidden");
      document.body.classList.add("no-scroll");
      
      // Focus on the input field
      setTimeout(() => {
        const nomeInput = document.getElementById("nomeDisciplina");
        if (nomeInput) nomeInput.focus();
      }, 100);
    });

    // Close modal functions
    const fecharModalFuncao = () => {
      modal.classList.add("hidden");
      document.body.classList.remove("no-scroll");
      // Clear the form
      const nomeInput = document.getElementById("nomeDisciplina");
      if (nomeInput) nomeInput.value = "";
    };

    // Close modal events
    fecharModal.addEventListener("click", fecharModalFuncao);
    cancelarDisciplina.addEventListener("click", fecharModalFuncao);

    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        fecharModalFuncao();
      }
    });

    // Handle form submission
    formNovaDisciplina.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const nomeInput = document.getElementById("nomeDisciplina");
      const nome = nomeInput.value.trim();
      
      if (!nome) {
        // Show error message
        const errorMessage = document.createElement("div");
        errorMessage.className = "text-red-500 text-sm mt-1";
        errorMessage.textContent = "Por favor, informe o nome da disciplina";
        // Check if error message already exists
        if (!nomeInput.parentNode.querySelector(".text-red-500")) {
          nomeInput.parentNode.appendChild(errorMessage);
        }
        return;
      }

      // Remove any existing error message
      const existingError = nomeInput.parentNode.querySelector(".text-red-500");
      if (existingError) {
        existingError.remove();
      }

      try {
        // Disable submit button during submission
        const salvarBtn = document.getElementById("salvarDisciplina");
        const originalText = salvarBtn.innerHTML;
        salvarBtn.innerHTML = '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>';
        salvarBtn.disabled = true;

        const novaDisciplina = await criarDisciplina(nome);
        console.log("Disciplina criada:", novaDisciplina); // Debug log
        
        // Re-enable submit button
        salvarBtn.innerHTML = originalText;
        salvarBtn.disabled = false;
        
        // Close modal and clear form
        fecharModalFuncao();
        
        // Reload the list
        await carregar();
      } catch (error) {
        console.error("Erro ao criar disciplina:", error);
        
        // Re-enable submit button
        const salvarBtn = document.getElementById("salvarDisciplina");
        salvarBtn.innerHTML = "Criar Disciplina";
        salvarBtn.disabled = false;
        
        // Show error message
        alert(`Erro ao criar disciplina: ${error.message}`);
      }
    });

    // Listen for reload event from delete action
    window.addEventListener("reloadDisciplinas", carregar);

    await carregar();
  },
};