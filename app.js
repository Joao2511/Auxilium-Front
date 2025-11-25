import Navigo from "https://cdn.jsdelivr.net/npm/navigo@8.11.1/+esm";
import { supabase } from "./utils/supabaseClient.js";

import splashController from "./controllers/splashController.js";
import loginController from "./controllers/loginController.js";
import homeController from "./controllers/homeController.js";
import rankingController from "./controllers/rankingController.js";
import chatsController from "./controllers/chatsController.js";
import agendaController from "./controllers/agendaController.js";
import configController from "./controllers/configController.js";
import profHomeController from "./controllers/prof/profHomeController.js";
import profDisciplinasController from "./controllers/prof/profDisciplinasController.js";
import profTarefasController from "./controllers/prof/profTarefasController.js";
import profTarefasDetalheController from "./controllers/prof/profTarefaDetalheController.js";
import disciplinasController from "./controllers/disciplinasController.js";
import alunoTarefasController from "./controllers/alunoTarefasController.js";
import alunoTarefaDetalheController from "./controllers/alunoTarefaDetalheController.js";

const APP_BUILD = "2025.10.09-1";
export const router = new Navigo("/", { hash: true });

window.router = router;

function ensureFreshOnNative() {
  console.log("Função de cache está aqui.");
}

function wireGlobalBackButton() {
  console.log("Função do botão voltar está aqui.");
}

async function getAuthProfile(userId) {
  try {
    const { data: profile, error } = await supabase
      .from("usuario")
      .select("id_tipo, nome_completo")
      .eq("id_usuario", userId)
      .single();
    if (error) throw error;
    return profile;
  } catch (err) {
    console.error("Erro crítico ao buscar perfil:", err);
    await supabase.auth.signOut();
    return null;
  }
}

