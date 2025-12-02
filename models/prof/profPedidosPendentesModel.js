import { supabase } from "../../utils/supabaseClient.js";

export async function listarPedidosPendentes(id_disciplina) {
  // First get the pending requests
  const { data: pendentes, error: errorPendentes } = await supabase
    .from("usuario_disciplina_pendentes")
    .select("id, id_usuario, id_disciplina, data_solicitacao")
    .eq("id_disciplina", id_disciplina)
    .order("data_solicitacao", { ascending: false });

  if (errorPendentes) throw errorPendentes;

  if (!pendentes || pendentes.length === 0) {
    return [];
  }

  // Get user IDs
  const userIds = pendentes.map((p) => p.id_usuario);

  // Fetch user data separately
  const { data: usuarios, error: errorUsuarios } = await supabase
    .from("usuario")
    .select("id_usuario, nome_completo, email_institucional")
    .in("id_usuario", userIds);

  if (errorUsuarios) throw errorUsuarios;

  // Combine the data
  return pendentes.map((p) => {
    const usuario = usuarios?.find((u) => u.id_usuario === p.id_usuario);
    return {
      id: p.id,
      id_usuario: p.id_usuario,
      id_disciplina: p.id_disciplina,
      data_solicitacao: p.data_solicitacao,
      nome: usuario?.nome_completo || "Nome não disponível",
      email: usuario?.email_institucional || "Email não disponível",
    };
  });
}

export async function aprovarPedido(id_usuario, id_disciplina) {
  const { data, error } = await supabase.rpc("aprovar_matricula", {
    p_id_usuario: id_usuario,
    p_id_disciplina: id_disciplina,
  });

  if (error) throw error;
  return data;
}

export async function recusarPedido(id_usuario, id_disciplina) {
  const { error } = await supabase
    .from("usuario_disciplina_pendentes")
    .delete()
    .eq("id_usuario", id_usuario)
    .eq("id_disciplina", id_disciplina);

  if (error) throw error;
  return true;
}
