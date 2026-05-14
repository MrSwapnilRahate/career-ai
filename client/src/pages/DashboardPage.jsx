import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resumeAPI } from '../api/client';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, lastUpload: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resumeAPI.getHistory(1, 5)
      .then((res) => {
        const items = res.data || [];
        setRecent(items);
        const completed = items.filter((a) => a.status === 'completed');
        const scores = completed.map((a) => a.aiResult?.score || a.aiResult?.matchScore || 0).filter(Boolean);
        setStats({
          total: res.pagination?.total || items.length,
          avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
          lastUpload: items[0]?.createdAt || null,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status) => {
    const map = { completed: 'badge-green', failed: 'badge-red', processing: 'badge-amber', queued: 'badge-blue', extracting: 'badge-amber', analyzing: 'badge-purple' };
    return <span className={`badge ${map[status] || 'badge-blue'}`}>{status}</span>;
  };

  return (
    <div className="dashboard-page fade-in">
      <div className="container">
        {/* Welcome */}
        <div className="dash-welcome">
          <div>
            <h1>Welcome back, <span className="text-gradient">{user?.name || 'User'}</span></h1>
            <p>Here's an overview of your resume analyses.</p>
          </div>
          <div className="dash-actions">
            <Link to="/upload" className="btn btn-primary">📄 Upload Resume</Link>
            <Link to="/job-match" className="btn btn-secondary">🎯 Job Match</Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="dash-stats">
          <div className="stat-card glass-card">
            <span className="stat-card-icon">📊</span>
            <div className="stat-card-value">{stats.total}</div>
            <div className="stat-card-label">Total Analyses</div>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-card-icon">⭐</span>
            <div className="stat-card-value">{stats.avgScore || '—'}</div>
            <div className="stat-card-label">Average Score</div>
          </div>
          <div className="stat-card glass-card">
            <span className="stat-card-icon">🕐</span>
            <div className="stat-card-value">
              {stats.lastUpload ? new Date(stats.lastUpload).toLocaleDateString() : '—'}
            </div>
            <div className="stat-card-label">Last Analysis</div>
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="dash-recent">
          <div className="dash-section-header">
            <h2>Recent Analyses</h2>
            <Link to="/history" className="btn btn-ghost">View All →</Link>
          </div>
          {loading ? (
            <div className="loading-screen" style={{ minHeight: '200px' }}>
              <div className="loader" />
            </div>
          ) : recent.length === 0 ? (
            <div className="empty-state glass-card" style={{ padding: '48px' }}>
              <div className="icon">📄</div>
              <h3>No analyses yet</h3>
              <p>Upload your first resume to get started with AI-powered analysis.</p>
              <Link to="/upload" className="btn btn-primary">Upload Resume</Link>
            </div>
          ) : (
            <div className="recent-list">
              {recent.map((item) => (
                <Link to={item.status === 'completed' ? `/result/${item._id}` : '#'} key={item._id} className="recent-item glass-card">
                  <div className="recent-info">
                    <span className="recent-icon">📄</span>
                    <div>
                      <p className="recent-name">{item.fileMetadata?.originalName || 'Resume'}</p>
                      <p className="recent-date">{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="recent-meta">
                    <span className={`badge ${item.analysisType === 'job-match' ? 'badge-purple' : 'badge-blue'}`}>
                      {item.analysisType === 'job-match' ? 'Job Match' : 'Analysis'}
                    </span>
                    {getStatusBadge(item.status)}
                    {item.status === 'completed' && (
                      <span className="recent-score">{item.aiResult?.score || item.aiResult?.matchScore || 0}%</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
