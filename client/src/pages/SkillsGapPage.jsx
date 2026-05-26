import { useState } from 'react';
import { careerAPI } from '../api/client';
import './CareerTools.css';

export default function SkillsGapPage() {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await careerAPI.analyzeSkillsGap(resumeText, targetRole);
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Failed to analyze skills gap');
    } finally {
      setLoading(false);
    }
  };

  const getScoreClass = (pct) => pct >= 70 ? 'score-high' : pct >= 40 ? 'score-medium' : 'score-low';

  return (
    <div className="career-tool-page">
      <div className="career-tool-header">
        <span className="career-tool-badge">📊 SKILLS GAP</span>
        <h1>AI <span className="gradient-text">Skills Gap</span> Analyzer</h1>
        <p>Discover what skills you need and get a personalized learning roadmap</p>
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
          <label>Target Role</label>
          <input
            type="text"
            placeholder="e.g., Senior Full Stack Developer, Data Scientist, Product Manager"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="career-submit-btn" disabled={loading}>
          {loading ? '🔍 Analyzing Skills...' : '📊 Analyze Skills Gap'}
        </button>
      </form>

      {loading && (
        <div className="career-loading">
          <div className="spinner" />
          <p>Mapping your skills against industry requirements...</p>
        </div>
      )}

      {result && (
        <div className="career-results">
          <div className="result-card">
            <h2>📊 Skills Match</h2>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
              <span className={`score-badge ${getScoreClass(result.matchPercentage)}`}>
                {result.matchPercentage}% Match
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {result.currentLevel} → {result.targetLevel}
              </span>
            </div>

            <h3>✅ Your Existing Skills</h3>
            <div className="skill-chips">
              {result.existingSkills?.map((s, i) => (
                <span key={i} className="skill-chip existing">{s.skill} • {s.level}</span>
              ))}
            </div>

            <h3>❌ Missing Skills</h3>
            <div className="skill-chips">
              {result.missingSkills?.map((s, i) => (
                <span key={i} className={`skill-chip ${s.priority === 'Critical' ? 'critical' : 'missing'}`}>
                  {s.skill} • {s.priority} • {s.timeToLearn}
                </span>
              ))}
            </div>
          </div>

          {result.missingSkills?.length > 0 && (
            <div className="result-card">
              <h2>📚 Learning Resources</h2>
              {result.missingSkills.map((s, i) => (
                <div key={i} style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '0.95rem' }}>{s.skill}</h3>
                  <ul className="result-list">
                    {s.resources?.map((r, j) => <li key={j}>{r}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {result.learningRoadmap && (
            <div className="result-card">
              <h2>🗺️ Learning Roadmap</h2>
              <h3>📅 Week 1-2</h3>
              <ul className="result-list">{result.learningRoadmap.week1_2?.map((a, i) => <li key={i}>{a}</li>)}</ul>
              <h3>📅 Month 1</h3>
              <ul className="result-list">{result.learningRoadmap.month1?.map((a, i) => <li key={i}>{a}</li>)}</ul>
              <h3>📅 Month 2-3</h3>
              <ul className="result-list">{result.learningRoadmap.month2_3?.map((a, i) => <li key={i}>{a}</li>)}</ul>
              <h3>📅 Month 4-6</h3>
              <ul className="result-list">{result.learningRoadmap.month4_6?.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}

          {result.careerPath?.length > 0 && (
            <div className="result-card">
              <h2>🚀 Career Progression Path</h2>
              {result.careerPath.map((c, i) => (
                <div key={i} className="question-card">
                  <div className="question-category">{c.timeline}</div>
                  <div className="question-text">{c.role}</div>
                  <ul className="result-list">{c.requirements?.map((r, j) => <li key={j}>{r}</li>)}</ul>
                </div>
              ))}
            </div>
          )}

          {result.certifications?.length > 0 && (
            <div className="result-card">
              <h2>🏅 Recommended Certifications</h2>
              {result.certifications.map((c, i) => (
                <div key={i} style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> by {c.provider}</span>
                  <p className="result-text" style={{ margin: '0.25rem 0 0' }}>{c.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
