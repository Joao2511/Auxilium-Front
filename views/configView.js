const configView = {
    async render(page) {
      try {
        const response = await fetch(`pages/${page}.html`);
        if (!response.ok) throw new Error("Página não encontrada");
        const html = await response.text();
        document.getElementById("app").innerHTML = html;
      } catch (err) {
        console.error("Erro ao carregar a página:", err);
        document.getElementById("app").innerHTML = "<h1>Erro ao carregar a página.</h1>";
      }
    }
  };
  
  export default configView;
  