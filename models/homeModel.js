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
    // carregarEventosProximos();
    // carregarResumoRanking();
  }
  async function carregarPerfilUsuario() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/login.html";
      return;
    }

    const user = session.user;
    const elNome = document.getElementById("userName");

    const { data: usuario } = await supabase
      .from("usuario")
      .select("nome_completo, email_institucional")
      .eq("id_usuario", user.id)
      .single();

    const nome = usuario?.nome_completo || "User";
    const primeiroNome = nome.split(" ")[0];

    if (elNome) {
      elNome.textContent = `Olá, ${primeiroNome}!`;
    }
  }
  async function carregarResumoTarefas() {
    const container = document.querySelector("#cardsAtividadesPendentes");

    container.innerHTML = `
    <div class="skeleton h-28 rounded-2xl"></div>
    <div class="skeleton h-28 rounded-2xl"></div>
    <div class="skeleton h-28 rounded-2xl"></div>
    <div class="skeleton h-28 rounded-2xl"></div>
  `;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;
    const id_aluno = session.user.id;

    const { data: relacoes } = await supabase
      .from("usuario_disciplina")
      .select("id_disciplina")
      .eq("id_usuario", id_aluno);

    if (!relacoes || relacoes.length === 0) {
      container.innerHTML = `<p class="text-gray-500">Nenhuma disciplina encontrada.</p>`;
      return;
    }

    const disciplinasIds = relacoes.map((d) => d.id_disciplina);

    const { data: tarefas } = await supabase
      .from("tarefa")
      .select("id_tarefa, id_disciplina, titulo, data_entrega")
      .in("id_disciplina", disciplinasIds)
      .order("data_entrega", { ascending: true });

    if (!tarefas || tarefas.length === 0) {
      container.innerHTML = `<p class="text-gray-500">Nenhuma tarefa cadastrada.</p>`;
      return;
    }

    const { data: entregas } = await supabase
      .from("entrega_tarefa")
      .select("id_tarefa, id_aluno, status, data_submissao")
      .eq("id_aluno", id_aluno);

    console.log("📦 ENTREGAS:", entregas);

    const entregasMap = {};

    entregas?.forEach((e) => {
      if (!entregasMap[e.id_tarefa]) {
        entregasMap[e.id_tarefa] = [];
      }
      entregasMap[e.id_tarefa].push(e);
    });

    // agora pega a entrega mais recente de cada tarefa
    Object.keys(entregasMap).forEach((id) => {
      entregasMap[id] = entregasMap[id].sort(
        (a, b) => new Date(b.data_submissao) - new Date(a.data_submissao)
      )[0]; // ← usa só a MAIS NOVA
    });

    const tarefasFinal = tarefas.map((t) => {
      const entrega = entregasMap[t.id_tarefa];
      const agora = new Date();
      const limite = new Date(t.data_entrega);

      let status = "pendente";

      if (entrega) {
        const st = entrega.status?.toUpperCase();

        if (st === "AVALIADA" || st === "ENVIADA") {
          status = "entregue";
        } else {
          status = "pendente";
        }
      } else if (agora > limite) {
        status = "atrasado";
      }

      return {
        ...t,
        status,
        diferenca: limite - agora,
      };
    });

    const pendentes = tarefasFinal.filter((t) => t.status !== "entregue");
    document.getElementById("qtdPendentes").textContent = pendentes.length;

    if (pendentes.length === 0) {
      container.innerHTML = `<p class="text-gray-500">Nenhuma atividade pendente 🎉</p>`;
      return;
    }

    container.innerHTML = pendentes
      .map((t) => {
        const corDisciplina = ["purple", "orange", "blue", "pink"][
          t.id_disciplina % 4
        ];
        const badgeClass = {
          purple: "bg-purple-100 text-purple-600",
          orange: "bg-orange-100 text-orange-600",
          blue: "bg-blue-100 text-blue-600",
          pink: "bg-pink-100 text-pink-600",
        }[corDisciplina];

        const dataEntregaBR = new Date(t.data_entrega)
          .toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
          .replace(",", "");

        return `
        <div 
          onclick="window.location.hash = '#/tarefa?tid=${t.id_tarefa}'"
          class="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <h4 class="font-bold text-gray-900 mb-2">${t.titulo}</h4>

          <div class="flex flex-col space-x-2">
            <span class="${badgeClass} text-xs font-semibold px-2 py-1 rounded-full">
              Disciplina ${t.id_disciplina}
            </span>

            <div class="flex items-center text-xs ${
              t.status === "atrasado" ? "text-red-500" : "text-gray-600"
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" 
                viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" class="mr-1">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>${dataEntregaBR}</span>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  carregarPagina();
}
