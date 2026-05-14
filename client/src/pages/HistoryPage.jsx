import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resumeAPI } from '../api/client';
import './HistoryPage.css';

export default function HistoryPage() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const res = await resumeAPI.getHistory(page, 10);
      setData(res.data || []);
      setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;
    setDeleting(id);
    try {
      await resumeAPI.deleteAnalysis(id);
      setData((prev) => prev.filter((item) => item._id !== id));
      setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch {}
    setDeleting(null);
  };

  const getStatusBadge = (status) => {
    const map = { completed: 'badge-green', failed: 'badge-red', processing: 'badge-amber', queued: 'badge-blue', extracting: 'badge-amber', analyzing: 'badge-purple' };
    return <span className={`badge ${map[status] || 'badge-blue'}`}>{status}</span>;
  };

  return (
    <div className="history-page fade-in">
      <div className="container">
        <div className="history-header">
          <div>
            <h1>Analysis <span className="text-gradient">History</span></h1>
            <p>{pagination.total} total analyses</p>
          </div>
          <Link to="/upload" className="btn btn-primary">+ New Analysis</Link>
        </div>

        {loading ? (
          <div className="loading-screen" style={{ minHeight: '300px' }}><div className="loader" /></div>
        ) : data.length === 0 ? (
          <div className="empty-state glass-card">
            <div className="icon">📋</div>
            <h3>No history yet</h3>
            <p>Your resume analyses will appear here after you upload your first resume.</p>
            <Link to="/upload" className="btn btn-primary">Upload Resume</Link>
          </div>
        ) : (
          <>
            <div className="history-table glass-card">
              <div className="table-header">
                <span className="col-name">Resume</span>
                <span className="col-type">Type</span>
                <span className="col-score">Score</span>
                <span className="col-status">Status</span>
                <span className="col-date">Date</span>
                <span className="col-actions">Actions</span>
              </div>
              {data.map((item) => (
                <div key={item._id} className="table-row">
                  <span className="col-name">
                    <span className="row-icon">📄</span>
                    {item.fileMetadata?.originalName || 'Resume'}
                  </span>
                  <span className="col-type">
                    <span className={`badge ${item.analysisType === 'job-match' ? 'badge-purple' : 'badge-blue'}`}>
                      {item.analysisType === 'job-match' ? 'Job Match' : 'Analysis'}
                    </span>
                  </span>
                  <span className="col-score">
                    {item.status === 'completed'
                      ? <span className="score-display">{item.aiResult?.score || item.aiResult?.matchScore || 0}%</span>
                      : <span className="score-na">—</span>
                    }
                  </span>
                  <span className="col-status">{getStatusBadge(item.status)}</span>
                  <span className="col-date">{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="col-actions">
                    {item.status === 'completed' && (
                      <Link to={`/result/${item._id}`} className="btn btn-ghost btn-sm">View</Link>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item._id)}
                      disabled={deleting === item._id}
                    >
                      {deleting === item._id ? '...' : 'Delete'}
                    </button>
                  </span>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-secondary btn-sm" onClick={() => fetchHistory(pagination.page - 1)} disabled={!pagination.hasPrev}>← Prev</button>
                <span className="pagination-info">Page {pagination.page} of {pagination.totalPages}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => fetchHistory(pagination.page + 1)} disabled={!pagination.hasNext}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
