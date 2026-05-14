/**
 * Image Controller
 * 
 * POST /api/images/headshot   — Generate professional headshot
 * POST /api/images/cover      — Generate cover/banner photo
 */

const imageService = require('../services/imageService');
const { incrementUsage } = require('../middleware/subscriptionMiddleware');

/**
 * POST /api/images/headshot
 */
exports.generateHeadshot = async (req, res, next) => {
  try {
    const { style = 'corporate', gender = 'neutral', additionalDetails = '' } = req.body;

    const validStyles = ['corporate', 'creative', 'tech', 'academic', 'healthcare'];
    if (!validStyles.includes(style)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid style. Choose from: ${validStyles.join(', ')}` },
      });
    }

    const result = await imageService.generateHeadshot({ style, gender, additionalDetails });

    // Track usage
    await incrementUsage(req.user.id, 'photoGenerations');

    res.json({
      success: true,
      data: {
        image: `data:${result.mimeType};base64,${result.imageBase64}`,
        mimeType: result.mimeType,
        style,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/images/cover
 */
exports.generateCoverPhoto = async (req, res, next) => {
  try {
    const { industry = 'general', role = '', additionalDetails = '' } = req.body;

    const validIndustries = ['technology', 'finance', 'creative', 'healthcare', 'education', 'general'];
    if (!validIndustries.includes(industry)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid industry. Choose from: ${validIndustries.join(', ')}` },
      });
    }

    const result = await imageService.generateCoverPhoto({ industry, role, additionalDetails });

    // Track usage
    await incrementUsage(req.user.id, 'coverPhotoGenerations');

    res.json({
      success: true,
      data: {
        image: `data:${result.mimeType};base64,${result.imageBase64}`,
        mimeType: result.mimeType,
        industry,
      },
    });
  } catch (error) {
    next(error);
  }
};
