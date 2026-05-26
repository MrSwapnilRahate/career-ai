import { useState } from 'react';
import { careerAPI } from '../api/client';
import './CareerTools.css';

export default function SalaryInsightsPage() {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [location, setLocation] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await careerAPI.getSalaryInsights(resumeText, targetRole, location);
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Failed to get salary insights');
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (amount, currency) => {
    if (!amount) return 'N/A';
    const sym = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '$';
    return `${sym}${amount.toLocaleString()}`;
  };

  return (
    <div className="career-tool-page">
      <div className="career-tool-header">
        <span className="career-tool-badge">💰 SALARY INSIGHTS</span>
        <h1>AI <span className="gradient-text">Salary</span> Intelligence</h1>
        <p>Market salary data, negotiation tips, and compensation insights</p>
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
        <div className="form-row">
          <div className="form-group">
            <label>Target Role</label>
            <input
              type="text"
              placeholder="e.g., Senior Software Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              placeholder="e.g., Bangalore, India or San Francisco, US"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
        </div>
        <button type="submit" className="career-submit-btn" disabled={loading}>
          {loading ? '📊 Analyzing Market...' : '💰 Get Salary Insights'}
        </button>
      </form>

      {loading && (
        <div className="career-loading">
          <div className="spinner" />
          <p>Analyzing market data for {targetRole} in {location}...</p>
        </div>
      )}

      {result && (
        <div className="career-results">
          <div className="result-card">
            <h2>💰 Salary Range — {result.targetRole}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>📍 {result.location}</p>

            <div className="salary-bar">
              <span className="salary-label">Entry</span>
              <span className="salary-value">{formatSalary(result.salaryRange?.entry, result.salaryRange?.currency)}</span>
            </div>
            <div className="salary-bar" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
              <span className="salary-label">Median</span>
              <span className="salary-value" style={{ color: 'var(--accent-secondary)' }}>{formatSalary(result.salaryRange?.median, result.salaryRange?.currency)}</span>
            </div>
            <div className="salary-bar">
              <span className="salary-label">Senior</span>
              <span className="salary-value">{formatSalary(result.salaryRange?.senior, result.salaryRange?.currency)}</span>
            </div>
            <div className="salary-bar" style={{ borderLeft: '3px solid #22c55e' }}>
              <span className="salary-label">Top 10%</span>
              <span className="salary-value" style={{ color: '#22c55e' }}>{formatSalary(result.salaryRange?.top, result.salaryRange?.currency)}</span>
            </div>
          </div>

          {result.candidateEstimate && (
            <div className="result-card">
              <h2>🎯 Your Estimated Salary</h2>
              <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <span className="score-badge score-high" style={{ fontSize: '1.5rem' }}>
                  {formatSalary(result.candidateEstimate.estimated, result.salaryRange?.currency)}
                </span>
              </div>
              <p className="result-text" style={{ textAlign: 'center' }}>{result.candidateEstimate.reasoning}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                <span className={`score-badge ${result.marketDemand === 'High' ? 'score-high' : 'score-medium'}`}>
                  📈 Demand: {result.marketDemand}
                </span>
                <span className="score-badge score-high">
                  📊 Trend: {result.demandTrend}
                </span>
              </div>
            </div>
          )}

          {result.negotiationTips?.length > 0 && (
            <div className="result-card">
              <h2>🤝 Negotiation Strategies</h2>
              <ul className="result-list">
                {result.negotiationTips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          {result.negotiationScript && (
            <div className="result-card">
              <h2>🎬 Sample Negotiation Script</h2>
              <p className="result-text">{result.negotiationScript}</p>
            </div>
          )}

          {result.comparableRoles?.length > 0 && (
            <div className="result-card">
              <h2>🔄 Comparable Roles</h2>
              {result.comparableRoles.map((r, i) => (
                <div key={i} className="salary-bar">
                  <span className="salary-label" style={{ minWidth: '200px' }}>{r.role}</span>
                  <span className="salary-value">{r.salaryRange}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.similarity} similar</span>
                </div>
              ))}
            </div>
          )}

          {result.benefitsToNegotiate?.length > 0 && (
            <div className="result-card">
              <h2>🎁 Benefits to Negotiate</h2>
              <ul className="result-list">
                {result.benefitsToNegotiate.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
