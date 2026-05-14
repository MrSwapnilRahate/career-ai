/**
 * Image Service — Professional Photo & Cover Generation
 * 
 * Uses Google Imagen 3 via the Gemini API for generating:
 * - Professional LinkedIn headshots
 * - Professional LinkedIn cover/banner photos
 */

const { GoogleGenAI } = require('@google/genai');
const { config } = require('../config/environment');
const logger = require('../utils/logger');

// Lazy-initialized
let _genai;
function getGenAI() {
  if (!_genai) {
    if (!config.ai.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    _genai = new GoogleGenAI({ apiKey: config.ai.apiKey });
  }
  return _genai;
}

/**
 * Style presets for professional headshots.
 */
const HEADSHOT_STYLES = {
  corporate: 'wearing professional business attire, clean corporate background, confident smile, studio lighting',
  creative: 'wearing smart casual attire, modern creative office background, warm natural lighting, approachable expression',
  tech: 'wearing smart casual tech industry attire, modern minimalist background, natural lighting, friendly professional expression',
  academic: 'wearing professional academic attire, library or campus background, warm natural lighting, scholarly expression',
  healthcare: 'wearing professional medical attire, clean clinical background, compassionate expression, professional lighting',
};

/**
 * Industry presets for cover photos.
 */
const COVER_STYLES = {
  technology: 'futuristic tech landscape with circuit patterns and code visualizations, blue and purple gradient, modern and clean',
  finance: 'professional cityscape with financial district skyline, golden hour lighting, sophisticated and trustworthy feel',
  creative: 'colorful abstract art with creative tools and inspiration, vibrant and artistic, modern design aesthetic',
  healthcare: 'clean medical technology theme with health icons, calming blue and green tones, professional and caring',
  education: 'inspiring academic theme with books and knowledge symbols, warm and inviting colors, scholarly atmosphere',
  general: 'professional abstract gradient background with geometric shapes, modern and versatile, clean corporate aesthetic',
};

const imageService = {
  /**
   * Generate a professional headshot.
   * @param {Object} options
   * @param {string} options.style - 'corporate' | 'creative' | 'tech' | 'academic' | 'healthcare'
   * @param {string} options.gender - 'male' | 'female' | 'neutral'
   * @param {string} [options.additionalDetails] - Extra description
   * @returns {Promise<{ imageBase64: string, mimeType: string }>}
   */
  async generateHeadshot({ style = 'corporate', gender = 'neutral', additionalDetails = '' }) {
    const ai = getGenAI();
    const styleDesc = HEADSHOT_STYLES[style] || HEADSHOT_STYLES.corporate;
    const genderDesc = gender === 'neutral' ? 'professional person' : `professional ${gender}`;

    const prompt = `Ultra-realistic professional LinkedIn headshot photo of a ${genderDesc}, ${styleDesc}. ${additionalDetails}. High resolution, sharp focus, professional photography quality, suitable for a LinkedIn profile picture. The photo should look completely real and natural, not AI-generated.`;

    logger.info('Generating professional headshot', { style, gender });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        responseModalities: ['image', 'text'],
      },
    });

    // Extract image from response
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part) {
      throw new Error('Image generation failed — no image in response');
    }

    return {
      imageBase64: part.inlineData.data,
      mimeType: part.inlineData.mimeType || 'image/png',
    };
  },

  /**
   * Generate a professional LinkedIn cover/banner photo.
   * @param {Object} options
   * @param {string} options.industry - Industry category
   * @param {string} options.role - User's role/title
   * @param {string} [options.additionalDetails] - Extra description
   * @returns {Promise<{ imageBase64: string, mimeType: string }>}
   */
  async generateCoverPhoto({ industry = 'general', role = '', additionalDetails = '' }) {
    const ai = getGenAI();
    const styleDesc = COVER_STYLES[industry] || COVER_STYLES.general;

    const prompt = `Professional LinkedIn banner/cover photo for a ${role || 'professional'}. ${styleDesc}. ${additionalDetails}. Wide aspect ratio (1584x396 pixels proportions), high resolution, modern design. No text overlay, no faces, just a beautiful professional background suitable for a LinkedIn cover photo.`;

    logger.info('Generating cover photo', { industry, role });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        responseModalities: ['image', 'text'],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part) {
      throw new Error('Cover photo generation failed — no image in response');
    }

    return {
      imageBase64: part.inlineData.data,
      mimeType: part.inlineData.mimeType || 'image/png',
    };
  },
};

module.exports = imageService;
