/**
 * Career Controller — Cover Letters, Interview Prep, Skills Gap, Salary Insights
 * 
 * All endpoints require authentication.
 * All endpoints accept resume text via request body (no file upload needed).
 */

const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const careerController = {
  /**
   * POST /api/career/cover-letter
   * Generate a tailored cover letter from resume + job description.
   */
  async generateCoverLetter(req, res, next) {
    try {
      const { resumeText, jobDescription, tone } = req.body;

      if (!resumeText || !jobDescription) {
        return res.status(400).json({
          success: false,
          error: { message: 'resumeText and jobDescription are required' },
        });
      }

      logger.info('Generating cover letter', { userId: req.user.id });

      const result = await aiService.generateCoverLetter(resumeText, jobDescription, tone || 'professional');

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/career/interview-prep
   * Generate interview preparation material.
   */
  async prepareInterview(req, res, next) {
    try {
      const { resumeText, jobDescription } = req.body;

      if (!resumeText || !jobDescription) {
        return res.status(400).json({
          success: false,
          error: { message: 'resumeText and jobDescription are required' },
        });
      }

      logger.info('Generating interview prep', { userId: req.user.id });

      const result = await aiService.prepareInterview(resumeText, jobDescription);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/career/skills-gap
   * Analyze skills gap and provide learning roadmap.
   */
  async analyzeSkillsGap(req, res, next) {
    try {
      const { resumeText, targetRole } = req.body;

      if (!resumeText || !targetRole) {
        return res.status(400).json({
          success: false,
          error: { message: 'resumeText and targetRole are required' },
        });
      }

      logger.info('Analyzing skills gap', { userId: req.user.id, targetRole });

      const result = await aiService.analyzeSkillsGap(resumeText, targetRole);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/career/salary-insights
   * Get salary insights and negotiation tips.
   */
  async getSalaryInsights(req, res, next) {
    try {
      const { resumeText, targetRole, location } = req.body;

      if (!resumeText || !targetRole || !location) {
        return res.status(400).json({
          success: false,
          error: { message: 'resumeText, targetRole, and location are required' },
        });
      }

      logger.info('Getting salary insights', { userId: req.user.id, targetRole, location });

      const result = await aiService.getSalaryInsights(resumeText, targetRole, location);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = careerController;
