/**
 * AI Service — OpenAI Integration
 * 
 * Major improvements over original:
 * 1. Single comprehensive AI call instead of 3 separate calls (3× cost savings)
 * 2. Structured prompt engineering with explicit JSON schema
 * 3. Retry logic with exponential backoff on transient failures
 * 4. Configurable timeout handling
 * 5. Response validation — verifies AI returns expected structure
 * 6. Separate prompts for resume analysis vs job matching
 */

const OpenAI = require('openai');
const { config } = require('../config/environment');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: config.ai.apiKey,
  timeout: config.ai.timeoutMs,
});

// ─── Response Schema (for validation) ─────────────────────────
const REQUIRED_ANALYSIS_FIELDS = ['score', 'atsScore', 'skills', 'strengths', 'weaknesses', 'suggestions', 'summary'];
const REQUIRED_JOB_MATCH_FIELDS = ['matchScore', 'missingSkills', 'suggestions', 'strengths', 'weaknesses', 'summary'];

// ─── System Prompts ───────────────────────────────────────────

const RESUME_ANALYSIS_SYSTEM_PROMPT = `You are an expert resume analyst and ATS (Applicant Tracking System) evaluator with 15+ years of experience in technical recruiting.

Your task is to perform a comprehensive analysis of the provided resume and return a structured JSON response.

IMPORTANT RULES:
- Return ONLY valid JSON — no markdown, no code fences, no extra text.
- All scores must be integers between 0 and 100.
- Arrays should contain 3-7 items each, as concise bullet points.
- Be specific and actionable in your feedback.

REQUIRED JSON FORMAT:
{
  "score": <number 0-100, overall resume quality score>,
  "atsScore": <number 0-100, ATS compatibility score>,
  "skills": [<list of technical and soft skills found>],
  "strengths": [<specific strong points of the resume>],
  "weaknesses": [<specific areas that need improvement>],
  "suggestions": [<actionable improvement recommendations>],
  "summary": "<2-3 sentence professional summary of the candidate>"
}`;

const JOB_MATCH_SYSTEM_PROMPT = `You are an expert technical recruiter and ATS specialist with 15+ years of experience matching candidates to job descriptions.

Your task is to compare the provided resume against the job description and return a structured JSON analysis.

IMPORTANT RULES:
- Return ONLY valid JSON — no markdown, no code fences, no extra text.
- All scores must be integers between 0 and 100.
- Be specific about which skills are missing and why they matter for the role.
- Provide actionable suggestions for improving the match.

REQUIRED JSON FORMAT:
{
  "matchScore": <number 0-100, how well resume matches the job>,
  "missingSkills": [<skills required by job but missing from resume>],
  "suggestions": [<specific actions to improve match for this role>],
  "strengths": [<how the candidate is a good fit>],
  "weaknesses": [<gaps between resume and job requirements>],
  "summary": "<2-3 sentence assessment of candidate-job fit>"
}`;

const aiService = {
  /**
   * Analyze a resume — single comprehensive AI call.
   * Replaces the old pattern of 3 separate calls (analyzeResume + extractSkills + scoreResume).
   * 
   * @param {string} resumeText - Cleaned resume text
   * @returns {Promise<Object>} Structured analysis result
   */
  async analyzeResume(resumeText) {
    const userPrompt = `Analyze the following resume:\n\n${resumeText}`;

    const result = await this._callWithRetry(
      RESUME_ANALYSIS_SYSTEM_PROMPT,
      userPrompt,
      REQUIRED_ANALYSIS_FIELDS
    );

    return result;
  },

  /**
   * Match a resume against a job description.
   * 
   * @param {string} resumeText - Cleaned resume text
   * @param {string} jobDescription - Job description text
   * @returns {Promise<Object>} Structured match result
   */
  async matchJob(resumeText, jobDescription) {
    const userPrompt = `Compare this resume against the job description.\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`;

    const result = await this._callWithRetry(
      JOB_MATCH_SYSTEM_PROMPT,
      userPrompt,
      REQUIRED_JOB_MATCH_FIELDS
    );

    return result;
  },

  // ─── Private Helpers ─────────────────────────────────────────

  /**
   * Call OpenAI with retry logic and response validation.
   * Retries on transient failures with exponential backoff.
   * 
   * @param {string} systemPrompt
   * @param {string} userPrompt
   * @param {string[]} requiredFields - Fields to validate in response
   * @returns {Promise<Object>}
   * @private
   */
  async _callWithRetry(systemPrompt, userPrompt, requiredFields) {
    const maxRetries = config.ai.maxRetries;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`AI call attempt ${attempt}/${maxRetries}`, {
          model: config.ai.model,
          promptLength: userPrompt.length,
        });

        const startTime = Date.now();

        const response = await openai.chat.completions.create({
          model: config.ai.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3, // Low temperature for consistent structured output
          max_tokens: 2000,
        });

        const elapsed = Date.now() - startTime;
        const rawContent = response.choices[0].message.content;

        logger.info(`AI response received in ${elapsed}ms`, {
          tokens: response.usage?.total_tokens,
          attempt,
        });

        // Parse and validate JSON response
        const parsed = this._parseAIResponse(rawContent);
        this._validateResponse(parsed, requiredFields);

        return parsed;
      } catch (error) {
        lastError = error;

        // Don't retry on validation errors (AI returned wrong format)
        // or client errors (bad API key, etc.)
        const isRetryable = this._isRetryableError(error);

        if (!isRetryable || attempt === maxRetries) {
          logger.error(`AI call failed (attempt ${attempt}/${maxRetries}):`, {
            error: error.message,
            retryable: isRetryable,
          });
          break;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, attempt - 1);
        logger.warn(`AI call failed, retrying in ${delay}ms...`, {
          attempt,
          error: error.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(`AI analysis failed after ${maxRetries} attempts: ${lastError.message}`);
  },

  /**
   * Parse AI response content as JSON.
   * Handles common issues like markdown code fences wrapping the JSON.
   * 
   * @param {string} content
   * @returns {Object}
   * @private
   */
  _parseAIResponse(content) {
    if (!content) {
      throw new Error('AI returned empty response');
    }

    // Strip markdown code fences if present (```json ... ```)
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    try {
      return JSON.parse(cleaned);
    } catch (error) {
      logger.error('Failed to parse AI response as JSON:', {
        content: cleaned.slice(0, 200),
      });
      throw new Error('AI returned invalid JSON response');
    }
  },

  /**
   * Validate that the parsed response contains all required fields.
   * 
   * @param {Object} response
   * @param {string[]} requiredFields
   * @private
   */
  _validateResponse(response, requiredFields) {
    const missing = requiredFields.filter((field) => !(field in response));

    if (missing.length > 0) {
      logger.warn('AI response missing fields:', { missing });
      // Don't throw — fill in defaults for missing fields
      for (const field of missing) {
        if (field.includes('score') || field.includes('Score')) {
          response[field] = 0;
        } else if (field === 'summary') {
          response[field] = '';
        } else {
          response[field] = [];
        }
      }
    }
  },

  /**
   * Determine if an error is retryable (transient network/rate-limit issue).
   * 
   * @param {Error} error
   * @returns {boolean}
   * @private
   */
  _isRetryableError(error) {
    // Rate limit errors
    if (error.status === 429) return true;

    // Server errors (OpenAI is down)
    if (error.status >= 500) return true;

    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
    if (error.message?.includes('timeout')) return true;

    return false;
  },
};

module.exports = aiService;
