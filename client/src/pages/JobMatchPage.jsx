import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI } from '../api/client';
import './JobMatchPage.css';

const POLL_INTERVAL = 2000;
const STAGES = ['queued', 'processing', 'extracting', 'analyzing', 'completed'];

export default function JobMatchPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  const handleFile = (f) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) { setError('Only PDF, DOC, and DOCX files are allowed.'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('File size must be under 5MB.'); return; }
    setFile(f); setError('');
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };

  const handleSubmit = async () => {
    if (!file || jobDesc.length < 20) {
      setError('Please upload a resume and enter at least 20 characters for the job description.');
      return;
    }
    setError(''); setUploading(true);
    try {
      const res = await resumeAPI.jobMatch(file, jobDesc);
      setJobId(res.data.jobId); setStatus('queued');
    } catch (err) {
      setError(err.message || 'Upload failed'); setUploading(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await resumeAPI.getStatus(jobId);
        setStatus(res.data.status);
        if (res.data.status === 'completed') { clearInterval(interval); setTimeout(() => navigate(`/result/${res.data.analysisId}`), 800); }
        if (res.data.status === 'failed') { clearInterval(interval); setError(res.data.error || 'Analysis failed.'); setUploading(false); setJobId(null); }
      } catch { clearInterval(interval); setError('Failed to check status.'); setUploading(false); }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [jobId, navigate]);

  const currentStage = STAGES.indexOf(status);

  return (
    <div className="jobmatch-page fade-in">
      <div className="container">
        <div className="upload-header">
          <h1>Resume vs <span className="text-gradient">Job Match</span></h1>
          <p>Upload your resume and paste the job description to see your match score.</p>
        </div>

        {!jobId ? (
          <div className="jobmatch-layout">
            <div className="jobmatch-left glass-card">
              <h3>📄 Resume File</h3>
              <div
                className={`dropzone dropzone-sm ${dragOver ? 'dropzone-active' : ''} ${file ? 'dropzone-has-file' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} hidden />
                {file ? (
                  <div className="dropzone-file">
                    <span className="file-icon">📄</span>
                    <div><p className="file-name">{file.name}</p><p className="file-size">{(file.size/1024/1024).toFixed(2)} MB</p></div>
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="file-remove">✕</button>
                  </div>
                ) : (
                  <div className="dropzone-empty">
                    <div className="dropzone-icon" style={{ fontSize: 32 }}>📤</div>
                    <p className="dropzone-title" style={{ fontSize: 15 }}>Drop resume here</p>
                    <p className="dropzone-desc">PDF, DOC, DOCX</p>
                  </div>
                )}
              </div>
            </div>

            <div className="jobmatch-right glass-card">
              <h3>📋 Job Description</h3>
              <textarea
                className="form-input form-textarea jobdesc-input"
                placeholder="Paste the job description here... (min 20 characters)"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
              <p className="char-count">{jobDesc.length} / 5000 characters</p>
            </div>

            <div className="jobmatch-footer">
              {error && <div className="auth-error">{error}</div>}
              <button className="btn btn-primary btn-lg upload-btn" onClick={handleSubmit} disabled={!file || jobDesc.length < 20 || uploading}>
                {uploading ? <span className="loader loader-sm" /> : '🎯 Analyze Job Match'}
              </button>
            </div>
          </div>
        ) : (
          <div className="processing-area glass-card">
            <div className="processing-header">
              <div className="processing-spinner" />
              <h2>Matching Resume to Job...</h2>
              <p>Our AI is comparing your skills against the job requirements.</p>
            </div>
            <div className="processing-stages">
              {STAGES.map((stage, i) => (
                <div key={stage} className={`stage ${i <= currentStage ? 'stage-active' : ''} ${i === currentStage ? 'stage-current' : ''}`}>
                  <div className="stage-dot">{i < currentStage ? '✓' : i === currentStage ? <span className="stage-pulse" /> : ''}</div>
                  <span className="stage-label">{stage === 'queued' ? '⏳ Queued' : stage === 'processing' ? '🔄 Processing' : stage === 'extracting' ? '📄 Extracting' : stage === 'analyzing' ? '🧠 Matching' : '✅ Complete'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
