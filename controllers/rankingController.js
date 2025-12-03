import { fetchUserRankings, updateRankingDisplay, toggleUserVisibility } from "../models/rankingModel.js";
import { supabase } from "../utils/supabaseClient.js";

const rankingController = {
  async index() {
    const app = document.getElementById("app");

    if (app && window.__ranking_SKELETON__) {
      app.innerHTML = window.__ranking_SKELETON__;
    }

    try {
      const response = await fetch("pages/ranking.html");
      if (!response.ok) throw new Error("Página não encontrada");
      const html = await response.text();
      app.innerHTML = html;
      
      // Initialize the ranking model after the page is loaded
      await this.initRankingModel();
    } catch (err) {
      console.error("Erro ao carregar a página:", err);
      app.innerHTML = "<h1>Erro ao carregar a página.</h1>";
      return;
    }
  },
  
  async initRankingModel() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("Usuário não autenticado");
        return;
      }
      
      // Fetch rankings
      const rankings = await fetchUserRankings();
      
      // Update display
      updateRankingDisplay(rankings, user.id);
      
      // Set up visibility toggle
      this.setupVisibilityToggle(user.id, rankings);
      
      // Set up back button event listener
      const backButton = document.getElementById("back-button");
      if (backButton) {
        backButton.addEventListener("click", () => {
          window.location.hash = "/config";
        });
      }
    } catch (error) {
      console.error("Error initializing ranking model:", error);
    }
  },
  
  async setupVisibilityToggle(userId, rankings) {
    try {
      // Find current user in rankings to get their visibility status
      const currentUser = rankings.find(user => user.id_usuario === userId);
      const currentVisibility = currentUser ? currentUser.visibilidade_ranking !== false : true;
      
      // Add toggle button to the user position card
      const userPositionCard = document.querySelector('.p-6.bg-gradient-to-br.from-purple-600.via-purple-700.to-violet-700');
      if (userPositionCard) {
        // Check if toggle already exists to avoid duplicates
        if (!document.getElementById('visibility-toggle-container')) {
          const toggleContainer = document.createElement('div');
          toggleContainer.id = 'visibility-toggle-container';
          toggleContainer.className = 'mt-4 pt-4 border-t border-white/20';
          toggleContainer.innerHTML = `
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-purple-100 opacity-90 font-medium">Visibilidade no Ranking</p>
                <p class="text-xs text-purple-200">Controle se seu nome aparece no ranking</p>
              </div>
              <button id="visibility-toggle" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${currentVisibility ? 'bg-purple-300' : 'bg-gray-400'}">
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentVisibility ? 'translate-x-6' : 'translate-x-1'}"></span>
              </button>
            </div>
          `;
          userPositionCard.appendChild(toggleContainer);
          
          // Add event listener to the toggle button
          const toggleButton = document.getElementById('visibility-toggle');
          if (toggleButton) {
            toggleButton.addEventListener('click', async () => {
              try {
                const newVisibility = await toggleUserVisibility(userId, currentVisibility);
                
                // Show success message before reloading
                const message = newVisibility 
                  ? "Seu nome agora está visível no ranking!" 
                  : "Seu nome agora está oculto no ranking!";
                
                // Create a temporary toast notification
                const toast = document.createElement('div');
                toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
                toast.textContent = message;
                toast.style.opacity = '0';
                document.body.appendChild(toast);
                
                // Fade in
                setTimeout(() => {
                  toast.style.opacity = '1';
                }, 10);
                
                // Reload the page after a short delay to show the message
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              } catch (error) {
                console.error('Error toggling visibility:', error);
                // Show error message
                const toast = document.createElement('div');
                toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
                toast.textContent = 'Erro ao atualizar visibilidade. Tente novamente.';
                toast.style.opacity = '0';
                document.body.appendChild(toast);
                
                // Fade in
                setTimeout(() => {
                  toast.style.opacity = '1';
                }, 10);
                
                // Remove after 3 seconds
                setTimeout(() => {
                  toast.style.opacity = '0';
                  setTimeout(() => {
                    if (toast.parentNode) {
                      toast.parentNode.removeChild(toast);
                    }
                  }, 300);
                }, 3000);
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error setting up visibility toggle:', error);
    }
  }
};

export default rankingController;