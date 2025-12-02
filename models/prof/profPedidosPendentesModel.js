import { supabase } from "../../utils/supabaseClient.js";

export async function listarPedidosPendentes(id_disciplina) {
  const { data, error } = await supabase
    .from("usuario_disciplina_pendentes")
    .select(
      `
      id,
      id_usuario,
      id_disciplina,
      data_solicitacao,
      usuario:usuario!usuario_disciplina_pendentes_id_usuario_fkey(
        id_usuario,
        nome_completo,
        email_institucional
      )
    `
    )
    .eq("id_disciplina", id_disciplina)
    .order("data_solicitacao", { ascending: false });

  if (error) throw error;

  return (data || []).map((r) => ({
    id: r.id,
    id_usuario: r.id_usuario,
    id_disciplina: r.id_disciplina,
    data_solicitacao: r.data_solicitacao,
    nome: r.usuario?.nome_completo || "Nome não disponível",
    email: r.usuario?.email_institucional || "Email não disponível",
  }));
}

export async function aprovarPedido(id_pedido) {
  // Call the Supabase function aprovar_matricula
  const { data, error } = await supabase.rpc("aprovar_matricula", {
    p_id: id_pedido,
  });

  if (error) throw error;
  return data;
}

export async function recusarPedido(id_pedido) {
  const { error } = await supabase
    .from("usuario_disciplina_pendentes")
    .delete()
    .eq("id", id_pedido);

  if (error) throw error;
  return true;
}
