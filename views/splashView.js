const splashView = {
  async render(page = "splash") {
    console.log("[VIEW] Renderizando splash - página:", page);
    try {
      const response = await fetch(`./pages/${page}.html`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      const app = document.getElementById("app");

      if (app) {
        app.innerHTML = html;
        console.log("[VIEW] Splash HTML injetado com sucesso");
      } else {
        console.error("[VIEW] Elemento #app não encontrado!");
      }
    } catch (err) {
      console.error("[VIEW] Erro ao carregar splash:", err);
      const app = document.getElementById("app");
      if (app) {
        app.innerHTML = "<h1>Erro ao carregar a splash</h1>";
      }
    }
  },
};

export default splashView;
