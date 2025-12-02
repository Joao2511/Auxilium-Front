import { supabase } from "../../utils/supabaseClient.js";

export async function listarDisciplinasDoProfessor() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão");
  const { data, error } = await supabase
    .from("disciplina")
    .select("id_disciplina, nome, codigo_matricula")
    .eq("id_professor", user.id)
    .order("id_disciplina", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function criarDisciplina(nome) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão");
  const codigo = Math.random().toString(36).slice(2, 8).toUpperCase();

  const { data, error } = await supabase
    .from("disciplina")
    .insert({ id_professor: user.id, nome, codigo_matricula: codigo })
    .select("id_disciplina, nome, codigo_matricula")
    .single();
  if (error) throw error;
  return data;
}

export async function listarAlunosDaDisciplina(id_disciplina) {
  const { data, error } = await supabase
    .from("usuario_disciplina")
    .select("id_usuario, usuario!inner(nome_completo, email_institucional)")
    .eq("id_disciplina", id_disciplina);
  if (error) throw error;
  return (data || []).map((r) => ({
    id_usuario: r.id_usuario,
    nome: r.usuario?.nome_completo,
    email: r.usuario?.email_institucional,
  }));
}

export async function deletarDisciplina(id_disciplina) {
  console.log("Iniciando deleção da disciplina:", id_disciplina);
  
  // Call the Supabase function that handles cascade deletion
  const { data, error } = await supabase.rpc("deletar_disciplina_completa", {
    p_id_disciplina: id_disciplina,
  });

  if (error) {
    console.error("Erro ao deletar disciplina:", error);
    throw error;
  }
  
  console.log("Disciplina deletada com sucesso!");
  return true;
}
