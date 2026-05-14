/**
 * LinkedIn Service — Profile Analysis & Resume Generation
 * 
 * All LinkedIn features use user-pasted profile text (no scraping).
 * Users copy their LinkedIn About/Experience/Skills sections and paste them.
 */

const aiService = require('./aiService');
const logger = require('../utils/logger');

const linkedinService = {
  /**
   * Analyze a LinkedIn profile and provide improvement suggestions.
   * @param {string} profileText - User-pasted LinkedIn profile content
   * @returns {Promise<Object>} Analysis with scores and tips
   */
  async analyzeProfile(profileText) {
    if (!profileText || profileText.length < 50) {
      throw new Error('Profile text is too short. Please paste your full LinkedIn profile content.');
    }

    logger.info('Analyzing LinkedIn profile', { textLength: profileText.length });
    const result = await aiService.analyzeLinkedIn(profileText);
    return result;
  },

  /**
   * Generate an ATS-optimized resume from LinkedIn profile data.
   * @param {string} profileText - LinkedIn profile content
   * @param {string} targetRole - Desired job title/role
   * @returns {Promise<Object>} Generated resume with markdown and text versions
   */
  async generateResume(profileText, targetRole) {
    if (!profileText || profileText.length < 50) {
      throw new Error('Profile text is too short. Please paste your full LinkedIn profile content.');
    }

    if (!targetRole || targetRole.length < 3) {
      throw new Error('Please specify a target role (e.g., "Senior Software Engineer").');
    }

    logger.info('Generating resume from LinkedIn', { targetRole, textLength: profileText.length });
    const result = await aiService.generateResumeFromLinkedIn(profileText, targetRole);
    return result;
  },
};

module.exports = linkedinService;
