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

const COVER_LETTER_PROMPT = `You are a professional cover letter writer with 15+ years of experience crafting compelling, personalized cover letters that get interviews.

Using the provided resume and job description, generate a tailored cover letter.

Return a JSON object with this EXACT structure:
{
  "coverLetter": "<string, the complete cover letter in professional format>",
  "coverLetterMarkdown": "<string, the cover letter in Markdown format>",
  "keyHighlights": ["<3-5 key selling points used in the letter>"],
  "customizations": ["<specific tailoring done for this company/role>"],
  "tone": "<string, the tone used: professional/friendly/confident>",
  "wordCount": <number>,
  "tips": ["<tips for further personalization before sending>"]
}

RULES:
- Address specific requirements from the job description
- Reference concrete achievements from the resume with metrics
- Show genuine enthusiasm for the company and role
- Keep to 300-400 words (3-4 paragraphs)
- Use a professional but engaging tone
- Never use generic filler phrases like "I am writing to apply"
- Include a compelling opening hook and strong closing call-to-action`;

const INTERVIEW_PREP_PROMPT = `You are an elite interview coach who has prepared 10,000+ candidates for technical and behavioral interviews at top companies including FAANG, Fortune 500, and high-growth startups.

Using the provided resume and job description, generate comprehensive interview preparation material.

Return a JSON object with this EXACT structure:
{
  "roleAnalysis": "<string, brief analysis of what the interviewer will focus on>",
  "questions": [
    {
      "category": "<string: Technical/Behavioral/Situational/Role-Specific>",
      "question": "<string, the interview question>",
      "whyAsked": "<string, why interviewers ask this>",
      "modelAnswer": "<string, a strong answer using STAR method where applicable>",
      "tips": "<string, coaching tip for delivering this answer>"
    }
  ],
  "technicalTopics": ["<key technical areas to review>"],
  "questionsToAsk": ["<5 smart questions the candidate should ask the interviewer>"],
  "redFlags": ["<common mistakes to avoid in this interview>"],
  "preparationPlan": "<string, a 3-day preparation plan>"
}

RULES:
- Generate exactly 10 questions: mix of behavioral, technical, and role-specific
- Model answers MUST use specific details from the candidate's actual resume
- Use STAR method (Situation, Task, Action, Result) for behavioral answers
- Questions should target the specific skills/experience in the job description
- Include at least 2 "tricky" questions that test weaknesses`;

const SKILLS_GAP_PROMPT = `You are a career strategist and skills analyst with deep knowledge of industry trends, job market demands, and professional development pathways.

Analyze the provided resume against the target role/industry and identify skill gaps, learning opportunities, and a career progression roadmap.

Return a JSON object with this EXACT structure:
{
  "currentLevel": "<string, assessed career level: Junior/Mid/Senior/Lead/Principal>",
  "targetLevel": "<string, target level for the role>",
  "matchPercentage": <number 0-100>,
  "existingSkills": [
    {"skill": "<name>", "level": "<Beginner/Intermediate/Advanced/Expert>", "relevance": "<High/Medium/Low>"}
  ],
  "missingSkills": [
    {"skill": "<name>", "priority": "<Critical/Important/Nice-to-have>", "timeToLearn": "<string, estimated time>", "resources": ["<2-3 specific free/paid learning resources>"]}
  ],
  "learningRoadmap": {
    "week1_2": ["<immediate actions>"],
    "month1": ["<first month goals>"],
    "month2_3": ["<quarterly goals>"],
    "month4_6": ["<6-month targets>"]
  },
  "careerPath": [
    {"role": "<title>", "timeline": "<when achievable>", "requirements": ["<what's needed>"]}
  ],
  "industryTrends": ["<3-5 emerging trends in their field>"],
  "certifications": [{"name": "<cert name>", "provider": "<who offers it>", "value": "<why it matters>"}]
}

Be specific and actionable. Reference real courses, certifications, and platforms.`;

