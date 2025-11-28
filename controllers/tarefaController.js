import { supabase } from "../utils/supabaseClient.js";
import { router } from "../app.js";
import Utils from "../utils.js";
import { getPontosDaTarefa } from "../utils/tarefas.js";

export default {
  async index() {
    console.log("📄 Tela de Tarefa | Carregando...");

    const app = document.getElementById("app");
    const res = await fetch("pages/tarefa_detalhe.html");
    app.innerHTML = await res.text();

    await new Promise((r) => requestAnimationFrame(r));

    // === ELEMENTOS ===
    const card = document.getElementById("tarefaWrapper");
    const btnVoltar = document.getElementById("btnVoltar");
    const listaEntregas = document.getElementById("entregasLista");
    const selectedFilesDiv = document.getElementById("selectedFiles");
    const btnEnviar = document.getElementById("btnEnviar");
    const fileInput = document.getElementById("arquivoInput");

    // === URL PARAMS ===
    const url = new URL(window.location.href);
    const id_tarefa = parseInt(url.searchParams.get("tid"), 10);

    if (!id_tarefa || isNaN(id_tarefa)) {
      Utils.showMessageToast(
        "error",
        "Tarefa inválida",
        "A tarefa selecionada não é válida.",
        3000
      );
      return router.navigate("/disciplinas");
    }

    // === SESSÃO ===
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;

    if (!session) {
      window.location.href = "/login.html";
      return;
    }

    const id_aluno = session.user.id;

    // === BUSCAR TAREFA ===
    const { data: tarefa, error: tarefaError } = await supabase
      .from("tarefa")
      .select(
        `
        id_tarefa,
        titulo,
        descricao,
        data_entrega,
        pontos_maximos,
        entrega_tarefa (
          id_entrega,
          caminho_arquivo,
          data_submissao,
          status,
          nota_calculada,
          nota:nota (
            nota_valor,
            observacoes
          )
        )
      `
      )
      .eq("id_tarefa", id_tarefa)
      .maybeSingle();

    const entregasAluno =
      tarefa.entrega_tarefa?.filter((e) => e.id_aluno === id_aluno) ?? [];

    if (tarefaError || !tarefa) {
      Utils.showMessageToast(
        "error",
        "Erro ao carregar tarefa",
        "Não foi possível carregar os detalhes da tarefa. Tente novamente.",
        5000
      );
      console.error(tarefaError);
      return;
    }

    // === POPULAR TELA ===
    card.querySelector(".__titulo").textContent = tarefa.titulo;
    card.querySelector(".__descricao").textContent =
      tarefa.descricao || "Sem descrição fornecida.";

    const dt = new Date(tarefa.data_entrega);
    card.querySelector(".__data").textContent = dt.toLocaleDateString("pt-BR");
    card.querySelector(".__hora").textContent = dt.toLocaleTimeString("pt-BR");
    card.querySelector(".__pontos").textContent = tarefa.pontos_maximos;

    // === ATRASO ===
    if (new Date() > dt) {
      document.getElementById("alertAtraso").classList.remove("hidden");
    }

    // === ENTREGAS ANTERIORES ===
    if (entregasAluno.length > 0) {
      listaEntregas.innerHTML = entregasAluno
        .map((e) => {
          const fileName = e.caminho_arquivo.split("/").pop();
          return `
        <div class="bg-white border rounded-xl p-4 shadow-sm">
          <div class="flex justify-between items-start mb-2">
            <div>
              <p class="font-semibold text-gray-800">${fileName}</p>
              <p class="text-xs text-gray-500">
                Enviado: ${new Date(e.data_submissao).toLocaleString("pt-BR")}
              </p>
              <p class="text-xs text-gray-500">
                Status: ${e.status || "—"}
              </p>
            </div>

            ${
              e.nota?.[0]?.nota_valor || e.nota_calculada
                ? `
              <div class="w-12 h-12 bg-green-100 text-green-700 flex items-center justify-center rounded-xl font-bold text-lg">
                ${e.nota?.[0]?.nota_valor ?? e.nota_calculada}
              </div>`
                : ""
            }
          </div>

          ${
            e.nota?.[0]?.observacoes
              ? `
          <div class="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
            <p class="text-xs text-yellow-800 font-semibold mb-1">Observações do Professor:</p>
            <p class="text-xs text-yellow-700">${e.nota[0].observacoes}</p>
          </div>`
              : ""
          }
        </div>`;
        })
        .join("");
    } else {
      listaEntregas.innerHTML = `
    <div class="text-center py-6 text-gray-500">
      Nenhuma entrega enviada ainda.
    </div>
  `;
    }

    // === PREVIEW DOS ARQUIVOS ===
    // Remove any existing event listeners by cloning the element
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);

    newFileInput.addEventListener("change", () => {
      const files = newFileInput.files;

      if (files.length === 0) {
        selectedFilesDiv.innerHTML = "";
        return;
      }

      selectedFilesDiv.innerHTML = `
        <div class="bg-white border rounded-lg p-3 space-y-2">
          <p class="font-semibold text-purple-600 text-sm mb-2">${
            files.length
          } arquivo(s) selecionado(s):</p>
          ${Array.from(files)
            .map(
              (f) => `
            <div class="flex items-center justify-between text-xs">
              <span class="truncate">${f.name}</span>
              <span class="text-gray-500">${(f.size / 1024 / 1024).toFixed(
                2
              )} MB</span>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    });

    // === ENVIO DOS ARQUIVOS ===
    // Remove any existing event listeners by cloning the element
    const newBtnEnviar = btnEnviar.cloneNode(true);
    btnEnviar.parentNode.replaceChild(newBtnEnviar, btnEnviar);

    newBtnEnviar.addEventListener("click", async () => {
      const files = newFileInput.files;

      if (!files.length) {
        Utils.showMessageToast(
          "warning",
          "Nenhum arquivo selecionado",
          "Por favor, selecione pelo menos um arquivo para enviar.",
          3000
        );
        return;
      }

      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) {
          Utils.showMessageToast(
            "warning",
            "Arquivo muito grande",
            `O arquivo ${file.name} ultrapassa 20 MB!`,
            3000
          );
          continue;
        }

        const path = `${id_aluno}/${id_tarefa}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("entregas")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          console.error(uploadError);
          Utils.showMessageToast(
            "error",
            "Erro ao enviar arquivo",
            `Não foi possível enviar o arquivo ${file.name}. Tente novamente.`,
            5000
          );
          continue;
        }

        await supabase.from("entrega_tarefa").insert({
          id_tarefa,
          id_aluno,
          caminho_arquivo: path,
          status: "ENVIADA",
          data_submissao: new Date().toISOString(),
        });

        // Adicionar pontos ao usuário após entrega da tarefa
        const pontos = await getPontosDaTarefa(id_tarefa);
        await supabase.rpc("adicionar_pontos", {
          user_id: id_aluno,
          pontos,
        });
      }

      Utils.showMessageToast(
        "success",
        "Arquivos enviados!",
        "Seus arquivos foram enviados com sucesso.",
        3000
      );
      // Redirect to disciplines screen
      router.navigate("/disciplinas");
    });

    // === VOLTAR ===
    btnVoltar.addEventListener("click", () => {
      history.back();
    });
  },
};
