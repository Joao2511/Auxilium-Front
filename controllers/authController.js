import * as authModel from "../models/authModel.js";

function init() {
  if (window.location.pathname.endsWith("cadastro.html")) {
    const btnCadastrar = document.getElementById("btn-cadastrar");

    btnCadastrar.addEventListener("click", async () => {
      const nome = document.getElementById("cadastro-nome").value;
      const email = document.getElementById("cadastro-email").value;
      const senha = document.getElementById("cadastro-senha").value;
      const tipo = document.getElementById("cadastro-tipo").value;

      if (!nome || !email || !senha) {
        alert("Por favor, preencha todos os campos.");
        return;
      }

      try {
        const { user, error } = await authModel.cadastrarUsuario(
          email,
          senha,
          nome,
          tipo
        );

        if (error) {
          alert("Erro no cadastro: " + error.message);
        } else {
          alert(
            "Cadastro realizado com sucesso! Você será redirecionado para o login."
          );
          window.location.href = "login.html";
        }
      } catch (e) {
        console.error("Erro inesperado no controller:", e);
        alert("Um erro inesperado ocorreu.");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
