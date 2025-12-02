import { supabase } from "../../utils/supabaseClient.js";

export async function listarAlunosMatriculados(id_disciplina) {
  const { data, error } = await supabase
    .from("usuario_disciplina")
    .select(
      `
      id_usuario,
      id_disciplina,
      data_inscricao,
      usuario:usuario!usuario_disciplina_id_usuario_fkey(
        id_usuario,
        nome_completo,
        email_institucional
      )
    `
    )
    .eq("id_disciplina", id_disciplina)
    .order("data_inscricao", { ascending: false });

  if (error) throw error;

  return (data || []).map((r) => ({
    id_usuario: r.id_usuario,
    id_disciplina: r.id_disciplina,
    data_inscricao: r.data_inscricao,
    nome: r.usuario?.nome_completo || "Nome não disponível",
    email: r.usuario?.email_institucional || "Email não disponível",
  }));
}

export async function removerAluno(id_usuario, id_disciplina) {
  const { error } = await supabase
    .from("usuario_disciplina")
    .delete()
    .eq("id_usuario", id_usuario)
    .eq("id_disciplina", id_disciplina);

  if (error) throw error;
  return true;
}
