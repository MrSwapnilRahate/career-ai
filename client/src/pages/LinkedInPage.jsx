import { useState } from 'react';
import { linkedinAPI } from '../api/client';
import './LinkedInPage.css';

export default function LinkedInPage() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [profileText, setProfileText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (profileText.length < 50) {
      setError('Please paste at least 50 characters of your LinkedIn profile.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await linkedinAPI.analyzeProfile(profileText);
      setResult({ type: 'analysis', data: res.data });
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResume = async () => {
    if (profileText.length < 50) {
      setError('Please paste at least 50 characters of your LinkedIn profile.');
      return;
    }
    if (targetRole.length < 3) {
      setError('Please enter a target role.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await linkedinAPI.generateResume(profileText, targetRole);
      setResult({ type: 'resume', data: res.data });
    } catch (err) {
      setError(err.message || 'Resume generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="linkedin-page">
      <div className="linkedin-header">
        <span className="linkedin-badge">🔗 LINKEDIN AI</span>
        <h1>LinkedIn <span className="gradient-text">Optimizer</span></h1>
        <p>Analyze your LinkedIn profile and generate ATS-friendly resumes</p>
      </div>

      <div className="linkedin-tabs">
        <button className={`tab ${activeTab === 'analyze' ? 'active' : ''}`} onClick={() => { setActiveTab('analyze'); setResult(null); }}>
          📊 Profile Analysis
        </button>
        <button className={`tab ${activeTab === 'generate' ? 'active' : ''}`} onClick={() => { setActiveTab('generate'); setResult(null); }}>
          📄 Resume Generator
        </button>
      </div>

      <div className="linkedin-content">
        <div className="input-section">
          <div className="glass-card">
            <h3>📋 Paste Your LinkedIn Profile</h3>
            <p className="input-hint">
              Go to your LinkedIn profile → Copy all text from your About, Experience, Education, and Skills sections → Paste below
            </p>
            <textarea
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
              placeholder="Paste your full LinkedIn profile text here...

Example:
About: Experienced software engineer with 5+ years...

Experience:
Senior Software Engineer at Google
- Led a team of 8 engineers...

Education:
B.S. Computer Science, MIT

Skills: React, Node.js, Python, AWS..."
              rows={12}
            />
            <div className="char-count">{profileText.length} characters</div>

            {activeTab === 'generate' && (
              <div className="target-role-field">
                <label>🎯 Target Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Senior Software Engineer, Product Manager"
                />
              </div>
            )}

            {error && <div className="linkedin-error">{error}</div>}

            <button
              className="btn-analyze"
              onClick={activeTab === 'analyze' ? handleAnalyze : handleGenerateResume}
              disabled={loading}
            >
              {loading ? (
                <span className="loading-text">
                  <span className="spinner"></span>
                  {activeTab === 'analyze' ? 'Analyzing...' : 'Generating Resume...'}
                </span>
              ) : (
                activeTab === 'analyze' ? '🧠 Analyze My Profile' : '📄 Generate ATS Resume'
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="result-section">
            {result.type === 'analysis' && <LinkedInAnalysisResult data={result.data} />}
            {result.type === 'resume' && <ResumeResult data={result.data} />}
          </div>
        )}
      </div>
    </div>
  );
}

function LinkedInAnalysisResult({ data }) {
  return (
    <div className="analysis-result glass-card">
      <div className="result-header">
        <h3>LinkedIn Profile Analysis</h3>
        <div className="score-circle">
          <span className="score-value">{data.overallScore}</span>
          <span className="score-label">Score</span>
        </div>
      </div>

      <p className="result-summary">{data.summary}</p>

      <div className="score-bars">
        {[
          { label: 'Headline', score: data.headlineScore },
          { label: 'About Section', score: data.aboutScore },
          { label: 'Experience', score: data.experienceScore },
          { label: 'Skills', score: data.skillsScore },
        ].map((item) => (
          <div key={item.label} className="score-bar-item">
            <div className="score-bar-header">
              <span>{item.label}</span>
              <span className={`score-number ${item.score >= 80 ? 'green' : item.score >= 60 ? 'amber' : 'red'}`}>
                {item.score}/100
              </span>
            </div>
            <div className="score-bar-track">
              <div
                className={`score-bar-fill ${item.score >= 80 ? 'green' : item.score >= 60 ? 'amber' : 'red'}`}
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {data.headlineSuggestions?.length > 0 && (
        <div className="result-section-block">
          <h4>✨ Headline Suggestions</h4>
          <ul>{data.headlineSuggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}

      {data.improvements?.length > 0 && (
        <div className="result-section-block">
          <h4>🔧 Improvements</h4>
          <ul>{data.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}

      {data.keywordSuggestions?.length > 0 && (
        <div className="result-section-block keywords">
          <h4>🔑 Keywords to Add</h4>
          <div className="keyword-tags">
            {data.keywordSuggestions.map((k, i) => <span key={i} className="keyword-tag">{k}</span>)}
          </div>
        </div>
      )}

      {data.contentIdeas?.length > 0 && (
        <div className="result-section-block">
          <h4>💡 Content Ideas</h4>
          <ul>{data.contentIdeas.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function ResumeResult({ data }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(data.resumeText || data.resumeMarkdown);
  };

  return (
    <div className="resume-result glass-card">
      <div className="result-header">
        <h3>Generated ATS Resume</h3>
        <div className="score-circle">
          <span className="score-value">{data.estimatedAtsScore}</span>
          <span className="score-label">ATS Score</span>
        </div>
      </div>

      <div className="resume-actions">
        <button className="btn-copy" onClick={handleCopy}>📋 Copy Resume</button>
      </div>

      <div className="resume-preview">
        <pre>{data.resumeMarkdown || data.resumeText}</pre>
      </div>

      {data.optimizationNotes?.length > 0 && (
        <div className="result-section-block">
          <h4>⚡ Optimization Notes</h4>
          <ul>{data.optimizationNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </div>
      )}

      {data.targetKeywords?.length > 0 && (
        <div className="result-section-block keywords">
          <h4>🎯 Target Keywords Used</h4>
          <div className="keyword-tags">
            {data.targetKeywords.map((k, i) => <span key={i} className="keyword-tag">{k}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
