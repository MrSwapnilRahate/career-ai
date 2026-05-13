/**
 * Resume Processing Worker (BullMQ)
 * 
 * Background worker that processes queued resume analysis jobs.
 * 
 * Processing Pipeline:
 *   1. Pick job from queue
 *   2. Update status → 'processing'
 *   3. Download file & extract text → status 'extracting'
 *   4. Send to AI for analysis → status 'analyzing'
 *   5. Save structured result → status 'completed'
 *   6. On failure → status 'failed' with error details
 * 
 * Concurrency: Processes up to 3 jobs simultaneously.
 */

const { Worker } = require('bullmq');
const { config } = require('../config/environment');
const analysisRepository = require('../repositories/analysisRepository');
const pdfService = require('../services/pdfService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

const QUEUE_NAME = 'resume-analysis';
const CONCURRENCY = 3; // Max parallel AI calls

/**
 * Initialize the resume processing worker.
 * Call this once during server startup.
 * @returns {Worker} BullMQ Worker instance
 */
function startWorker() {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { analysisId, fileUrl, mimeType, analysisType, jobDescription } = job.data;
      const startTime = Date.now();

      logger.info(`🔄 Processing job ${job.id}`, {
        analysisId,
        type: analysisType,
        attempt: job.attemptsMade + 1,
      });

      try {
        // ─── Stage 1: Update status to 'processing' ──────────
        await analysisRepository.updateStatus(analysisId, 'processing');
        await job.updateProgress(10);

        // ─── Stage 2: Extract text from file ─────────────────
        await analysisRepository.updateStatus(analysisId, 'extracting');
        const resumeText = await pdfService.extractText(fileUrl, mimeType);
        await job.updateProgress(40);

        if (!resumeText || resumeText.length < 50) {
          throw new Error('Extracted text is too short — file may be empty or image-based');
        }

        // ─── Stage 3: AI Analysis ────────────────────────────
        await analysisRepository.updateStatus(analysisId, 'analyzing');

        let aiResult;
        if (analysisType === 'job-match') {
          aiResult = await aiService.matchJob(resumeText, jobDescription);
        } else {
          aiResult = await aiService.analyzeResume(resumeText);
        }

        await job.updateProgress(90);

        // ─── Stage 4: Save result ────────────────────────────
        const processingTimeMs = Date.now() - startTime;

        await analysisRepository.markCompleted(analysisId, aiResult, processingTimeMs);
        // Also save the extracted text
        await analysisRepository.updateStatus(analysisId, 'completed', {
          resumeText,
        });

        await job.updateProgress(100);

        logger.info(`✅ Job ${job.id} completed in ${processingTimeMs}ms`, {
          analysisId,
          type: analysisType,
          score: aiResult.score || aiResult.matchScore,
        });

        return { analysisId, processingTimeMs };
      } catch (error) {
        logger.error(`❌ Job ${job.id} failed:`, {
          analysisId,
          error: error.message,
          attempt: job.attemptsMade + 1,
        });

        // Mark as failed in DB (only on final attempt)
        if (job.attemptsMade + 1 >= (job.opts?.attempts || 3)) {
          await analysisRepository.markFailed(analysisId, error.message);
        }

        throw error; // Re-throw for BullMQ retry handling
      }
    },
    {
      connection: {
        url: config.redisUrl,
      },
      concurrency: CONCURRENCY,
      limiter: {
        max: 10,       // Max 10 jobs
        duration: 60000, // Per minute (protect AI API rate limits)
      },
    }
  );

  // ─── Worker Event Handlers ───────────────────────────────────

  worker.on('completed', (job, result) => {
    logger.info(`Worker: Job ${job.id} completed`, { result });
  });

  worker.on('failed', (job, error) => {
    logger.error(`Worker: Job ${job?.id} failed`, {
      error: error.message,
      attempts: job?.attemptsMade,
    });
  });

  worker.on('error', (error) => {
    logger.error('Worker error:', error.message);
  });

  logger.info(`⚙️  Resume worker started (concurrency: ${CONCURRENCY})`);

  return worker;
}

module.exports = { startWorker };
