/**
 * Resume Controller (Thin Layer)
 * 
 * Only handles HTTP request/response.
 * All business logic is delegated to resumeService.
 * 
 * Key change: Upload endpoints now return immediately with a jobId (202 Accepted).
 * Clients poll GET /status/:jobId until processing completes.
 */

const resumeService = require('../services/resumeService');
const ValidationError = require('../errors/ValidationError');
const { incrementUsage } = require('../middleware/subscriptionMiddleware');

/**
 * POST /api/resume/upload
 * Upload a resume for AI analysis.
 * Returns immediately with jobId (async) or waits for result (sync).
 */
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('Resume file is required');
    }

    const result = await resumeService.submitForAnalysis(
      req.user.id,
      req.file
    );

    if (result.mode === 'async') {
      // Redis available — client polls for result
      res.status(202).json({
        success: true,
        message: 'Resume uploaded successfully. Analysis is being processed.',
        data: {
          jobId: result.jobId,
          analysisId: result.analysisId,
          statusUrl: `/api/resume/status/${result.jobId}`,
        },
      });
    } else {
      // Sync mode — result is ready
      res.status(200).json({
        success: true,
        message: 'Resume analysis completed.',
        data: {
          analysisId: result.analysisId,
          status: 'completed',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/resume/job-match
 * Upload a resume + job description for AI matching.
 */
exports.jobMatch = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('Resume file is required');
    }

    const { jobDescription } = req.body;

    if (!jobDescription || jobDescription.length < 20) {
      throw new ValidationError('Job description must be at least 20 characters');
    }

    const result = await resumeService.submitForAnalysis(
      req.user.id,
      req.file,
      jobDescription
    );

    if (result.mode === 'async') {
      res.status(202).json({
        success: true,
        message: 'Job match analysis submitted. Processing in background.',
        data: {
          jobId: result.jobId,
          analysisId: result.analysisId,
          statusUrl: `/api/resume/status/${result.jobId}`,
        },
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Job match analysis completed.',
        data: {
          analysisId: result.analysisId,
          status: 'completed',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/resume/status/:jobId
 * Poll the processing status of a resume analysis job.
 * Returns current status: queued | processing | extracting | analyzing | completed | failed
 */
exports.getStatus = async (req, res, next) => {
  try {
    const status = await resumeService.getJobStatus(req.params.jobId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/resume/result/:id
 * Get the full analysis result for a completed job.
 * Requires ownership (user can only see their own analyses).
 */
exports.getResult = async (req, res, next) => {
  try {
    const analysis = await resumeService.getResult(req.params.id, req.user.id);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/resume/history?page=1&limit=10
 * Get paginated analysis history for the authenticated user.
 */
exports.getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await resumeService.getHistory(req.user.id, { page, limit });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/resume/:id
 * Delete an analysis (with ownership check).
 */
exports.deleteAnalysis = async (req, res, next) => {
  try {
    await resumeService.deleteAnalysis(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Analysis deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
