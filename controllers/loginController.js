import * as loginModel from "../models/loginModel.js";
import loginView from "../views/loginView.js";
import Utils from "../utils.js";
import { router } from "../app.js";

(function fixToasts() {
  if (!window.Utils || typeof Utils.showMessageToast !== "function") return;
  const orig = Utils.showMessageToast.bind(Utils);
  let running = false;
  const queue = [];
  function showOne({ type, title, message, opts }) {
    return new Promise((resolve) => {
      const dur = Math.max(1500, Number(opts?.duration) || 3200);
      let userClosed = false;
      let el = null;
      orig(type, title, message, opts || {});
      const container =
        document.getElementById("toastContainer") || document.body;
      el = container.lastElementChild;
      if (el) {
        el.style.pointerEvents = "auto";
        el.addEventListener(
          "click",
          () => {
            userClosed = true;
            setTimeout(() => {
              try {
                el?.remove();
              } catch {}
              resolve();
            }, 0);
          },
          { once: true }
        );
      }
      const started = performance.now();
      (function tick() {
        const elapsed = performance.now() - started;
        if (userClosed) return;
        if (elapsed >= dur) {
          try {
            el?.remove();
          } catch {}
          resolve();
          return;
        }
        if (!el || !el.isConnected) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      })();
    });
  }
  async function pump() {
    if (running) return;
    const item = queue.shift();
    if (!item) return;
    running = true;
    try {
      await showOne(item);
    } finally {
      running = false;
      pump();
    }
  }
  Utils.showMessageToast = (type, title, message, opts = {}) => {
    queue.push({ type, title, message, opts });
    pump();
  };
})();

const BUILD_VERSION = "1.0.0";

function getNB() {
  return window.Capacitor?.Plugins?.NativeBiometric || null;
}
function clearAuth() {
  sessionStorage.removeItem("authToken");
}

function attachEventListeners() {
  console.log("Anexando listeners do Login...");

  const loginForm = document.getElementById("login-form");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("login-password");
  const fingerprintBtn = document.getElementById("fingerprintBtn");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  togglePassword?.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePassword.innerHTML =
      type === "password"
        ? '<i class="fas fa-eye"></i>'
        : '<i class="fas fa-eye-slash"></i>';
  });

  forgotPasswordLink?.addEventListener("click", (e) => {
    e.preventDefault();
    Utils.showMessageToast("info", "TODO", "Implementar recuperação de senha");
  });

  const NativeBiometric = getNB();
  if (!NativeBiometric) {
    if (fingerprintBtn) fingerprintBtn.style.display = "none";
  }

  let isFingerprintProcessing = false;
  fingerprintBtn?.addEventListener("click", async () => {
    if (isFingerprintProcessing) return;
    isFingerprintProcessing = true;
    try {
      Utils.showMessageToast(
        "info",
        "Biometria",
        "TODO: Lógica de login por biometria"
      );
    } catch (err) {
      console.warn("[Fingerprint] Erro:", err);
    } finally {
      setTimeout(() => {
        isFingerprintProcessing = false;
      }, 1000);
    }
  });

  loginForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!email || !password) {
      Utils.showMessageToast(
        "warning",
        "Campos vazios",
        "Por favor, preencha seu email e senha."
      );
      return;
    }

    const btn = this.querySelector('button[type="submit"]');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Entrando...';
    btn.disabled = true;

    try {
      const { data, error } = await loginModel.fazerLogin(email, password);
      if (error) throw new Error(error.message);

      const displayName = data.user?.email || "Usuário";
      Utils.showMessageToast(
        "success",
        "Login realizado!",
        `Olá, ${displayName}! Redirecionando...`,
        { duration: 2000 }
      );
      sessionStorage.setItem("authToken", data.session.access_token);
      localStorage.setItem("authToken", data.session.access_token);

      setTimeout(async () => {
        const {
          data: { session },
        } = await window.supabase.auth.getSession();

        if (session) {
          try {
            const { data: profile } = await window.supabase
              .from("usuario")
              .select("id_tipo")
              .eq("id_usuario", session.user.id)
              .single();

            if (profile?.id_tipo === 2) {
              console.log("[LOGIN] Professor detectado, indo para /profhome");
              router.navigate("/profhome");
            } else {
              console.log("[LOGIN] Aluno detectado, indo para /home");
              router.navigate("/home");
            }
          } catch (err) {
            console.warn("[LOGIN] Falha ao buscar tipo do usuário:", err);
            window.router.navigate("/home");
            document.body.classList.remove("tabs-disabled");
            setTimeout(() => {
              if (window.markActiveBottomNav) window.markActiveBottomNav();
            }, 200);
          }
        } else {
          window.router.navigate("/login");
          document.body.classList.remove("tabs-disabled");
          setTimeout(() => {
            if (window.markActiveBottomNav) window.markActiveBottomNav();
          }, 200);
        }
      }, 1500);
    } catch (err) {
      clearAuth();
      console.error(err);
      let userMsg = "Erro inesperado. Tente novamente.";
      if (err.message.includes("Invalid login credentials")) {
        userMsg = "Email ou senha incorretos.";
      } else if (
        err.message.includes("network") ||
        err.message.includes("fetch")
      ) {
        userMsg = "Falha de conexão. Verifique sua internet.";
      }
      Utils.showMessageToast("error", "Falha no login", userMsg);
    } finally {
      btn.innerHTML =
        '<i class="fas fa-right-to-bracket mr-2 text-[14px]"></i> Entrar';
      btn.disabled = false;
    }
  });
}

export default {
  async index() {
    console.log("[CTRL] login.index() CHAMADO");

    await loginView.render();

    setTimeout(attachEventListeners, 0);
  },
};
