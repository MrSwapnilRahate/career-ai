/**
 * LinkedIn Controller
 * 
 * POST /api/linkedin/analyze          — Analyze LinkedIn profile
 * POST /api/linkedin/generate-resume  — Generate resume from LinkedIn
 */

const linkedinService = require('../services/linkedinService');
const { incrementUsage } = require('../middleware/subscriptionMiddleware');

/**
 * POST /api/linkedin/analyze
 */
exports.analyzeProfile = async (req, res, next) => {
  try {
    const { profileText } = req.body;

    if (!profileText || profileText.length < 50) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please paste your full LinkedIn profile text (About, Experience, Skills sections).' },
      });
    }

    const result = await linkedinService.analyzeProfile(profileText);

    // Track usage
    await incrementUsage(req.user.id, 'linkedinAnalyses');

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/linkedin/generate-resume
 */
exports.generateResume = async (req, res, next) => {
  try {
    const { profileText, targetRole } = req.body;

    if (!profileText || profileText.length < 50) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please paste your full LinkedIn profile text.' },
      });
    }

    if (!targetRole || targetRole.length < 3) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please specify a target role (e.g., "Senior Software Engineer").' },
      });
    }

    const result = await linkedinService.generateResume(profileText, targetRole);

    // Track usage
    await incrementUsage(req.user.id, 'resumeGenerations');

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
