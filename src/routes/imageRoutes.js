/**
 * Image Routes
 * 
 * POST /api/images/headshot  — Generate professional headshot (Pro+)
 * POST /api/images/cover     — Generate cover/banner photo (Pro+)
 * 
 * All routes are protected and require at least a Pro subscription.
 */

const express = require('express');
const router = express.Router();

const { generateHeadshot, generateCoverPhoto } = require('../controllers/imageController');
const authMiddleware = require('../middleware/authMiddleware');
const { requirePlan, checkUsage } = require('../middleware/subscriptionMiddleware');

// ─── Professional Headshot (Pro+) ─────────────────────────────
router.post(
  '/headshot',
  authMiddleware,
  requirePlan('pro'),
  checkUsage('photoGenerations'),
  generateHeadshot
);

// ─── Cover Photo (Pro+) ───────────────────────────────────────
router.post(
  '/cover',
  authMiddleware,
  requirePlan('pro'),
  checkUsage('coverPhotoGenerations'),
  generateCoverPhoto
);

module.exports = router;
