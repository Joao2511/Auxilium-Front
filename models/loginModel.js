import { supabase } from "../utils/supabaseClient.js";

/**
 *
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<{data: object, error: object}>}
 */
export async function fazerLogin(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) return { data: null, error };

  const { data: usuario, error: userError } = await supabase
    .from("usuario")
    .select("status_conta, id_tipo, nome_completo")
    .eq("id_usuario", data.user.id)
    .single();

  if (userError) return { data: null, error: userError };

  if (usuario.status_conta === "pendente_aprovacao") {
    await supabase.auth.signOut();
    return {
      data: null,
      error: {
        message:
          "Sua conta de professor está aguardando aprovação. Você receberá um e-mail quando for aprovada.",
      },
    };
  }

  const responseData = {
    ...data,
    usuario: usuario,
  };

  return { data: responseData, error: null };
}

/**
 *
 *
 * @param {string} email
 * @returns {Promise<{error: object}>}
 */
export async function resetarSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/pages/nova-senha.html",
  });
  return { error };
}

/**
 *
 *
 * @returns {Promise<object|null>}
 */
export async function getUsuarioLogado() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 *
 * @returns {Promise<{error: object}>}
 */

export async function fazerLogout() {
  const { error } = await supabase.auth.signOut();

  localStorage.removeItem("user_tipo");
  localStorage.removeItem("user_nome");
  localStorage.removeItem("user_id");

  return { error };
}
