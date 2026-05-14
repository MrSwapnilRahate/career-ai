/**
 * LinkedIn Routes
 * 
 * POST /api/linkedin/analyze          — Analyze LinkedIn profile (Pro+)
 * POST /api/linkedin/generate-resume  — Generate resume from LinkedIn (Pro+)
 * 
 * All routes are protected and require at least a Pro subscription.
 */

const express = require('express');
const router = express.Router();

const { analyzeProfile, generateResume } = require('../controllers/linkedinController');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePlan, checkUsage } = require('../middleware/subscriptionMiddleware');

// ─── LinkedIn Analysis (Pro+) ─────────────────────────────────
router.post(
  '/analyze',
  authMiddleware,
  requirePlan('pro'),
  checkUsage('linkedinAnalyses'),
  analyzeProfile
);

// ─── Resume Generation from LinkedIn (Pro+) ───────────────────
router.post(
  '/generate-resume',
  authMiddleware,
  requirePlan('pro'),
  checkUsage('resumeGenerations'),
  generateResume
);

module.exports = router;
