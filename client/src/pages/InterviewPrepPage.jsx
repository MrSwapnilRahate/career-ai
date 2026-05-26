import { useState } from 'react';
import { careerAPI } from '../api/client';
import './CareerTools.css';

export default function InterviewPrepPage() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedQ, setExpandedQ] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await careerAPI.prepareInterview(resumeText, jobDescription);
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Failed to generate interview prep');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="career-tool-page">
      <div className="career-tool-header">
        <span className="career-tool-badge">🎤 INTERVIEW PREP</span>
        <h1>AI <span className="gradient-text">Interview</span> Coach</h1>
        <p>Get 10 tailored questions with model answers — powered by Gemini 2.5 Pro</p>
      </div>

      {error && <div className="career-error">{error}</div>}

      <form className="career-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Your Resume / Experience</label>
          <textarea
            placeholder="Paste your resume text..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Job Description</label>
          <textarea
            placeholder="Paste the job description for the role..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="career-submit-btn" disabled={loading}>
          {loading ? '🧠 Preparing Interview...' : '🎤 Generate Interview Prep'}
        </button>
      </form>

      {loading && (
        <div className="career-loading">
          <div className="spinner" />
          <p>Analyzing role requirements and crafting personalized questions...</p>
        </div>
      )}

      {result && (
        <div className="career-results">
          {result.roleAnalysis && (
            <div className="result-card">
              <h2>🎯 Role Analysis</h2>
              <p className="result-text">{result.roleAnalysis}</p>
            </div>
          )}

          <div className="result-card">
            <h2>❓ Interview Questions ({result.questions?.length || 0})</h2>
            {result.questions?.map((q, i) => (
              <div key={i} className="question-card" onClick={() => setExpandedQ(expandedQ === i ? null : i)}>
                <div className="question-category">{q.category}</div>
                <div className="question-text">Q{i + 1}: {q.question}</div>
                {expandedQ === i && (
                  <>
                    <div className="question-answer"><strong>Model Answer:</strong> {q.modelAnswer}</div>
                    {q.whyAsked && <div className="question-tip">💡 Why they ask this: {q.whyAsked}</div>}
                    {q.tips && <div className="question-tip">🎯 Tip: {q.tips}</div>}
                  </>
                )}
                {expandedQ !== i && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Click to reveal model answer →</div>}
              </div>
            ))}
          </div>

          {result.questionsToAsk?.length > 0 && (
            <div className="result-card">
              <h2>🤔 Smart Questions to Ask the Interviewer</h2>
              <ul className="result-list">
                {result.questionsToAsk.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}

          {result.redFlags?.length > 0 && (
            <div className="result-card">
              <h2>⚠️ Common Mistakes to Avoid</h2>
              <ul className="result-list">
                {result.redFlags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {result.preparationPlan && (
            <div className="result-card">
              <h2>📅 3-Day Preparation Plan</h2>
              <p className="result-text">{result.preparationPlan}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
