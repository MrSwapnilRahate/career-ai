/**
 * Resume Service — Orchestration Layer
 * 
 * Coordinates the resume processing workflow:
 *   Upload → Queue → (Worker processes) → Poll status → Get result
 * 
 * This service is the ONLY place that knows about the queue.
 * Controllers call this service; they never touch the queue or repository directly.
 */

const analysisRepository = require('../repositories/analysisRepository');
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
   * Submit a resume for async AI analysis.
   * Creates an Analysis record and enqueues a processing job.
   * 
   * @param {string} userId - Authenticated user ID
   * @param {Object} file - Multer file object (from Cloudinary upload)
   * @param {string} [jobDescription] - Optional job description (for job-match)
   * @returns {Promise<{ jobId: string, analysisId: string }>}
   */
  async submitForAnalysis(userId, file, jobDescription = null) {
    const analysisType = jobDescription ? 'job-match' : 'resume-analysis';

    // 1. Create Analysis record in "queued" status
    const analysis = await analysisRepository.create({
      userId,
      status: 'queued',
      analysisType,
      jobDescription,
      fileMetadata: {
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl: file.path, // Cloudinary URL
        uploadedAt: new Date(),
      },
    });

    // 2. Enqueue job for background processing
    const queue = getQueue();
    const job = await queue.add('process-resume', {
      analysisId: analysis._id.toString(),
      fileUrl: file.path,
      mimeType: file.mimetype,
      analysisType,
      jobDescription,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 50,      // Keep last 50 failed jobs
    });

    // 3. Store the Bull job ID in the analysis record
    await analysisRepository.updateStatus(analysis._id, 'queued', {
      jobId: job.id,
    });

    logger.info('Resume job enqueued', {
      analysisId: analysis._id,
      jobId: job.id,
      type: analysisType,
      fileName: file.originalname,
    });

    return {
      jobId: job.id,
      analysisId: analysis._id.toString(),
    };
  },

  /**
   * Get the processing status of a resume analysis job.
   * Used for client polling: GET /api/resume/status/:jobId
   * 
   * @param {string} jobId - Bull queue job ID
   * @returns {Promise<Object>} Status object
   */
  async getJobStatus(jobId) {
    const analysis = await analysisRepository.findByJobId(jobId);

    if (!analysis) {
      throw new NotFoundError('Job', jobId);
    }

    const response = {
      jobId,
      status: analysis.status,
      analysisId: analysis._id,
    };

    // Include result summary if completed
    if (analysis.status === 'completed') {
      response.processingTimeMs = analysis.processingTimeMs;
    }

    // Include error if failed
    if (analysis.status === 'failed') {
      response.error = analysis.error?.message || 'Processing failed';
    }

    return response;
  },

  /**
   * Get a completed analysis result.
   * Verifies user ownership before returning.
   * 
   * @param {string} analysisId - Analysis document ID
   * @param {string} userId - Authenticated user ID (for ownership check)
   * @returns {Promise<Object>}
   */
  async getResult(analysisId, userId) {
    const analysis = await analysisRepository.findById(analysisId);

    if (!analysis) {
      throw new NotFoundError('Analysis', analysisId);
    }

    // Ownership check
    if (analysis.userId.toString() !== userId) {
      throw new ForbiddenError('Not authorized to access this analysis');
    }

    return analysis;
  },

  /**
   * Get paginated analysis history for a user.
   * 
   * @param {string} userId
   * @param {{ page: number, limit: number }} options
   * @returns {Promise<{ data: Array, pagination: Object }>}
   */
  async getHistory(userId, { page = 1, limit = 10 } = {}) {
    return analysisRepository.findByUserId(userId, { page, limit });
  },

  /**
   * Delete an analysis (with ownership check).
   * 
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
