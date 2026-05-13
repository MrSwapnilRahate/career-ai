/**
 * Analysis Repository
 * 
 * All database operations for the Analysis model.
 * Handles creation, querying, pagination, status updates, and deletion.
 */

const Analysis = require('../models/Analysis');

const analysisRepository = {
  /**
   * Create a new analysis record (initially in 'queued' status).
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    return Analysis.create(data);
  },

  /**
   * Find analysis by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return Analysis.findById(id);
  },

  /**
   * Find analysis by Bull job ID (for status polling).
   * @param {string} jobId
   * @returns {Promise<Object|null>}
   */
  async findByJobId(jobId) {
    return Analysis.findOne({ jobId });
  },

  /**
   * Get paginated analysis history for a user.
   * @param {string} userId
   * @param {{ page: number, limit: number }} options
   * @returns {Promise<{ data: Array, pagination: Object }>}
   */
  async findByUserId(userId, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Analysis.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-resumeText -jobDescription') // Exclude large text fields from list
        .lean(),
      Analysis.countDocuments({ userId }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Update analysis status and optionally set result data.
   * @param {string} id - Analysis document ID
   * @param {string} status - New status
   * @param {Object} [updateData] - Additional fields to update
   * @returns {Promise<Object>}
   */
  async updateStatus(id, status, updateData = {}) {
    return Analysis.findByIdAndUpdate(
      id,
      { status, ...updateData },
      { new: true }
    );
  },

  /**
   * Mark analysis as completed with AI result.
   * @param {string} id
   * @param {Object} aiResult - Structured AI analysis result
   * @param {number} processingTimeMs - Total processing time
   * @returns {Promise<Object>}
   */
  async markCompleted(id, aiResult, processingTimeMs) {
    return Analysis.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        aiResult,
        processingTimeMs,
      },
      { new: true }
    );
  },

  /**
   * Mark analysis as failed with error details.
   * @param {string} id
   * @param {string} errorMessage
   * @returns {Promise<Object>}
   */
  async markFailed(id, errorMessage) {
    return Analysis.findByIdAndUpdate(
      id,
      {
        status: 'failed',
        error: {
          message: errorMessage,
          occurredAt: new Date(),
        },
      },
      { new: true }
    );
  },

  /**
   * Delete analysis by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async deleteById(id) {
    return Analysis.findByIdAndDelete(id);
  },
};

module.exports = analysisRepository;
