import { supabase } from "../utils/supabaseClient.js";
import { fazerLogout } from "./loginModel.js";

function setLoading(isLoading) {
  const sk = document.getElementById("skeleton-config");
  const ct = document.getElementById("config-content");
  if (sk) sk.classList.toggle("hidden", !isLoading);
  if (ct) ct.classList.toggle("hidden", isLoading);
}

async function fetchUserRanking(userId) {
  try {
    // Fetch user points and ranking position
    const { data: rankingData, error } = await supabase
      .from('usuario')
      .select('pontuacao')
      .eq('id_usuario', userId)
      .single();

    if (error) {
      console.error('Error fetching user ranking:', error);
      return { position: '-', points: 0 };
    }

    // Get user's position in the ranking
    const { data: positionData } = await supabase
      .from('usuario')
      .select('id_usuario')
      .gte('pontuacao', rankingData.pontuacao || 0)
      .order('pontuacao', { ascending: false });

    const position = positionData ? positionData.findIndex(u => u.id_usuario === userId) + 1 : '-';
    const points = rankingData.pontuacao || 0;

    return { position, points };
  } catch (error) {
    console.error('Error in fetchUserRanking:', error);
    return { position: '-', points: 0 };
  }
}

function updateRankingDisplay(position, points) {
  const positionElement = document.getElementById('user-ranking-position');
  const pointsElement = document.getElementById('user-points');
  
  if (positionElement) {
    positionElement.textContent = position;
  }
  
  if (pointsElement) {
    pointsElement.textContent = points.toLocaleString('pt-BR');
  }
}

function getInitials(nome = "") {
  const parts = String(nome).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return (parts[0].slice(0, 2) || "U").toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function makeInitialsDataURL(name = "U", size = 96) {
  const cnv = document.createElement("canvas");
  cnv.width = cnv.height = size;
  const ctx = cnv.getContext("2d");

  ctx.fillStyle = "#8E24AA";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `600 ${size / 2}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(getInitials(name), size / 2, size / 2);

  return cnv.toDataURL("image/png");
}

async function fetchAndApplyProfile() {
  try {
    setLoading(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Usuário não autenticado. Redirecionando para login.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("usuario")
      .select("nome_completo, email_institucional, id_tipo")
      .eq("id_usuario", user.id)
      .single();

    if (profileError) {
      throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
    }

    document.getElementById("profile-name").textContent = profile.nome_completo;
    document.getElementById("info-nome").textContent = profile.nome_completo;
    document.getElementById("info-email").textContent =
      profile.email_institucional;

    const tipoConta =
      profile.id_tipo === 1
        ? "Aluno"
        : profile.id_tipo === 2
        ? "Professor"
        : "Admin";
    document.getElementById("info-tipo").textContent = tipoConta;

    const imgEl = document.getElementById("profileImage");
    if (imgEl) {
      imgEl.src = makeInitialsDataURL(profile.nome_completo);
      imgEl.alt = profile.nome_completo;
    }

    // Fetch and display user ranking
    const ranking = await fetchUserRanking(user.id);
    updateRankingDisplay(ranking.position, ranking.points);
  } catch (error) {
    console.error("Erro no configModel:", error.message);
    await handleLogout();
  } finally {
    setLoading(false);
  }
}

async function handleLogout() {
  try {
    await fazerLogout();

    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");

    document.getElementById("nav-aluno")?.classList.add("hidden");
    document.getElementById("nav-professor")?.classList.add("hidden");

    window.location.href = "/login.html";
  } catch (err) {
    console.error("Erro no logout:", err);
    window.location.href = "/login.html";
  }
}

function showLogoutConfirmation() {
  const modalContainer = document.getElementById("confirm-atendimento-modal");

  if (!modalContainer) {
    // Fallback to native confirm if modal container doesn't exist
    if (confirm("Tem certeza que deseja sair da sua conta?")) {
      handleLogout();
    }
    return;
  }

  modalContainer.innerHTML = `
    <div id="modal-content" class="bg-white rounded-t-2xl shadow-lg w-full animate-slide-up transform transition-all duration-300 ease-out">
      <div class="w-full flex justify-center mt-2">
        <div class="h-1.5 w-12 bg-gray-300 rounded-full"></div>
      </div>
      <div class="py-8 px-6 space-y-6">
        <div class="text-center space-y-2">
          <h3 class="text-2xl font-bold text-gray-900">Sair da conta?</h3>
          <p class="text-gray-600 text-sm leading-5">Tem certeza que deseja sair da sua conta?</p>
        </div>
        <div class="flex flex-col gap-2">
          <button id="confirm-logout" class="w-full py-3 text-white bg-[#8E24AA] rounded-full font-semibold hover:bg-[#4d135c] transition-colors">
            Sair da conta
          </button>
          <button id="cancel-logout" class="w-full py-3 text-[#8E24AA] bg-transparent font-medium hover:bg-gray-100 rounded-full transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  `;

  document.body.classList.add("no-scroll");
  modalContainer.classList.remove("hidden");

  const modal = document.getElementById("confirm-atendimento-modal");
  const modalContent = document.getElementById("modal-content");

  function closeLogoutModal() {
    document.body.classList.remove("no-scroll");
    if (modalContent) modalContent.classList.add("animate-slide-down");
    setTimeout(() => {
      modal?.classList.add("hidden");
      modalContent?.classList.remove("animate-slide-down");
      if (modalContent) modalContent.style.transform = "";
    }, 300);
  }

  // Close modal when clicking on the backdrop
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeLogoutModal();
  });

  // Cancel button
  document
    .getElementById("cancel-logout")
    .addEventListener("click", closeLogoutModal);

  // Confirm button
  document.getElementById("confirm-logout").addEventListener("click", () => {
    closeLogoutModal();
    handleLogout();
  });
}

function setupLogoutButton() {
  const logoutBtn = document.getElementById("logout-menu-item");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showLogoutConfirmation();
    });
  }
}
export default function configModel() {
  console.log("Config Page carregada.");

  fetchAndApplyProfile();

  setupLogoutButton();
}
