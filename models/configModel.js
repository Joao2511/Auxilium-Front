import { supabase } from "../utils/supabaseClient.js";
import { fazerLogout } from "./loginModel.js";

function setLoading(isLoading) {
  const sk = document.getElementById("skeleton-config");
  const ct = document.getElementById("config-content");
  if (sk) sk.classList.toggle("hidden", !isLoading);
  if (ct) ct.classList.toggle("hidden", isLoading);
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

    if (window.router) {
      window.router.navigate("/login");
    } else {
      window.location.href = "pages/login.html";
    }

    document.getElementById("nav-aluno")?.classList.add("hidden");
    document.getElementById("nav-professor")?.classList.add("hidden");
  } catch (err) {
    console.error("Erro no logout:", err);
    window.location.href = "pages/login.html";
  }
}

function setupLogoutButton() {
  const logoutBtn = document.getElementById("logout-menu-item");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Tem certeza que deseja sair da sua conta?")) {
        handleLogout();
      }
    });
  }
}
export default function configModel() {
  console.log("Config Page carregada.");

  fetchAndApplyProfile();

  setupLogoutButton();
}
