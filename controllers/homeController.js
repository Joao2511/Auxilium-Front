import homeModel from "../models/homeModel.js";

const homeController = {
  async index() {
    const app = document.getElementById("app");

    if (app && window.__HOME_SKELETON__) {
      app.innerHTML = window.__HOME_SKELETON__;
    }

    try {
      const response = await fetch("pages/home.html");
      if (!response.ok) throw new Error("Página não encontrada");
      const html = await response.text();
      app.innerHTML = html;
    } catch (err) {
      console.error("Erro ao carregar a página:", err);
      app.innerHTML = "<h1>Erro ao carregar a página.</h1>";
      return;
    }
    homeModel();
  },
};

export default homeController;
