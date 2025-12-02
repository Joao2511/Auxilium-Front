import { supabase } from "../../utils/supabaseClient.js";

export async function criarTarefa({
  id_disciplina,
  titulo,
  descricao,
  data_entrega,
  pontos_maximos,
}) {
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

  const { error: errEntrega } = await supabase
    .from("entrega_tarefa")
    .update({
      status: "AVALIADA",
      nota_calculada: nota_valor,
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
