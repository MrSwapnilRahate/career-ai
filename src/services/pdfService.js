/**
 * PDF / Document Text Extraction Service
 * 
 * Handles downloading files from Cloudinary and extracting clean text.
 * Supports PDF and DOCX formats.
 * 
 * Pipeline: Download → Extract raw text → Clean & normalize → Return
 */

const axios = require('axios');
const pdf = require('pdf-parse');
const logger = require('../utils/logger');

const pdfService = {
  /**
   * Extract text directly from a file buffer (memory upload).
   * @param {Buffer} buffer - File buffer from multer memory storage
   * @param {string} mimeType - File MIME type
   * @returns {Promise<string>} Cleaned text content
   */
  async extractTextFromBuffer(buffer, mimeType = 'application/pdf') {
    logger.info('Extracting text from buffer', { size: buffer.length, mimeType });

    let rawText;

    if (mimeType === 'application/pdf') {
      rawText = await this._extractFromPdf(buffer);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      rawText = await this._extractFromDocx(buffer);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    const cleanedText = this._cleanText(rawText);

    logger.info('Buffer text extraction completed', {
      rawLength: rawText.length,
      cleanedLength: cleanedText.length,
    });

    return cleanedText;
  },

  /**
   * Extract text from a file URL (Cloudinary).
   * Supports PDF and DOCX formats.
   * @param {string} fileUrl - Cloudinary file URL
   * @param {string} mimeType - File MIME type
   * @returns {Promise<string>} Cleaned text content
   */
  async extractText(fileUrl, mimeType = 'application/pdf') {
    logger.info('Starting text extraction', { fileUrl: fileUrl.slice(-40), mimeType });

    // Download file from Cloudinary
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 15000, // 15s timeout for download
    });

    const buffer = Buffer.from(response.data);

    let rawText;

    if (mimeType === 'application/pdf' || fileUrl.endsWith('.pdf')) {
      rawText = await this._extractFromPdf(buffer);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileUrl.endsWith('.docx')
    ) {
      rawText = await this._extractFromDocx(buffer);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Clean and normalize the extracted text
    const cleanedText = this._cleanText(rawText);

    logger.info('Text extraction completed', {
      rawLength: rawText.length,
      cleanedLength: cleanedText.length,
    });

    return cleanedText;
  },

  /**
   * Extract text from a PDF buffer.
   * @param {Buffer} buffer
   * @returns {Promise<string>}
   * @private
   */
  async _extractFromPdf(buffer) {
    const data = await pdf(buffer);
    return data.text;
  },

  /**
   * Extract text from a DOCX buffer.
   * Uses mammoth for high-quality text extraction.
   * @param {Buffer} buffer
   * @returns {Promise<string>}
   * @private
   */
  async _extractFromDocx(buffer) {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      logger.error('DOCX extraction failed:', error.message);
      throw new Error('Failed to extract text from DOCX file');
    }
  },

  /**
   * Clean and normalize extracted text.
   * 
   * - Removes non-printable characters
   * - Normalizes whitespace (multiple spaces → single)
   * - Removes excessive blank lines
   * - Trims each line
   * - Removes common header/footer patterns
   * 
   * @param {string} rawText
   * @returns {string}
   * @private
   */
  _cleanText(rawText) {
    if (!rawText) return '';

    return rawText
      // Remove non-printable characters (except newlines and tabs)
      .replace(/[^\x20-\x7E\n\t]/g, ' ')
      // Normalize tabs to spaces
      .replace(/\t/g, ' ')
      // Collapse multiple spaces into one
      .replace(/ {2,}/g, ' ')
      // Trim each line
      .split('\n')
      .map((line) => line.trim())
      // Remove empty lines but keep paragraph breaks (max 2 consecutive newlines)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      // Remove common footer patterns (page numbers, etc.)
      .replace(/^Page \d+ of \d+$/gm, '')
      .replace(/^\d+\s*$/gm, '') // Standalone page numbers
      .trim();
  },
};

module.exports = pdfService;
