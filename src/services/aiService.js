/**
 * AI Service — Google Gemini Integration
 * 
 * Uses Gemini 2.5 Pro for deep analysis and resume generation,
 * Gemini 2.5 Flash for quick analysis and LinkedIn tips.
 * 
 * Features:
 * 1. 15+ ATS criteria evaluation with section-level scores
 * 2. Industry-specific benchmarking
 * 3. Job match analysis with gap identification
 * 4. LinkedIn profile analysis and improvement tips
 * 5. ATS-friendly resume generation from LinkedIn data
 * 6. Retry logic with exponential backoff
 * 7. Structured JSON output via responseMimeType
 */

const { GoogleGenAI } = require('@google/genai');
const { config } = require('../config/environment');
const logger = require('../utils/logger');

// Lazy-initialized Gemini client
let _genai;
function getGenAI() {
  if (!_genai) {
    if (!config.ai.apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Set it in your .env file.');
    }
    _genai = new GoogleGenAI({ apiKey: config.ai.apiKey });
  }
  return _genai;
}

// ─── System Prompts ───────────────────────────────────────────

const RESUME_ANALYSIS_PROMPT = `You are an elite resume analyst and ATS (Applicant Tracking System) evaluator with 20+ years of experience in technical recruiting across Fortune 500 companies.

Perform a comprehensive, no-holds-barred analysis of the provided resume. Evaluate against 15+ ATS criteria used by real enterprise systems.

Return a JSON object with this EXACT structure:
{
  "score": <number 0-100, overall resume quality>,
  "atsScore": <number 0-100, ATS compatibility>,
  "summary": "<string, 2-3 sentence executive assessment>",
  "skills": ["<detected skills array, both technical and soft>"],
  "strengths": ["<specific strengths with examples from resume>"],
  "weaknesses": ["<specific weaknesses with actionable fixes>"],
  "suggestions": ["<prioritized improvement suggestions>"],
  "sectionScores": {
    "contactInfo": <0-100>,
    "summary": <0-100>,
    "experience": <0-100>,
    "education": <0-100>,
    "skills": <0-100>,
    "formatting": <0-100>,
    "keywords": <0-100>,
    "achievements": <0-100>
  },
  "atsDetails": {
    "parsability": "<string assessment of machine readability>",
    "keywordDensity": "<string, keyword optimization level>",
    "formattingIssues": ["<list of ATS-breaking formatting problems>"],
    "missingStandardSections": ["<sections that ATS systems expect but are missing>"],
    "actionVerbs": <number, count of strong action verbs used>,
    "quantifiedAchievements": <number, count of measurable results>,
    "bulletPointConsistency": "<string assessment>"
  },
  "industryFit": "<string, detected industry and how well resume fits>"
}

IMPORTANT RULES:
- Be brutally honest. Do not inflate scores.
- Every strength must reference something specific in the resume.
- Every weakness must include HOW to fix it.
- Suggestions should be prioritized by impact (highest first).
- Detect the industry from the resume content and evaluate accordingly.`;

const JOB_MATCH_PROMPT = `You are a senior technical recruiter with 20+ years of experience matching candidates to roles.

Analyze the provided resume against the given job description. Evaluate how well the candidate matches the requirements.

Return a JSON object with this EXACT structure:
{
  "matchScore": <number 0-100, overall match percentage>,
  "summary": "<string, 2-3 sentence match assessment>",
  "strengths": ["<candidate strengths relative to this specific job>"],
  "weaknesses": ["<gaps between candidate and job requirements>"],
  "suggestions": ["<specific actions to improve match for THIS role>"],
  "missingSkills": ["<required skills the candidate lacks>"],
  "matchingSkills": ["<required skills the candidate has>"],
  "experienceMatch": "<string, how experience level aligns>",
  "keywordGaps": ["<important keywords from JD missing in resume>"],
  "interviewTips": ["<preparation tips specific to this role>"]
}

Be specific. Reference actual content from both the resume and job description.`;

const LINKEDIN_ANALYSIS_PROMPT = `You are a LinkedIn optimization expert and personal branding consultant who has helped 10,000+ professionals improve their LinkedIn presence.

Analyze the provided LinkedIn profile data and provide comprehensive improvement suggestions.

Return a JSON object with this EXACT structure:
{
  "overallScore": <number 0-100, LinkedIn profile strength>,
  "summary": "<string, 2-3 sentence profile assessment>",
  "headlineScore": <0-100>,
  "aboutScore": <0-100>,
  "experienceScore": <0-100>,
  "skillsScore": <0-100>,
  "strengths": ["<what the profile does well>"],
  "improvements": ["<specific, actionable improvements>"],
  "headlineSuggestions": ["<3 alternative headline options>"],
  "aboutSuggestion": "<string, rewritten About section suggestion>",
  "keywordSuggestions": ["<keywords to add for better discoverability>"],
  "networkingTips": ["<tips to improve engagement and visibility>"],
  "contentIdeas": ["<post/article ideas relevant to their field>"]
}`;

