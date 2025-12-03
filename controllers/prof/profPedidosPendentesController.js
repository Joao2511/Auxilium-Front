import { router } from "../../app.js";
import {
  listarPedidosPendentes,
  aprovarPedido,
  recusarPedido,
  contarPedidosPendentes,
} from "../../models/prof/profPedidosPendentesModel.js";
import Utils from "../../utils.js";

export default {
  async index(params) {
    const app = document.getElementById("app");
    const res = await fetch("pages/prof/profpedidos_pendentes.html");
    app.innerHTML = await res.text();

    // Get discipline ID
    let id_disciplina;

    if (params && params.data && params.data.disc) {
      id_disciplina = parseInt(params.data.disc, 10);
    } else if (params && params.disc) {
      id_disciplina = parseInt(params.disc, 10);
    } else {
      const paramsString = window.location.hash.split("?")[1];
      if (paramsString) {
        const urlParams = new URLSearchParams(paramsString);
        const discParam = urlParams.get("disc");
        if (discParam) {
          id_disciplina = parseInt(discParam, 10);
        }
      }
    }

    if (!id_disciplina || isNaN(id_disciplina)) {
      app.innerHTML = `
        <div class="p-8 bg-red-50 rounded-2xl border-2 border-red-200 text-center">
          <p class="text-red-600 font-semibold">Disciplina inválida.</p>
        </div>
      `;
      return;
    }

    const lista = document.getElementById("listaPedidos");
    const searchInput = document.getElementById("searchPedidos");
    let pedidosCache = [];

    async function carregarPedidos() {
      try {
        pedidosCache = await listarPedidosPendentes(id_disciplina);
        renderizarPedidos(pedidosCache);
        // Update the count in the header
        await atualizarContadorPedidos(id_disciplina);
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        lista.innerHTML = `
          <div class="text-red-500 p-4 text-center">
            Erro ao carregar pedidos: ${error.message}
          </div>
        `;
      }
    }

    async function atualizarContadorPedidos(id_disciplina) {
      try {
        const count = await contarPedidosPendentes(id_disciplina);
        const countElement = document.getElementById("contadorPedidos");
        if (countElement) {
          countElement.textContent = count;
        }
      } catch (error) {
        console.error("Erro ao contar pedidos:", error);
      }
    }

    function renderizarPedidos(pedidos) {
      if (!pedidos || pedidos.length === 0) {
        lista.innerHTML = `
          <div class="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 text-center">
            <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-700 mb-1">Nenhum pedido pendente</h3>
            <p class="text-gray-500 text-sm">Não há solicitações de matrícula para esta disciplina.</p>
          </div>
        `;
        return;
      }

      let html = "";
      pedidos.forEach((p, index) => {
        const dataFormatada = new Date(p.data_solicitacao).toLocaleDateString(
          "pt-BR",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        );

        html += `
          <div class="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold truncate">${p.nome}</h4>
                <p class="text-xs text-gray-500 truncate">${p.email}</p>
                <p class="text-xs text-gray-400 mt-1">Solicitado em: ${dataFormatada}</p>
              </div>
              <div class="flex gap-2 flex-shrink-0">
                <button class="btn-recusar px-3 py-2 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 text-white hover:shadow-md transition text-sm" data-index="${index}">
                  Recusar
                </button>
                <button class="btn-aprovar px-3 py-2 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-md transition text-sm" data-index="${index}">
                  Aprovar
                </button>
              </div>
            </div>
          </div>
        `;
      });

      lista.innerHTML = html;

      // Add event listeners
      document.querySelectorAll(".btn-aprovar").forEach((btn, index) => {
        btn.addEventListener("click", () => handleAprovar(pedidos[index]));
      });

      document.querySelectorAll(".btn-recusar").forEach((btn, index) => {
        btn.addEventListener("click", () => handleRecusar(pedidos[index]));
      });
    }

    function handleAprovar(pedido) {
      // Use the new confirmation modal
      Utils.showConfirmationModal(
        "Aprovar pedido?",
        `Tem certeza que deseja aprovar o pedido de matrícula de ${pedido.nome}?`,
        "Aprovar pedido",
        "Cancelar"
      ).then((confirmed) => {
        if (!confirmed) return;

        aprovarPedido(pedido.id_usuario, pedido.id_disciplina)
          .then(() => {
            Utils.showMessageToast(
              "success",
              "Pedido aprovado!",
              `${pedido.nome} foi matriculado na disciplina.`,
              3000
            );
            return carregarPedidos();
          })
          .catch((error) => {
            console.error("Erro ao aprovar pedido:", error);
            Utils.showMessageToast("error", "Erro ao aprovar", error.message, 5000);
          });
      });
    }

    function handleRecusar(pedido) {
      // Use the new confirmation modal
      Utils.showConfirmationModal(
        "Recusar pedido?",
        `Tem certeza que deseja recusar o pedido de matrícula de ${pedido.nome}?\n\nEsta ação não pode ser desfeita.`,
        "Recusar pedido",
        "Cancelar"
      ).then((confirmed) => {
        if (!confirmed) return;

        recusarPedido(pedido.id_usuario, pedido.id_disciplina)
          .then(() => {
            Utils.showMessageToast(
              "success",
              "Pedido recusado",
              `O pedido de ${pedido.nome} foi recusado.`,
              3000
            );
            return carregarPedidos();
          })
          .catch((error) => {
            console.error("Erro ao recusar pedido:", error);
            Utils.showMessageToast("error", "Erro ao recusar", error.message, 5000);
          });
      });
    }

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (!searchTerm) {
          renderizarPedidos(pedidosCache);
        } else {
          const filtered = pedidosCache.filter(
            (p) =>
              p.nome.toLowerCase().includes(searchTerm) ||
              p.email.toLowerCase().includes(searchTerm)
          );
          renderizarPedidos(filtered);
        }
      });
    }

    await carregarPedidos();
  },
};