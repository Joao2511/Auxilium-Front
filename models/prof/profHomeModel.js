import { supabase } from "../../utils/supabaseClient.js";

/**
 * Fetches statistics for the professor's dashboard
 * @returns {Promise<Object>} Object containing disciplines count and tasks count
 */
export async function fetchProfessorStats() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    // Fetch disciplines count
    const { count: disciplinasCount, error: disciplinasError } = await supabase
      .from("disciplina")
      .select("*", { count: "exact" })
      .eq("id_professor", user.id);

    if (disciplinasError) {
      console.error("Error fetching disciplines count:", disciplinasError);
      throw disciplinasError;
    }

    // First get the discipline IDs for this professor
    const { data: disciplinas, error: disciplinasDataError } = await supabase
      .from("disciplina")
      .select("id_disciplina")
      .eq("id_professor", user.id);

    if (disciplinasDataError) {
      console.error("Error fetching discipline IDs:", disciplinasDataError);
      throw disciplinasDataError;
    }

    // Extract discipline IDs
    const disciplinaIds = disciplinas.map(d => d.id_disciplina);

    // Fetch tasks count
    let tarefasCount = 0;
    if (disciplinaIds.length > 0) {
      const { count, error: tarefasError } = await supabase
        .from("tarefa")
        .select("*", { count: "exact" })
        .in("id_disciplina", disciplinaIds);

      if (tarefasError) {
        console.error("Error fetching tasks count:", tarefasError);
        throw tarefasError;
      }

      tarefasCount = count || 0;
    }

    return {
      disciplinasCount: disciplinasCount || 0,
      tarefasCount: tarefasCount
    };
  } catch (error) {
    console.error("Error in fetchProfessorStats:", error);
    return {
      disciplinasCount: 0,
      tarefasCount: 0
    };
  }
}