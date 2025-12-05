import { supabase } from "../utils/supabaseClient.js";

/**
 * Model for handling password reset functionality
 */

/**
 * Sends password reset email to the user
 * @param {string} email - User's email address
 * @returns {Promise<{error: object}>}
 */
export async function sendResetEmail(email) {
  try {
    // Ensure we're using the correct protocol and removing any trailing slashes
    const baseUrl = 'https://auxilium-front-dev.vercel.app';
    const redirectUrl = `${baseUrl}/pages/nova-senha.html`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error("Error sending reset email:", error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error("Unexpected error in sendResetEmail:", err);
    return { error: err };
  }
}

/**
 * Updates user's password
 * @param {string} newPassword - New password
 * @returns {Promise<{error: object}>}
 */
export async function updatePassword(newPassword) {
  try {
    // Debug: Check current session status
    const { data: { session }, error: sessionCheckError } = await supabase.auth.getSession();
    console.log("Current session:", session);
    console.log("Session check error:", sessionCheckError);
    
    // For password reset flow, we should use the special session that Supabase creates
    // when the user accesses the reset link. We don't need to manually set the session.
    
    // Update the user's password directly using the current session
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Error updating password:", error);
      // If we get an auth session error, it might mean the session wasn't established properly
      if (error.message.includes('Auth session missing')) {
        return { error: new Error('O link de redefinição de senha expirou. Por favor, solicite um novo link.') };
      }
      return { error };
    }

    // Sign out the user after successful password update to force re-authentication
    await supabase.auth.signOut();

    return { error: null };
  } catch (err) {
    console.error("Unexpected error in updatePassword:", err);
    return { error: err };
  }
}

/**
 * Checks if user has a valid session for password reset
 * @returns {Promise<boolean>}
 */
export async function isValidResetSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (err) {
    console.error("Error checking reset session:", err);
    return false;
  }
}