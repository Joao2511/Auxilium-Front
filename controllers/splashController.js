import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";

export default {
  async index() {
    console.log("[CTRL] splash.index() CHAMADO");

    // Verifica sessão ANTES de renderizar a splash
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Se já estiver logado, redireciona direto sem mostrar splash
    if (session) {
      console.log("[SPLASH] Usuário já logado, redirecionando sem splash");
      let destino = "/home";
      try {
        const { data: profile } = await supabase
          .from("usuario")
          .select("id_tipo")
          .eq("id_usuario", session.user.id)
          .single();

        if (profile?.id_tipo === 2) destino = "/profhome";
      } catch (e) {
        console.warn("[SPLASH] Falha ao buscar perfil. Indo para /home.", e);
      }

      router.navigate(destino);
      return;
    }

    // Se não estiver logado, mostra a splash e depois redireciona para login
    const splashView = await import("../views/splashView.js");
    await splashView.default.render("splash");

    document.body.classList.add("tabs-disabled");

    setTimeout(async () => {
      try {
        const {
          data: { session: sessionAfterDelay },
        } = await supabase.auth.getSession();

        if (!sessionAfterDelay) {
          window.location.href = "/login.html";
          return;
        }

        // Se logou durante a splash, redireciona para home
        let destino = "/home";
        try {
          const { data: profile } = await supabase
            .from("usuario")
            .select("id_tipo")
            .eq("id_usuario", sessionAfterDelay.user.id)
            .single();

          if (profile?.id_tipo === 2) destino = "/profhome";
        } catch (e) {
          console.warn("[SPLASH] Falha ao buscar perfil. Indo para /home.", e);
        }

        router.navigate(destino);
      } finally {
        setTimeout(() => document.body.classList.remove("tabs-disabled"), 250);
      }
    }, 1000);
  },
};
