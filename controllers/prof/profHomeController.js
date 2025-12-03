import { router } from "../../app.js";
import { fetchProfessorStats } from "../../models/prof/profHomeModel.js";

async function loadView(viewName) {
  const app = document.getElementById("app");
  
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
    const statsSection = document.querySelector('.bg-white.rounded-3xl.p-6.shadow-sm:nth-child(2)');
    const quickActionsSection = document.querySelector('.bg-white.rounded-3xl.p-6.shadow-sm:nth-child(1)');
    
    if (statsSection) {
      statsSection.innerHTML = `
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">Estatísticas</h3>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-purple-50 rounded-2xl p-4">
            <div class="text-purple-600 font-bold text-2xl">${stats.disciplinasCount}</div>
            <div class="text-gray-600 text-sm">Disciplinas</div>
          </div>
          <div class="bg-indigo-50 rounded-2xl p-4">
            <div class="text-indigo-600 font-bold text-2xl">${stats.tarefasCount}</div>
            <div class="text-gray-600 text-sm">Tarefas Criadas</div>
          </div>
        </div>
      `;
    }
    
    if (quickActionsSection) {
      quickActionsSection.innerHTML = `
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">Ações Rápidas</h3>
        </div>
        <div class="grid grid-cols-1 gap-3">
          <a
            href="/profdisciplinas"
            data-navigo
            class="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl p-5 text-center font-bold text-lg hover:shadow-lg transition-all active:scale-95"
          >
            Ver Disciplinas
          </a>
        </div>
      `;
    }
    
    // Update page links after content change
    router.updatePageLinks();
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

export default {
  index: () => {
    loadView("prof/profhome");
  },
};