import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";

export default function homeModel() {
  console.log("🏠 Auxilium | Home carregada");

  const app = document.getElementById("app");

  async function carregarPagina() {
    const res = await fetch("pages/home.html");
    app.innerHTML = await res.text();

    carregarPerfilUsuario();
    carregarResumoTarefas();
    carregarEventosProximos();
    carregarResumoRanking();
  }
  async function carregarPerfilUsuario() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return router.navigate("/login");

    const user = session.user;
    const elNome = document.getElementById("userName");
    const elEmail = document.getElementById("userEmail");
    const elAvatar = document.getElementById("userAvatar");

    const { data: usuario } = await supabase
      .from("usuario")
      .select("nome_completo, email_institucional")
      .eq("id_usuario", user.id)
      .single();

    const nome = usuario?.nome_completo || "Usuário";
    const email = usuario?.email_institucional || user.email;

    elNome.textContent = nome;
    elEmail.textContent = email;

    const iniciais = nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    elAvatar.textContent = iniciais;
  }
  async function carregarResumoTarefas() {
    const lista = document.getElementById("tarefasPendentes");

    lista.innerHTML = `
      <div class="skeleton h-16 rounded-lg"></div>
      <div class="skeleton h-16 rounded-lg"></div>
    `;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const id_aluno = session.user.id;

    const { data: tarefas } = await supabase
      .from("tarefa")
      .select(
        "id_tarefa, titulo, data_entrega, pontos_maximos, entrega_tarefa!left(status)"
      )
      .eq("entrega_tarefa.id_aluno", id_aluno)
      .order("data_entrega", { ascending: true });

    lista.innerHTML =
      tarefas && tarefas.length
        ? tarefas
            .map(
              (t) => `
      <div class="modern-card glass-card p-4 flex justify-between items-center">
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">${
            t.titulo
          }</h3>
          <p class="text-sm text-gray-500">
            Entrega até: ${new Date(t.data_entrega).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <a href="/tarefa?tid=${t.id_tarefa}" data-navigo
          class="bg-[#8E24AA] text-white rounded-full px-4 py-2 font-medium text-sm hover:bg-[#7b1fa2]">
          Ver
        </a>
      </div>`
            )
            .join("")
        : `<p class="text-gray-500 text-center">Nenhuma tarefa pendente 🎉</p>`;
  }

  async function carregarEventosProximos() {
    const lista = document.getElementById("eventosProximos");
    lista.innerHTML = `<div class="skeleton h-14 rounded-lg"></div>`;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data: eventos } = await supabase
      .from("agenda_eventos")
      .select("id_evento, titulo, data, hora")
      .eq("id_usuario", session.user.id)
      .order("data", { ascending: true })
      .limit(3);

    if (!eventos || eventos.length === 0) {
      lista.innerHTML = `<p class="text-gray-500 text-center">Sem eventos próximos.</p>`;
      return;
    }

    lista.innerHTML = eventos
      .map(
        (e) => `
      <div class="modern-card p-3 flex justify-between items-center">
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white">${e.titulo}</h4>
          <p class="text-sm text-gray-500">
            ${new Date(e.data).toLocaleDateString("pt-BR")} às ${e.hora || "—"}
          </p>
        </div>
        <i class="fa-regular fa-calendar text-[#8E24AA]"></i>
      </div>`
      )
      .join("");
  }

  async function carregarResumoRanking() {
    const box = document.getElementById("rankingResumo");
    box.innerHTML = `<div class="skeleton h-24 rounded-lg"></div>`;

    const { data: ranking } = await supabase
      .from("ranking")
      .select("usuario(nome_completo), pontuacao")
      .order("pontuacao", { ascending: false })
      .limit(5);

    if (!ranking || ranking.length === 0) {
      box.innerHTML = `<p class="text-gray-500 text-center">Ranking indisponível.</p>`;
      return;
    }

    box.innerHTML = ranking
      .map(
        (r, i) => `
      <div class="flex justify-between items-center p-2 border-b border-gray-100 dark:border-gray-700">
        <span class="font-medium text-gray-800 dark:text-gray-200">${i + 1}. ${
          r.usuario?.nome_completo || "Usuário"
        }</span>
        <span class="text-[#8E24AA] font-semibold">${r.pontuacao} pts</span>
      </div>`
      )
      .join("");
  }

  carregarPagina();
}