const SALARY_INSIGHTS_PROMPT = `You are a compensation analyst and salary negotiation expert with access to current market data across industries and geographies.

Analyze the provided resume, target role, and location to provide comprehensive salary intelligence and negotiation guidance.

Return a JSON object with this EXACT structure:
{
  "targetRole": "<string, the analyzed role>",
  "location": "<string, the location analyzed>",
  "salaryRange": {
    "currency": "<string, USD/INR/EUR etc>",
    "entry": <number, entry-level salary>,
    "median": <number, median salary>,
    "senior": <number, senior-level salary>,
    "top": <number, top 10% salary>
  },
  "candidateEstimate": {
    "estimated": <number, estimated salary based on their experience>,
    "reasoning": "<string, why this estimate>"
  },
  "marketDemand": "<string: High/Medium/Low — current demand for this role>",
  "demandTrend": "<string: Rising/Stable/Declining>",
  "comparableRoles": [
    {"role": "<title>", "salaryRange": "<range string>", "similarity": "<percentage>"}
  ],
  "negotiationTips": ["<5 specific negotiation strategies>"],
  "negotiationScript": "<string, a sample negotiation conversation script>",
  "benefitsToNegotiate": ["<non-salary benefits to negotiate>"],
  "marketInsights": ["<3-5 key insights about this role's market>"],
  "salaryGrowth": "<string, expected salary growth over 3-5 years>"
}

Use realistic, current market data. Be specific to the location and industry.`;


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
   */
  async analyzeResume(resumeText, tier = 'free') {
    const model = tier === 'free' ? config.ai.flashModel : config.ai.proModel;
    return callGemini(model, RESUME_ANALYSIS_PROMPT, resumeText);
  },

  /**
   * Resume vs job description match analysis.
   */
  async matchJob(resumeText, jobDescription, tier = 'free') {
    const model = tier === 'free' ? config.ai.flashModel : config.ai.proModel;
    const content = `=== RESUME ===\n${resumeText}\n\n=== JOB DESCRIPTION ===\n${jobDescription}`;
    return callGemini(model, JOB_MATCH_PROMPT, content);
  },

  /**
   * Analyze LinkedIn profile and provide tips.
   */
  async analyzeLinkedIn(profileText) {
    return callGemini(config.ai.flashModel, LINKEDIN_ANALYSIS_PROMPT, profileText);
  },

  /**
   * Generate ATS-friendly resume from LinkedIn data.
   */
  async generateResumeFromLinkedIn(profileText, targetRole) {
    const content = `=== LINKEDIN PROFILE DATA ===\n${profileText}\n\n=== TARGET ROLE ===\n${targetRole}`;
    return callGemini(config.ai.proModel, RESUME_GENERATION_PROMPT, content);
  },

  /**
   * Generate a tailored cover letter from resume + job description.
   */
  async generateCoverLetter(resumeText, jobDescription, tone = 'professional') {
    const content = `=== RESUME ===\n${resumeText}\n\n=== JOB DESCRIPTION ===\n${jobDescription}\n\n=== PREFERRED TONE ===\n${tone}`;
    return callGemini(config.ai.proModel, COVER_LETTER_PROMPT, content);
  },

  /**
   * Generate interview preparation material.
   */
  async prepareInterview(resumeText, jobDescription) {
    const content = `=== RESUME ===\n${resumeText}\n\n=== JOB DESCRIPTION ===\n${jobDescription}`;
    return callGemini(config.ai.proModel, INTERVIEW_PREP_PROMPT, content);
  },

  /**
   * Analyze skills gap and provide learning roadmap.
   */
  async analyzeSkillsGap(resumeText, targetRole) {
    const content = `=== RESUME ===\n${resumeText}\n\n=== TARGET ROLE ===\n${targetRole}`;
    return callGemini(config.ai.flashModel, SKILLS_GAP_PROMPT, content);
  },

  /**
   * Get salary insights and negotiation tips.
   */
  async getSalaryInsights(resumeText, targetRole, location) {
    const content = `=== RESUME ===\n${resumeText}\n\n=== TARGET ROLE ===\n${targetRole}\n\n=== LOCATION ===\n${location}`;
    return callGemini(config.ai.flashModel, SALARY_INSIGHTS_PROMPT, content);
  },
};

module.exports = aiService;

