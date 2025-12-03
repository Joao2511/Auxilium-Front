import { supabase } from "../utils/supabaseClient.js";

/**
 * Fetches the user ranking data from Supabase
 * @returns {Promise<Array>} Array of users sorted by points in descending order
 */
export async function fetchUserRankings() {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select('id_usuario, nome_completo, pontos_total, visibilidade_ranking, id_tipo')
      .eq('id_tipo', 1) // Only select students (id_tipo = 1)
      .order('pontos_total', { ascending: false });

    if (error) {
      console.error('Error fetching user rankings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchUserRankings:', error);
    return [];
  }
}

/**
 * Updates the ranking display in the UI
 * @param {Array} rankings - Array of user ranking data
 * @param {string} currentUserId - ID of the current logged-in user
 */
export function updateRankingDisplay(rankings, currentUserId) {
  try {
    // Update user position card
    const userIndex = rankings.findIndex(user => user.id_usuario === currentUserId);
    if (userIndex !== -1) {
      const userPosition = userIndex + 1;
      const userPoints = rankings[userIndex].pontos_total || 0;
      
      // Update user position in header card
      const positionElement = document.getElementById('user-position');
      const pointsElement = document.getElementById('user-points');
      
      if (positionElement) {
        positionElement.textContent = `#${userPosition}`;
      }
      
      if (pointsElement) {
        pointsElement.textContent = userPoints.toLocaleString('pt-BR');
      }
    }

    // Update podium (top 3)
    updatePodiumDisplay(rankings.slice(0, 3), currentUserId);

    // Update full ranking list
    updateFullRankingList(rankings, currentUserId);
  } catch (error) {
    console.error('Error updating ranking display:', error);
  }
}

/**
 * Updates the podium display (top 3 users)
 * @param {Array} topUsers - Array of top 3 users
 * @param {string} currentUserId - ID of the current logged-in user
 */
function updatePodiumDisplay(topUsers, currentUserId) {
  // Update each podium position
  topUsers.forEach((user, index) => {
    const position = index + 1;
    let nameElementId = '';
    let pointsElementId = '';
    
    switch(position) {
      case 1:
        nameElementId = 'first-place-name';
        pointsElementId = 'first-place-points';
        break;
      case 2:
        nameElementId = 'second-place-name';
        pointsElementId = 'second-place-points';
        break;
      case 3:
        nameElementId = 'third-place-name';
        pointsElementId = 'third-place-points';
        break;
    }
    
    if (nameElementId && pointsElementId) {
      const nameElement = document.getElementById(nameElementId);
      const pointsElement = document.getElementById(pointsElementId);
      
      if (nameElement) {
        // Check if user has visibility enabled
        const isVisible = user.visibilidade_ranking !== false; // Default to true if undefined
        // When visibility is disabled, even the current user sees "Aluno Misterioso"
        const displayName = isVisible ? (user.nome_completo || 'Usuário') : 'Aluno Misterioso';
        nameElement.textContent = displayName;
      }
      
      if (pointsElement) {
        pointsElement.textContent = `${(user.pontos_total || 0).toLocaleString('pt-BR')} pts`;
      }
    }
  });
}

/**
 * Updates the full ranking list display
 * @param {Array} rankings - Array of all users sorted by points
 * @param {string} currentUserId - ID of the current logged-in user
 */
function updateFullRankingList(rankings, currentUserId) {
  const rankingListContainer = document.getElementById('ranking-list-container');
  
  if (!rankingListContainer) {
    console.warn('Ranking list container not found');
    return;
  }
  
  // Clear existing rankings
  rankingListContainer.innerHTML = '';
  
  // Add each user to the ranking list
  rankings.forEach((user, index) => {
    const position = index + 1;
    const isCurrentUser = user.id_usuario === currentUserId;
    const points = user.pontos_total || 0;
    
    // Check visibility - when visibility is disabled, even the current user sees "Aluno Misterioso"
    const isVisible = user.visibilidade_ranking !== false; // Default to true if undefined
    const displayName = isVisible ? (user.nome_completo || 'Usuário') : 'Aluno Misterioso';
    
    // Determine styling based on position
    let cardClass = 'flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 transition-colors';
    let positionClass = 'flex items-center justify-center w-10 h-10 bg-gray-200 rounded-xl';
    let positionText = `#${position}`;
    let nameText = displayName;
    let pointsColor = 'text-gray-900';
    let arrowIcon = '';
    
    if (position === 1) {
      cardClass = 'flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300';
      positionClass = 'flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl shadow-md';
      positionText = '1';
      pointsColor = 'text-gray-900';
      arrowIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="m18 15-6-6-6 6"/></svg>';
    } else if (position === 2) {
      cardClass = 'flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300';
      positionClass = 'flex items-center justify-center w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl shadow-md';
      positionText = '2';
      arrowIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><path d="m18 15-6-6-6 6"/></svg>';
    } else if (position === 3) {
      cardClass = 'flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300';
      positionClass = 'flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md';
      positionText = '3';
      pointsColor = 'text-purple-900';
    }
    
    // Add "(Você)" tag for current user
    if (isCurrentUser) {
      nameText += ' <span class="text-sm font-semibold text-purple-600">(Você)</span>';
    }
    
    const rankingItem = document.createElement('div');
    rankingItem.className = cardClass;
    rankingItem.innerHTML = `
      <div class="flex items-center space-x-4">
        <div class="${positionClass}">
          ${position <= 3 ? 
            `<span class="font-bold text-white text-sm">${positionText}</span>` : 
            `<span class="font-bold text-gray-700 text-sm">${positionText}</span>`
          }
        </div>
        <div>
          <p class="font-semibold ${isCurrentUser ? 'text-purple-900' : 'text-gray-900'}">${nameText}</p>
          <p class="text-xs text-gray-600">Pontuação: ${points.toLocaleString('pt-BR')}</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <div class="text-right">
          <p class="font-bold text-lg ${pointsColor}">${points.toLocaleString('pt-BR')}</p>
          <p class="text-xs text-gray-500">pontos</p>
        </div>
        ${arrowIcon}
      </div>
    `;
    
    rankingListContainer.appendChild(rankingItem);
  });
}

/**
 * Toggles the visibility of the current user's name in the ranking
 * @param {string} userId - ID of the user
 * @param {boolean} currentVisibility - Current visibility status
 */
export async function toggleUserVisibility(userId, currentVisibility) {
  try {
    const newVisibility = !currentVisibility;
    
    const { error } = await supabase
      .from('usuario')
      .update({ visibilidade_ranking: newVisibility })
      .eq('id_usuario', userId);

    if (error) {
      console.error('Error updating user visibility:', error);
      throw error;
    }

    return newVisibility;
  } catch (error) {
    console.error('Error in toggleUserVisibility:', error);
    throw error;
  }
}