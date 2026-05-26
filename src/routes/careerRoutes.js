/**
 * Career Routes — AI Career Tools
 * 
 * POST /api/career/cover-letter     → Generate cover letter
 * POST /api/career/interview-prep   → Interview preparation
 * POST /api/career/skills-gap       → Skills gap analysis
 * POST /api/career/salary-insights  → Salary insights
 */

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const careerController = require('../controllers/careerController');

// All career routes require authentication
router.use(authMiddleware);

router.post('/cover-letter', careerController.generateCoverLetter);
router.post('/interview-prep', careerController.prepareInterview);
router.post('/skills-gap', careerController.analyzeSkillsGap);
router.post('/salary-insights', careerController.getSalaryInsights);

module.exports = router;
