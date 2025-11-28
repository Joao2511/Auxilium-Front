import { router } from "../../app.js";
import { fetchProfessorStats } from "../../models/prof/profHomeModel.js";

async function loadView(viewName) {
  const app = document.getElementById("app");
  app.innerHTML = "<h1>Carregando...</h1>";

  try {
    const response = await fetch(`pages/${viewName}.html`);
    if (!response.ok) throw new Error("Página não encontrada");

    const html = await response.text();
    app.innerHTML = html;

    router.updatePageLinks();

    // If this is the home page, fetch and display stats
    if (viewName === "prof/profhome") {
      await updateStats();
    }

    console.log(`[Navigo] Links atualizados para ${viewName}`);
  } catch (error) {
    console.error("Erro ao carregar página:", error);
    app.innerHTML = "<h1>Erro ao carregar página</h1>";
  }
}

async function updateStats() {
  try {
    const stats = await fetchProfessorStats();
    
    // Update the statistics in the UI
    const disciplinasElement = document.querySelector('.bg-purple-50 .text-purple-600.font-bold.text-2xl');
    const tarefasElement = document.querySelector('.bg-indigo-50 .text-indigo-600.font-bold.text-2xl');
    
    if (disciplinasElement) {
      disciplinasElement.textContent = stats.disciplinasCount;
    }
    
    if (tarefasElement) {
      tarefasElement.textContent = stats.tarefasCount;
    }
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

export default {
  index: () => {
    loadView("prof/profhome");
  },
};