import { useState } from 'react';
import { careerAPI } from '../api/client';
import './CareerTools.css';

export default function CoverLetterPage() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await careerAPI.generateCoverLetter(resumeText, jobDescription, tone);
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Failed to generate cover letter');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="career-tool-page">
      <div className="career-tool-header">
        <span className="career-tool-badge">📝 COVER LETTER</span>
        <h1>AI <span className="gradient-text">Cover Letter</span> Generator</h1>
        <p>Generate a tailored, compelling cover letter in seconds</p>
      </div>

      {error && <div className="career-error">{error}</div>}

      <form className="career-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Your Resume / Experience</label>
          <textarea
            placeholder="Paste your resume text or key experience details..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Job Description</label>
          <textarea
            placeholder="Paste the job description you're applying for..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="professional">Professional</option>
            <option value="friendly">Friendly & Approachable</option>
            <option value="confident">Bold & Confident</option>
          </select>
        </div>
        <button type="submit" className="career-submit-btn" disabled={loading}>
          {loading ? '✨ Generating Cover Letter...' : '📝 Generate Cover Letter'}
        </button>
      </form>

      {loading && (
        <div className="career-loading">
          <div className="spinner" />
          <p>Crafting your personalized cover letter with Gemini 2.5 Pro...</p>
        </div>
      )}

      {result && (
        <div className="career-results">
          <div className="result-card">
            <h2>📝 Your Cover Letter <button className="copy-btn" onClick={handleCopy}>{copied ? '✓ Copied!' : '📋 Copy'}</button></h2>
            <div className="result-text">{result.coverLetter}</div>
          </div>

          {result.keyHighlights?.length > 0 && (
            <div className="result-card">
              <h2>🎯 Key Highlights Used</h2>
              <ul className="result-list">
                {result.keyHighlights.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          )}

          {result.tips?.length > 0 && (
            <div className="result-card">
              <h2>💡 Personalization Tips</h2>
              <ul className="result-list">
                {result.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
