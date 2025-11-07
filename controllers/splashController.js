import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";

export default {
  async index() {
    console.log("[CTRL] splash.index() CHAMADO");

    const splashView = await import("../views/splashView.js");
    await splashView.default.render("splash");

    document.body.classList.add("tabs-disabled");

    setTimeout(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.navigate("/login");
          return;
        }

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
      } finally {
        setTimeout(() => document.body.classList.remove("tabs-disabled"), 250);
      }
    }, 1000);
  },
};
