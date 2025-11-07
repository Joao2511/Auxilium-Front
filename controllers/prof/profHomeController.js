import { router } from "../../app.js";

async function loadView(viewName) {
  const app = document.getElementById("app");
  app.innerHTML = "<h1>Carregando...</h1>";

  try {
    const response = await fetch(`pages/${viewName}.html`);
    if (!response.ok) throw new Error("Página não encontrada");

    const html = await response.text();
    app.innerHTML = html;

    router.updatePageLinks();

    console.log(`[Navigo] Links atualizados para ${viewName}`);
  } catch (error) {
    console.error("Erro ao carregar página:", error);
    app.innerHTML = "<h1>Erro ao carregar página</h1>";
  }
}

export default {
  index: () => {
    loadView("prof/profhome");
  },
};
