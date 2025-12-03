import * as signupModel from "../models/signupModel.js";

/**
 * Controller for handling signup functionality
 */
class SignupController {
  /**
   * Creates user profile after email confirmation
   * @param {string} userId - Supabase user ID
   * @param {string} fullName - User's full name
   * @param {number} userType - User type (1 for student, 2 for professor)
   * @param {string} accountStatus - Account status
   * @returns {Promise<{error: object}>}
   */
  static async createUserProfile(userId, fullName, userType, accountStatus) {
    try {
      return await signupModel.createUserProfile(userId, fullName, userType, accountStatus);
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
  static async createProfessorRequest(userId, justification) {
    try {
      return await signupModel.createProfessorRequest(userId, justification);
    } catch (err) {
      console.error("Unexpected error in createProfessorRequest:", err);
      return { error: err };
    }
  }
}

export default SignupController;