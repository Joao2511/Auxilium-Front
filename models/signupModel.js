import { supabase } from "../utils/supabaseClient.js";

/**
 * Creates user profile after email confirmation
 * @param {string} userId - Supabase user ID
 * @param {string} fullName - User's full name
 * @param {number} userType - User type (1 for student, 2 for professor)
 * @param {string} accountStatus - Account status
 * @returns {Promise<{error: object}>}
 */
export async function createUserProfile(userId, fullName, userType, accountStatus) {
  try {
    const { error } = await supabase
      .from("usuario")
      .insert({
        id_usuario: userId,
        nome_completo: fullName,
        id_tipo: userType,
        status_conta: accountStatus,
        pontos_total: 0,
        visibilidade_ranking: true
      });

    if (error) {
      console.error("Error creating user profile:", error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error("Unexpected error in createUserProfile:", err);
    return { error: err };
  }
}

/**
 * Creates professor request
 * @param {string} userId - Supabase user ID
 * @param {string} justification - Professor's justification
 * @returns {Promise<{error: object}>}
 */
export async function createProfessorRequest(userId, justification) {
  try {
    const { error } = await supabase
      .from("solicitacao_professor")
      .insert({
        id_usuario: userId,
        justificativa: justification,
        status: "pendente",
      });

    if (error) {
      console.error("Error creating professor request:", error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error("Unexpected error in createProfessorRequest:", err);
    return { error: err };
  }
}