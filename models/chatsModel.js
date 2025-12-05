// src/models/chatsModel.js
import { supabase } from "../utils/supabaseClient.js";

const IA_API_URL = "https://undefinedly-pretelephonic-beatriz.ngrok-free.dev";

export default function chatsModel() {
  const input = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const messagesContainer = document.getElementById("messages-container");

  let sessionId = null;

  // ================
  // Enviar mensagem
  // ================
  async function enviarMensagem() {
    const texto = input.value.trim();
    if (!texto) return;

    input.value = "";

    // Render user message
    adicionarMensagemUsuario(texto);

    // Render Loading Bubble
    const loadingId = adicionarLoading();

    try {
      const resposta = await enviarParaIA(texto);

      sessionId = resposta.id_sessao;

      removerLoading(loadingId);
      adicionarMensagemIA(resposta.resposta);
    } catch (error) {
      removerLoading(loadingId);
      adicionarMensagemIA("⚠️ Ocorreu um erro ao falar com a IA.");
      console.error(error);
    }
  }

  // ========================
  // Chama sua API de IA
  // ========================
  async function enviarParaIA(pergunta) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const payload = {
      pergunta,
      id_usuario: user.id,
      id_sessao: sessionId,
    };

    const response = await fetch(`${IA_API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Erro na IA");
    }

    return await response.json();
  }

  // ============================
  // Renderização das mensagens
  // ============================

  function adicionarMensagemUsuario(texto) {
    messagesContainer.innerHTML += `
      <div class="message-container">
        <div class="message-user">
          <p>${texto}</p>
          <div class="text-xs text-white/80 mt-1">${horaAtual()}</div>
        </div>
      </div>
    `;
    scrollBottom();
  }

  function adicionarMensagemIA(texto) {
    messagesContainer.innerHTML += `
      <div class="message-container">
        <div class="message-ai">
          <p>${texto}</p>
          <div class="text-xs text-gray-500 mt-1">${horaAtual()}</div>
        </div>
      </div>
    `;
    scrollBottom();
  }

  // ============================
  // Bubble de loading animada
  // ============================
  function adicionarLoading() {
    const id = "ld-" + Math.random().toString(36).substring(2);

    messagesContainer.innerHTML += `
      <div class="message-container" id="${id}">
        <div class="message-ai flex items-center gap-2">
          <div class="animate-pulse w-2 h-2 rounded-full bg-gray-400"></div>
          <div class="animate-pulse w-2 h-2 rounded-full bg-gray-400"></div>
          <div class="animate-pulse w-2 h-2 rounded-full bg-gray-400"></div>
        </div>
      </div>
    `;

    scrollBottom();
    return id;
  }

  function removerLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  // ============================
  // Helpers
  // ============================
  function horaAtual() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function scrollBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // ============================
  // Eventos
  // ============================
  sendButton.addEventListener("click", enviarMensagem);

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") enviarMensagem();
  });
}
