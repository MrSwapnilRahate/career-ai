import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resumeAPI } from '../api/client';
import './ResultPage.css';

function ScoreRing({ score, size = 140, strokeWidth = 10, color = '#3b82f6', label = 'Score' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="score-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="bg-ring" cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} fill="none" />
        <circle className="fg-ring" cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} fill="none"
          stroke={getColor(score)} strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ animation: 'scoreReveal 1.5s ease forwards' }} />
      </svg>
      <div className="score-value">
        <span className="score-number" style={{ fontSize: size * 0.28, color: getColor(score) }}>{score}</span>
        <span className="score-label">{label}</span>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    resumeAPI.getResult(id)
      .then((res) => setResult(res.data))
      .catch((err) => setError(err.message || 'Failed to load result'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-screen"><div className="loader loader-lg" /><p>Loading analysis...</p></div>;
  if (error) return <div className="loading-screen"><p style={{ color: 'var(--accent-red-light)' }}>{error}</p><Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link></div>;
  if (!result) return null;

  const ai = result.aiResult || {};
  const isJobMatch = result.analysisType === 'job-match';

  return (
    <div className="result-page fade-in">
      <div className="container">
        <div className="result-header">
          <div>
            <h1>Analysis <span className="text-gradient">Results</span></h1>
            <p className="result-meta">
              <span className={`badge ${isJobMatch ? 'badge-purple' : 'badge-blue'}`}>{isJobMatch ? 'Job Match' : 'Resume Analysis'}</span>
              <span className="result-file">📄 {result.fileMetadata?.originalName || 'Resume'}</span>
              <span className="result-date">{new Date(result.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </p>
          </div>
          <Link to="/dashboard" className="btn btn-secondary">← Dashboard</Link>
        </div>

        {/* Score Rings */}
        <div className="scores-section">
          <div className="score-card glass-card">
            <ScoreRing score={isJobMatch ? (ai.matchScore || 0) : (ai.score || 0)} size={160} label={isJobMatch ? 'Match' : 'Overall'} />
          </div>
          {!isJobMatch && (
            <div className="score-card glass-card">
              <ScoreRing score={ai.atsScore || 0} size={160} label="ATS Score" />
            </div>
          )}
        </div>

        {/* Summary */}
        {ai.summary && (
          <div className="result-section glass-card">
            <h2>📝 Summary</h2>
            <p className="summary-text">{ai.summary}</p>
          </div>
        )}

        {/* Skills */}
        {ai.skills?.length > 0 && (
          <div className="result-section glass-card">
            <h2>🔍 Detected Skills</h2>
            <div className="skills-cloud">
              {ai.skills.map((skill, i) => (
                <span key={i} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Skills (Job Match) */}
        {isJobMatch && ai.missingSkills?.length > 0 && (
          <div className="result-section glass-card">
            <h2>⚠️ Missing Skills</h2>
            <div className="skills-cloud">
              {ai.missingSkills.map((skill, i) => (
                <span key={i} className="skill-tag skill-missing">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Grid */}
        <div className="feedback-grid">
          {ai.strengths?.length > 0 && (
            <div className="feedback-card glass-card feedback-green">
              <h3>💪 Strengths</h3>
              <ul>{ai.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {ai.weaknesses?.length > 0 && (
            <div className="feedback-card glass-card feedback-amber">
              <h3>⚡ Areas to Improve</h3>
              <ul>{ai.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
          {ai.suggestions?.length > 0 && (
            <div className="feedback-card glass-card feedback-blue">
              <h3>💡 Suggestions</h3>
              <ul>{ai.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
        </div>

        {/* Processing Time */}
        {result.processingTimeMs && (
          <p className="result-processing">⚡ Analyzed in {(result.processingTimeMs / 1000).toFixed(1)}s</p>
        )}
      </div>
    </div>
  );
}