const RESUME_GENERATION_PROMPT = `You are an expert resume writer who creates ATS-optimized, professionally formatted resumes.

Using the provided LinkedIn profile data and target role, generate a complete, ATS-friendly resume.

Return a JSON object with this EXACT structure:
{
  "resumeText": "<string, the complete resume in clean text format>",
  "resumeMarkdown": "<string, the resume in well-formatted Markdown>",
  "targetKeywords": ["<keywords optimized for the target role>"],
  "summary": "<string, professional summary section>",
  "optimizationNotes": ["<notes about what was optimized for ATS>"],
  "estimatedAtsScore": <number 0-100, predicted ATS score>
}

FORMATTING RULES:
- Use clean, standard sections: Summary, Experience, Education, Skills, Certifications
- Use strong action verbs (Led, Developed, Implemented, etc.)
- Include quantified achievements wherever possible
- Keep to 1-2 pages equivalent length
- Optimize keyword placement for ATS scanning`;


// ─── Core AI Functions ────────────────────────────────────────

/**
 * Make a Gemini API call with retry logic.
 * @param {string} modelId - Model to use
 * @param {string} systemPrompt - System instruction
 * @param {string} userContent - User input text
 * @returns {Promise<Object>} Parsed JSON response
 */
async function callGemini(modelId, systemPrompt, userContent) {
  const ai = getGenAI();
  const maxRetries = config.ai.maxRetries;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();

      const response = await ai.models.generateContent({
        model: modelId,
        contents: userContent,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const elapsed = Date.now() - startTime;
      const text = response.text;

      logger.info(`Gemini ${modelId} responded in ${elapsed}ms (attempt ${attempt})`);

      // Parse JSON response
      const parsed = JSON.parse(text);
      return parsed;

    } catch (error) {
      logger.error(`Gemini API attempt ${attempt}/${maxRetries} failed:`, {
        model: modelId,
        error: error.message,
      });

      if (attempt === maxRetries) {
        throw new Error(`AI analysis failed after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff: 2s, 4s, 8s
      const delay = 2000 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ─── Exported Service Methods ─────────────────────────────────

const aiService = {
  /**
   * Full resume analysis with 15+ ATS criteria.
   * Uses Gemini 2.5 Pro for deepest analysis.
   * @param {string} resumeText - Extracted resume text
   * @param {string} tier - User subscription tier ('free'|'pro'|'enterprise')
   * @returns {Promise<Object>}
   */
  async analyzeResume(resumeText, tier = 'free') {
    const model = tier === 'free' ? config.ai.flashModel : config.ai.proModel;
    return callGemini(model, RESUME_ANALYSIS_PROMPT, resumeText);
  },

  /**
   * Resume vs job description match analysis.
   * @param {string} resumeText
   * @param {string} jobDescription
   * @param {string} tier
   * @returns {Promise<Object>}
   */
  async matchJob(resumeText, jobDescription, tier = 'free') {
    const model = tier === 'free' ? config.ai.flashModel : config.ai.proModel;
    const content = `=== RESUME ===\n${resumeText}\n\n=== JOB DESCRIPTION ===\n${jobDescription}`;
    return callGemini(model, JOB_MATCH_PROMPT, content);
  },

  /**
   * Analyze LinkedIn profile and provide tips.
   * Uses Gemini 2.5 Flash for speed.
   * @param {string} profileText - Pasted LinkedIn profile text
   * @returns {Promise<Object>}
   */
  async analyzeLinkedIn(profileText) {
    return callGemini(config.ai.flashModel, LINKEDIN_ANALYSIS_PROMPT, profileText);
  },

  /**
   * Generate ATS-friendly resume from LinkedIn data.
   * Uses Gemini 2.5 Pro for quality generation.
   * @param {string} profileText - LinkedIn profile data
   * @param {string} targetRole - Target job title/role
   * @returns {Promise<Object>}
   */
  async generateResumeFromLinkedIn(profileText, targetRole) {
    const content = `=== LINKEDIN PROFILE DATA ===\n${profileText}\n\n=== TARGET ROLE ===\n${targetRole}`;
    return callGemini(config.ai.proModel, RESUME_GENERATION_PROMPT, content);
  },
};

module.exports = aiService;
