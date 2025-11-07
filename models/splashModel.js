export default function splashModel() {
  console.log("[Splash] carregada");
  document.body.classList.add("tabs-disabled");

  setTimeout(() => {
    const hasAuth =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    if (hasAuth) {
      console.log("[Splash] Já autenticado, indo para app");
      const gid = localStorage.getItem("grupo_id");
      if (gid === "3") {
        window.router?.navigate("/home");
      } else {
        window.router?.navigate("/agenda");
      }
    } else {
      console.log("[Splash] Indo para login físico");
      window.router?.navigate("/login");
    }

    setTimeout(() => {
      document.body.classList.remove("tabs-disabled");
    }, 500);
  }, 2000);
}
