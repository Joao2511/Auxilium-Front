export default {
  async render() {
    const response = await fetch("pages/login.html");
    if (!response.ok) {
      console.error("Erro ao carregar login.html");
      return;
    }
    const html = await response.text();

    const appContainer = document.getElementById("app");
    if (appContainer) {
      appContainer.innerHTML = html;
    } else {
      console.error("Elemento #app não encontrado");
    }

    appContainer
      .querySelectorAll("script")
      .forEach((script) => script.remove());
  },
};
