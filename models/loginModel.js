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

  // Check if user has confirmed their email
  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    return {
      data: null,
      error: {
        message:
          "Sua conta ainda não foi verificada! Verifique seu email.",
      },
    };
  }

  // Check if user profile exists, if not create it from app_metadata
  const { data: usuario, error: userError } = await supabase
    .from("usuario")
    .select("status_conta, id_tipo, nome_completo")
    .eq("id_usuario", data.user.id)
    .single();

  if (userError && userError.code !== 'PGRST116') { // PGRST116 means no rows returned
    return { data: null, error: userError };
  }

  // If user profile doesn't exist, create it from app_metadata
  if (!usuario && data.user.app_metadata) {
    const appData = data.user.app_metadata;
    const { error: insertError } = await supabase
      .from("usuario")
      .insert({
        id_usuario: data.user.id,
        nome_completo: appData.nome_completo,
        id_tipo: appData.id_tipo,
        status_conta: appData.status_conta,
        pontos_total: 0,
        visibilidade_ranking: true
      });

    if (insertError) {
      return { data: null, error: insertError };
    }

    // If this is a professor account, also create the professor request
    if (appData.id_tipo === 2 && appData.justificativa) {
      const { error: requestError } = await supabase
        .from("solicitacao_professor")
        .insert({
          id_usuario: data.user.id,
          justificativa: appData.justificativa,
          status: "pendente",
        });

      if (requestError) {
        return { data: null, error: requestError };
      }
    }

    // Fetch the newly created user profile
    const { data: newUsuario, error: newUserError } = await supabase
      .from("usuario")
      .select("status_conta, id_tipo, nome_completo")
      .eq("id_usuario", data.user.id)
      .single();

    if (newUserError) return { data: null, error: newUserError };

    const responseData = {
      ...data,
      usuario: newUsuario,
    };

    return { data: responseData, error: null };
  }

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
  // Ensure we're using the correct protocol and removing any trailing slashes
  const baseUrl = window.location.origin.replace(/\/$/, '');
  const redirectUrl = `${baseUrl}/pages/nova-senha.html`;
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
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