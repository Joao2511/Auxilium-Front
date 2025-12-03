import { supabase } from "../../utils/supabaseClient.js";

export async function criarTarefa({
  id_disciplina,
  titulo,
  descricao,
  data_entrega,
}) {
  // Calcular pontos máximos baseado na duração
  const agora = new Date();
  const entrega = new Date(data_entrega);
  const diffHoras = (entrega - agora) / (1000 * 60 * 60);

  // Base de 100 pontos + 10 pontos por hora.
  // Isso garante que tarefas curtas valham bastante (alta densidade),
  // mas tarefas longas valham mais no total.
  // Ex: 5h -> 150 pts (30/h). 24h -> 340 pts (14/h).
  let pontos_maximos = Math.round(100 + (diffHoras * 10));

  // Limitar entre 100 e 1000
  pontos_maximos = Math.max(100, Math.min(pontos_maximos, 1000));

  const { data, error } = await supabase
    .from("tarefa")
    .insert({
      id_disciplina,
      titulo,
      descricao,
      data_entrega,
      pontos_maximos,
      data_cadastro: new Date().toISOString(),
      prioridade: null,
    })
    .select("id_tarefa, titulo, data_entrega, pontos_maximos")
    .single();

  if (error) throw error;
  return data;
}

export async function listarTarefas(id_disciplina) {
  const { data, error } = await supabase
    .from("tarefa")
    .select(
      "id_tarefa, titulo, descricao, data_entrega, pontos_maximos, data_cadastro"
    )
    .eq("id_disciplina", id_disciplina)
    .order("data_cadastro", { ascending: false });

  if (error) throw error;
  return data || [];
}
export async function listarEntregasDaTarefa(id_tarefa) {
  const { data, error } = await supabase
    .from("entrega_tarefa")
    .select(
      `
      id_entrega,
      id_aluno,
      caminho_arquivo,
      data_submissao,
      status,
      nota_calculada,
      atraso_horas,
      usuario:usuario(id_usuario, nome_completo, email_institucional),
      nota:nota(id_nota, nota_valor, observacoes)
    `
    )
    .eq("id_tarefa", id_tarefa)
    .order("data_submissao", { ascending: true });

  if (error) throw error;
  return data || [];
}

function calcularPontuacao({
  dataCriacao,
  dataEntrega,
  dataSubmissao,
  pontosMaximos
}) {
  const criacao = new Date(dataCriacao);
  const entrega = new Date(dataEntrega);
  const submissao = new Date(dataSubmissao);

  const tempoTotal = entrega - criacao;     // total do prazo
  const tempoRestante = entrega - submissao; // quanto faltava ao entregar

  let progresso = tempoTotal !== 0 ? tempoRestante / tempoTotal : 0;


  // ATRASO
  if (progresso < 0) {
    const horasAtraso = Math.abs(tempoRestante) / (1000 * 60 * 60);
    return Math.max(
      5,
      Math.round(pontosMaximos * Math.exp(-0.4 * horasAtraso))
    );
  }

  // ENTREGA ANTECIPADA
  progresso = Math.min(Math.max(progresso, 0), 1);
  const curva = Math.pow(progresso, 0.6);
  const pontos = (0.5 + 0.5 * curva) * pontosMaximos;

  return Math.round(pontos);
}

export async function avaliarEntrega({ id_entrega, nota_valor, observacoes }) {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const id_avaliador = userData?.user?.id;
  if (!id_avaliador) throw new Error("Usuário não autenticado.");

  const { data: existente } = await supabase
    .from("nota")
    .select("id_nota")
    .eq("id_entrega", id_entrega)
    .maybeSingle();

  if (existente) {
    const { error: errUpd } = await supabase
      .from("nota")
      .update({
        nota_valor,
        observacoes,
        data_avaliacao: new Date().toISOString(),
      })
      .eq("id_nota", existente.id_nota);
    if (errUpd) throw errUpd;
  } else {
    const { error: errIns } = await supabase.from("nota").insert({
      id_entrega,
      id_avaliador,
      nota_valor,
      data_avaliacao: new Date().toISOString(),
      observacoes,
    });
    if (errIns) throw errIns;
  }

  const { data: dadosEntrega } = await supabase
    .from("entrega_tarefa")
    .select(`
    data_submissao,
    tarefa:id_tarefa ( data_cadastro, data_entrega, pontos_maximos )

  `)
    .eq("id_entrega", id_entrega)
    .single();

  const pontosCalculados = calcularPontuacao({
    dataCriacao: dadosEntrega.tarefa.data_cadastro,
    dataEntrega: dadosEntrega.tarefa.data_entrega,
    dataSubmissao: dadosEntrega.data_submissao || new Date(),
    pontosMaximos: dadosEntrega.tarefa.pontos_maximos
  });

  // Atualizar a entrega com a nota calculada
  const { error: errEntrega } = await supabase
    .from("entrega_tarefa")
    .update({
      status: "AVALIADA",
      nota_calculada: pontosCalculados,
    })
    .eq("id_entrega", id_entrega);

    if (errEntrega) throw errEntrega;

  return true;
}

export async function deletarTarefa(id_tarefa) {
  const { error } = await supabase
    .from("tarefa")
    .delete()
    .eq("id_tarefa", id_tarefa);

  if (error) throw error;
  return true;
}
