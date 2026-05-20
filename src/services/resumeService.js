/**
 * Resume Service — Orchestration Layer
 * 
 * Supports two modes:
 * - Async (Redis available): Upload → Queue → Worker processes → Poll → Result
 * - Sync (no Redis): Upload → Extract text → AI analysis → Return result
 * 
 * This service is the ONLY place that knows about the queue.
 * Controllers call this service; they never touch the queue or repository directly.
 */

const analysisRepository = require('../repositories/analysisRepository');
const pdfService = require('./pdfService');
const aiService = require('./aiService');
const { incrementUsage } = require('../middleware/subscriptionMiddleware');
const { config } = require('../config/environment');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');

// Lazy-loaded to avoid circular dependency with queue setup
let resumeQueue;
function getQueue() {
  if (!resumeQueue) {
    resumeQueue = require('../queues/resumeQueue');
  }
  return resumeQueue;
}

const resumeService = {
  /**
   * Submit a resume for AI analysis.
   * Uses async queue if Redis is available, otherwise processes synchronously.
   * 
   * @param {string} userId - Authenticated user ID
   * @param {Object} file - Multer file object (memory buffer or Cloudinary)
   * @param {string} [jobDescription] - Optional job description (for job-match)
   * @returns {Promise<{ jobId: string, analysisId: string } | { analysisId: string, result: Object }>}
   */
  async submitForAnalysis(userId, file, jobDescription = null) {
    const analysisType = jobDescription ? 'job-match' : 'resume-analysis';

    // Determine file URL (Cloudinary) or use buffer (memory)
    const fileUrl = file.path || null;
    const fileBuffer = file.buffer || null;

    // Create Analysis record
    const analysis = await analysisRepository.create({
      userId,
      status: 'queued',
      analysisType,
      jobDescription,
      fileMetadata: {
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl: fileUrl || 'memory-upload',
        uploadedAt: new Date(),
      },
    });

    // ─── Mode 1: Async (Redis available) ─────────────────
    if (config.redisUrl) {
      const queue = getQueue();
      const job = await queue.add('process-resume', {
        analysisId: analysis._id.toString(),
        fileUrl,
        mimeType: file.mimetype,
        analysisType,
        jobDescription,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      await analysisRepository.updateStatus(analysis._id, 'queued', {
        jobId: job.id,
      });

      logger.info('Resume job enqueued', {
        analysisId: analysis._id,
        jobId: job.id,
        type: analysisType,
      });

      return {
        jobId: job.id,
        analysisId: analysis._id.toString(),
        mode: 'async',
      };
    }

    // ─── Mode 2: Sync (no Redis) ─────────────────────────
    logger.info('Processing resume synchronously (no Redis)', {
      analysisId: analysis._id,
      type: analysisType,
    });

    try {
      await analysisRepository.updateStatus(analysis._id, 'processing');

      // Extract text — from buffer (memory) or URL (Cloudinary)
      let resumeText;
      if (fileBuffer) {
        resumeText = await pdfService.extractTextFromBuffer(fileBuffer, file.mimetype);
      } else {
        resumeText = await pdfService.extractText(fileUrl, file.mimetype);
      }

      if (!resumeText || resumeText.length < 50) {
        throw new Error('Extracted text is too short — file may be empty or image-based');
      }

      await analysisRepository.updateStatus(analysis._id, 'analyzing');

      // AI analysis
      let aiResult;
      if (analysisType === 'job-match') {
        aiResult = await aiService.matchJob(resumeText, jobDescription);
      } else {
        aiResult = await aiService.analyzeResume(resumeText);
      }

      const processingTimeMs = Date.now() - analysis.createdAt.getTime();

      await analysisRepository.markCompleted(analysis._id, aiResult, processingTimeMs);
      await analysisRepository.updateStatus(analysis._id, 'completed', { resumeText });

      // Track usage
      await incrementUsage(userId, analysisType === 'job-match' ? 'jobMatches' : 'analyses');

      logger.info('Resume analysis completed (sync)', {
        analysisId: analysis._id,
        type: analysisType,
        processingTimeMs,
      });

      return {
        analysisId: analysis._id.toString(),
        mode: 'sync',
      };

    } catch (error) {
      await analysisRepository.markFailed(analysis._id, error.message);
      throw error;
    }
  },

  /**
   * Get the processing status of a resume analysis job.
   * @param {string} jobId - Bull queue job ID
   * @returns {Promise<Object>} Status object
   */
  async getJobStatus(jobId) {
    const analysis = await analysisRepository.findByJobId(jobId);

    if (!analysis) {
      throw new NotFoundError('Job', jobId);
    }

    return {
      jobId,
      status: analysis.status,
      analysisId: analysis._id,
      processingTimeMs: analysis.status === 'completed' ? analysis.processingTimeMs : undefined,
      error: analysis.status === 'failed' ? (analysis.error?.message || 'Processing failed') : undefined,
    };
  },

  /**
   * Get a completed analysis result.
   * @param {string} analysisId
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getResult(analysisId, userId) {
    const analysis = await analysisRepository.findById(analysisId);

    if (!analysis) {
      throw new NotFoundError('Analysis', analysisId);
    }

    if (analysis.userId.toString() !== userId) {
      throw new ForbiddenError('Not authorized to access this analysis');
    }

    return analysis;
  },

  /**
   * Get paginated analysis history for a user.
   * @param {string} userId
   * @param {{ page: number, limit: number }} options
   * @returns {Promise<{ data: Array, pagination: Object }>}
   */
  async getHistory(userId, { page = 1, limit = 10 } = {}) {
    return analysisRepository.findByUserId(userId, { page, limit });
  },

  /**
   * Delete an analysis (with ownership check).
   * @param {string} analysisId
   * @param {string} userId
   */
  async deleteAnalysis(analysisId, userId) {
    const analysis = await analysisRepository.findById(analysisId);

    if (!analysis) {
      throw new NotFoundError('Analysis', analysisId);
    }

    if (analysis.userId.toString() !== userId) {
      throw new ForbiddenError('Not authorized to delete this analysis');
    }

    await analysisRepository.deleteById(analysisId);
    logger.info('Analysis deleted', { analysisId, userId });
  },
};

module.exports = resumeService;
