/**
 * Resume Routes
 * 
 * POST   /api/resume/upload          — Upload resume for AI analysis (async)
 * POST   /api/resume/job-match       — Resume vs job description match (async)
 * GET    /api/resume/status/:jobId   — Poll job processing status
 * GET    /api/resume/result/:id      — Get completed analysis result
 * GET    /api/resume/history         — Paginated analysis history
 * DELETE /api/resume/:id             — Delete analysis
 * 
 * All routes are protected (require JWT authentication).
 * Upload routes have stricter rate limiting to protect AI API costs.
 */

const express = require('express');
const router = express.Router();

const {
  uploadResume,
  jobMatch,
  getStatus,
  getResult,
  getHistory,
  deleteAnalysis,
} = require('../controllers/resumeController');

const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimitMiddleware');
const { validate } = require('../middleware/validateRequest');
const { historyQuerySchema } = require('../validation/resumeValidation');

// ─── Upload Routes (Rate Limited) ─────────────────────────────
router.post(
  '/upload',
  authMiddleware,
  uploadLimiter,
  upload.single('resume'),
  uploadResume
);

router.post(
  '/job-match',
  authMiddleware,
  uploadLimiter,
  upload.single('resume'),
  jobMatch
);

// ─── Status & Result Routes ───────────────────────────────────
router.get('/status/:jobId', authMiddleware, getStatus);
router.get('/result/:id', authMiddleware, getResult);

// ─── History Route (Paginated) ────────────────────────────────
router.get('/history', authMiddleware, validate(historyQuerySchema, 'query'), getHistory);

// ─── Delete Route ─────────────────────────────────────────────
router.delete('/:id', authMiddleware, deleteAnalysis);

module.exports = router;
