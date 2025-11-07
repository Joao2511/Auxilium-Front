const chatsController = {
  async index() {
    const app = document.getElementById("app");

    if (app && window.__chats_SKELETON__) {
      app.innerHTML = window.__chats_SKELETON__;
    }

    try {
      const response = await fetch("pages/chats.html");
      if (!response.ok) throw new Error("Página não encontrada");
      const html = await response.text();
      app.innerHTML = html;
    } catch (err) {
      console.error("Erro ao carregar a página:", err);
      app.innerHTML = "<h1>Erro ao carregar a página.</h1>";
      return;
    }
    chatsModel();
  },
};

export default chatsController;
