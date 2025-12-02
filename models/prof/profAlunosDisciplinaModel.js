import { supabase } from "../../utils/supabaseClient.js";

export async function listarAlunosMatriculados(id_disciplina) {
  console.log("Buscando alunos para disciplina:", id_disciplina);
  
  // First get the enrolled students
  const { data: matriculas, error: errorMatriculas } = await supabase
    .from("usuario_disciplina")
    .select("id_usuario, id_disciplina, data_inscricao")
    .eq("id_disciplina", id_disciplina)
    .order("data_inscricao", { ascending: false });

  console.log("Matrículas encontradas:", matriculas);
  console.log("Erro nas matrículas:", errorMatriculas);

  if (errorMatriculas) throw errorMatriculas;

  if (!matriculas || matriculas.length === 0) {
    console.log("Nenhuma matrícula encontrada");
    return [];
  }

  // Get user IDs
  const userIds = matriculas.map((m) => m.id_usuario);
  console.log("IDs dos usuários:", userIds);

  // Fetch user data separately
  const { data: usuarios, error: errorUsuarios } = await supabase
    .from("usuario")
    .select("id_usuario, nome_completo, email_institucional")
    .in("id_usuario", userIds);

  console.log("Usuários encontrados:", usuarios);
  console.log("Erro nos usuários:", errorUsuarios);

  if (errorUsuarios) throw errorUsuarios;

  // Combine the data
  const resultado = matriculas.map((m) => {
    const usuario = usuarios?.find((u) => u.id_usuario === m.id_usuario);
    return {
      id_usuario: m.id_usuario,
      id_disciplina: m.id_disciplina,
      data_inscricao: m.data_inscricao,
      nome: usuario?.nome_completo || "Nome não disponível",
      email: usuario?.email_institucional || "Email não disponível",
    };
  });
  
  console.log("Resultado final:", resultado);
  return resultado;
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
