import Utils from "../../utils.js";
import { deletarDisciplina } from "../../models/prof/profDisciplinaModel.js";

// Function to capitalize first letter of each word
function formatDisciplineName(name) {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
    
    // Format the discipline name: first letter of each word uppercase, rest lowercase
    const disciplinaNome = formatDisciplineName(d.nome);
    el.querySelector(".__nome").textContent = disciplinaNome;
    
    el.querySelector(".__codigo").textContent = d.codigo_matricula;
    
    // Fix the selector to match the actual HTML elements
    const openLink = el.querySelector(".__open");
    const alunosLink = el.querySelector(".__alunos");
    const pedidosLink = el.querySelector(".__pedidos");
    
    if (openLink) {
      openLink.setAttribute(
        "href",
        `/proftarefas/${d.id_disciplina}`
      );
      // Add the data-navigo attribute for proper routing
      openLink.setAttribute("data-navigo", "");
    }
    
    if (alunosLink) {
      alunosLink.setAttribute(
        "href",
        `/profalunos/${d.id_disciplina}`
      );
      // Add the data-navigo attribute for proper routing
      alunosLink.setAttribute("data-navigo", "");
    }
    
    if (pedidosLink) {
      pedidosLink.setAttribute(
        "href",
        `/profpedidos/${d.id_disciplina}`
      );
      // Add the data-navigo attribute for proper routing
      pedidosLink.setAttribute("data-navigo", "");
    }
    
    // Add delete button handler
    const deleteButton = el.querySelector(".__delete");
    if (deleteButton) {
      deleteButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Use the new confirmation modal
        Utils.showConfirmationModal(
          "Deletar disciplina?",
          `Tem certeza que deseja deletar a disciplina "${disciplinaNome}"?\n\nEsta ação não pode ser desfeita e todas as tarefas e matrículas serão perdidas.`,
          "Deletar disciplina",
          "Cancelar"
        ).then((confirmed) => {
          if (!confirmed) return;
          
          deletarDisciplina(d.id_disciplina)
            .then(() => {
              Utils.showMessageToast(
                "success",
                "Disciplina deletada!",
                `A disciplina "${disciplinaNome}" foi removida com sucesso.`,
                3000
              );
              // Reload the list
              const event = new CustomEvent("reloadDisciplinas");
              window.dispatchEvent(event);
            })
            .catch((error) => {
              console.error("Erro ao deletar disciplina:", error);
              Utils.showMessageToast(
                "error",
                "Erro ao deletar",
                error.message,
                5000
              );
            });
        });
      });
    }
    
    container.appendChild(el);
  });
  
  // If no disciplines, show a message
  if (disciplinas.length === 0) {
    container.innerHTML = `<div class="text-gray-500 text-center p-8">Nenhuma disciplina cadastrada</div>`;
  }
}