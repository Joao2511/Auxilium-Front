import * as resetPasswordModel from "../models/resetPasswordModel.js";

/**
 * Controller for handling password reset functionality
 */
class ResetPasswordController {
  /**
   * Sends password reset email to the user
   * @param {string} email - User's email address
   * @returns {Promise<{error: object}>}
   */
  static async sendResetEmail(email) {
    try {
      return await resetPasswordModel.sendResetEmail(email);
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
  static async updatePassword(newPassword) {
    try {
      return await resetPasswordModel.updatePassword(newPassword);
    } catch (err) {
      console.error("Unexpected error in updatePassword:", err);
      return { error: err };
    }
  }

  /**
   * Checks if user has a valid session for password reset
   * @returns {Promise<boolean>}
   */
  static async isValidResetSession() {
    try {
      return await resetPasswordModel.isValidResetSession();
    } catch (err) {
      console.error("Unexpected error in isValidResetSession:", err);
      return false;
    }
  }
}

export default ResetPasswordController;