import * as authModel from "../models/authModel.js";
import Utils from "../utils.js";

function init() {
  if (window.location.pathname.endsWith("cadastro.html")) {
    const btnCadastrar = document.getElementById("btn-cadastrar");

    btnCadastrar.addEventListener("click", async () => {
      const nome = document.getElementById("cadastro-nome").value;
      const email = document.getElementById("cadastro-email").value;
      const senha = document.getElementById("cadastro-senha").value;
      const tipo = document.getElementById("cadastro-tipo").value;

      if (!nome || !email || !senha) {
        Utils.showMessageToast(
          "warning",
          "Campos obrigatórios",
          "Por favor, preencha todos os campos.",
          3000
        );
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
          Utils.showMessageToast(
            "error",
            "Erro no cadastro",
            "Erro no cadastro: " + error.message,
            5000
          );
        } else {
          Utils.showMessageToast(
            "success",
            "Cadastro realizado!",
            "Cadastro realizado com sucesso! Você será redirecionado para o login.",
            3000
          );
          setTimeout(() => {
            window.location.href = "login.html";
          }, 3500);
        }
      } catch (e) {
        console.error("Erro inesperado no controller:", e);
        Utils.showMessageToast(
          "error",
          "Erro inesperado",
          "Um erro inesperado ocorreu.",
          5000
        );
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", init);