export async function mountApp() {
  console.log("[APP] Montando aplicação e definindo rotas...");

  const navAluno = document.getElementById("nav-aluno");
  const navProfessor = document.getElementById("nav-professor");

  const publicRoutes = ["/splash", "/login"];
  const alunoRoutes = [
    "/home",
    "/agenda",
    "/ranking",
    "/chats",
    "/config",
    "/disciplinas",
    "/tarefas",
    "/tarefa",
  ];
  const profRoutes = ["/profhome", "/profdisciplinas", "/config"];

  router
    .on({
      "/": async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          try {
            const profile = await getAuthProfile(session.user.id);
            if (profile) {
              const homeRoute = profile.id_tipo === 2 ? "/profhome" : "/home";
              router.navigate(homeRoute);
            } else {
              router.navigate("/splash");
            }
          } catch (e) {
            router.navigate("/splash");
          }
        } else {
          router.navigate("/splash");
        }
      },
      "/splash": () => splashController.index(),
      "/login": () => {
        window.location.href = "/login.html";
      },

      "/home": () => homeController.index(),
      "/agenda": () => agendaController.index(),
      "/ranking": () => rankingController.index(),
      "/chats": () => chatsController.index(),
      "/disciplinas": () => disciplinasController.index(),
      "/tarefas": () => alunoTarefasController.index(),
      "/tarefa": () => alunoTarefaDetalheController.index(),

      "/profhome": () => profHomeController.index(),
      "/profdisciplinas": () => profDisciplinasController.index(),
      "/proftarefas": () => profTarefasController.index(),
      "/proftarefa": () => profTarefasDetalheController.index(),

      "/config": () => configController.index(),
    })
    .notFound(() => {
      console.warn("[404] Rota não encontrada. Redirecionando para /splash");
      router.navigate("/splash");
    });

  router.hooks({
    before: async (done, match) => {
      const route = match.route.path;
      const isPublic = ["/splash", "/login"].includes(route);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const navAluno = document.getElementById("nav-aluno");
      const navProfessor = document.getElementById("nav-professor");

      if (isPublic) {
        if (session) {
          console.log(
            "[GUARD] Logado. Tentando acessar rota pública. Redirecionando para home..."
          );
          const profile = await getAuthProfile(session.user.id);
          const homeRoute =
            profile && profile.id_tipo === 2 ? "/profhome" : "/home";

          if (!profile) {
            await supabase.auth.signOut();
            done();
            return;
          }

          done(false);
          router.navigate(homeRoute);
        } else {
          console.log("[GUARD] Deslogado. Acessando rota pública. Permitido.");
          navAluno?.classList.add("hidden");
          navProfessor?.classList.add("hidden");
          done();
        }
      } else {
        if (!session) {
          console.log(
            "[GUARD] Deslogado. Tentando acessar rota privada. Bloqueado."
          );
          done(false);
          window.location.href = "/login.html";
        } else {
          const profile = await getAuthProfile(session.user.id);
          if (!profile) {
            done(false);
            window.location.href = "/login.html";
            return;
          }

          const id_tipo = profile.id_tipo;
          let allowedRoutes = [];

          if (id_tipo === 1) {
            allowedRoutes = [
              "/home",
              "/agenda",
              "/ranking",
              "/chats",
              "/config",
              "/disciplinas",
              "/tarefas",
              "/tarefa",
            ];
            navProfessor?.classList.add("hidden");
            navAluno?.classList.remove("hidden");
          } else if (id_tipo === 2) {
            allowedRoutes = ["/profhome", "/profdisciplinas", "/config"];
            navAluno?.classList.add("hidden");
            navProfessor?.classList.remove("hidden");
          } else if (id_tipo === 3) {
            console.log("[GUARD] Admin. Redirecionando para painel...");
            window.location.href = "admin.html";
            done(false);
            return;
          }

          if (allowedRoutes.includes(route)) {
            console.log(
              `[GUARD] Logado como ${id_tipo}. Acesso permitido para ${route}.`
            );
            router.updatePageLinks();
            done();
          } else {
            console.warn(
              `[GUARD] Acesso negado. Tipo ${id_tipo} não pode ver ${route}.`
            );
            done(false);
            const homeRoute = id_tipo === 2 ? "/profhome" : "/home";
            router.navigate(homeRoute);
          }
        }
      }
    },

    after: async () => {
      await window.refreshNavbarVisibility?.();
    },
  });

  router.resolve();

  document.addEventListener("DOMContentLoaded", async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const navAluno = document.getElementById("nav-aluno");
    const navProfessor = document.getElementById("nav-professor");

    if (!session) {
      if (navAluno) navAluno.classList.add("hidden");
      if (navProfessor) navProfessor.classList.add("hidden");
      return;
    }

    const profile = await getAuthProfile(session.user.id);
    if (!profile) return;

    if (profile.id_tipo === 1) {
      navAluno?.classList.remove("hidden");
      navProfessor?.classList.add("hidden");
    } else if (profile.id_tipo === 2) {
      navProfessor?.classList.remove("hidden");
      navAluno?.classList.add("hidden");
    }
  });

  console.log("[APP] Aplicação montada e guarda de autenticação ativado.");

  window.refreshNavbarVisibility = async function () {
    const navAluno = document.getElementById("nav-aluno");
    const navProfessor = document.getElementById("nav-professor");

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navAluno?.classList.add("hidden");
      navProfessor?.classList.add("hidden");
      return;
    }

    const profile = await getAuthProfile(session.user.id);
    if (!profile) return;

    if (profile.id_tipo === 1) {
      navAluno?.classList.remove("hidden");
      navProfessor?.classList.add("hidden");
    } else if (profile.id_tipo === 2) {
      navProfessor?.classList.remove("hidden");
      navAluno?.classList.add("hidden");
    }
  };

  router.hooks({
    after: async () => {
      await window.refreshNavbarVisibility();
    },
  });

  if (!window.location.hash) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      try {
        const profile = await getAuthProfile(session.user.id);
        if (profile) {
          const homeRoute = profile.id_tipo === 2 ? "/profhome" : "/home";
          router.navigate(homeRoute);
        } else {
          router.navigate("/splash");
        }
      } catch (e) {
        router.navigate("/splash");
      }
    } else {
      router.navigate("/splash");
    }
  }
  router.resolve();
}

ensureFreshOnNative();
mountApp();
