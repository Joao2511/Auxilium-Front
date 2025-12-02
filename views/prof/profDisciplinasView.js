import Utils from "../../utils.js";
import { deletarDisciplina } from "../../models/prof/profDisciplinaModel.js";

export function renderLista(container, disciplinas) {
  container.innerHTML = "";
  const tpl = document.getElementById("tpl-disciplina");
  
  // Check if template exists
  if (!tpl) {
    console.error("Template 'tpl-disciplina' not found");
    container.innerHTML = `<div class="text-red-500 p-4">Erro ao carregar template</div>`;
    return;
  }
  
  // Check if disciplinas is an array
  if (!Array.isArray(disciplinas)) {
    console.error("Disciplinas is not an array:", disciplinas);
    container.innerHTML = `<div class="text-red-500 p-4">Erro nos dados</div>`;
    return;
  }
  
  disciplinas.forEach((d) => {
    const el = tpl.content.cloneNode(true);
    el.querySelector(".__nome").textContent = d.nome;
    el.querySelector(".__codigo").textContent = d.codigo_matricula;
    
    // Fix the selector to match the actual HTML elements
    const openLink = el.querySelector(".__open");
    const copyButton = el.querySelector(".__copy");
    
    if (openLink) {
      openLink.setAttribute(
        "href",
        `/proftarefas/${d.id_disciplina}`
      );
      // Add the data-navigo attribute for proper routing
      openLink.setAttribute("data-navigo", "");
    }
    
    if (copyButton) {
      copyButton.addEventListener("click", async () => {
        await navigator.clipboard.writeText(d.codigo_matricula);
        Utils.showMessageToast(
          "success",
          "Código copiado",
          "Código copiado!",
          3000
        );
      });
    }
    
    // Add delete button handler
    const deleteButton = el.querySelector(".__delete");
    if (deleteButton) {
      deleteButton.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const confirmar = confirm(
          `Tem certeza que deseja deletar a disciplina "${d.nome}"?\n\nEsta ação não pode ser desfeita e todas as tarefas e matrículas serão perdidas.`
        );
        
        if (!confirmar) return;
        
        try {
          await deletarDisciplina(d.id_disciplina);
          Utils.showMessageToast(
            "success",
            "Disciplina deletada!",
            `A disciplina "${d.nome}" foi removida com sucesso.`,
            3000
          );
          // Reload the list
          const event = new CustomEvent("reloadDisciplinas");
          window.dispatchEvent(event);
        } catch (error) {
          console.error("Erro ao deletar disciplina:", error);
          Utils.showMessageToast(
            "error",
            "Erro ao deletar",
            error.message,
            5000
          );
        }
      });
    }
    
    container.appendChild(el);
  });
  
  // If no disciplines, show a message
  if (disciplinas.length === 0) {
    container.innerHTML = `<div class="text-gray-500 text-center p-8">Nenhuma disciplina cadastrada</div>`;
  }
}