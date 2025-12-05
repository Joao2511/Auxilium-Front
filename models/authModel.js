import { supabase } from "../utils/supabaseClient.js";

export async function cadastrarUsuario(email, senha, nome, tipoId) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: senha,
    options: {
      emailRedirectTo: 'https://auxilium-front-dev.vercel.app/pages/email-confirmado.html'
    }
  });

  if (authError) {
    console.error("Erro no signUp:", authError.message);
    return { user: null, error: authError };
  }

  const { data: userData, error: updateError } = await supabase
    .from("usuario")
    .update({
      nome_completo: nome,
      id_tipo: tipoId,
    })
    .eq("id_usuario", authData.user.id);

  if (updateError) {
    console.error("Erro ao atualizar perfil:", updateError.message);
    return { user: null, error: updateError };
  }

  return { user: authData.user, error: null };
}
