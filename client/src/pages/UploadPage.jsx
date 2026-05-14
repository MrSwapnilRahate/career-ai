import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeAPI } from '../api/client';
import './UploadPage.css';

const POLL_INTERVAL = 2000;
const STAGES = ['queued', 'processing', 'extracting', 'analyzing', 'completed'];

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  const handleFile = (f) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      setError('Only PDF, DOC, and DOCX files are allowed.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }
    setFile(f);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const res = await resumeAPI.upload(file);
      setJobId(res.data.jobId);
      setStatus('queued');
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploading(false);
    }
  };

  // Poll for status
  useEffect(() => {
    if (!jobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await resumeAPI.getStatus(jobId);
        setStatus(res.data.status);
        if (res.data.status === 'completed') {
          clearInterval(interval);
          setTimeout(() => navigate(`/result/${res.data.analysisId}`), 800);
        }
        if (res.data.status === 'failed') {
          clearInterval(interval);
          setError(res.data.error || 'Analysis failed. Please try again.');
          setUploading(false);
          setJobId(null);
        }
      } catch {
        clearInterval(interval);
        setError('Failed to check status.');
        setUploading(false);
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [jobId, navigate]);

  const currentStage = STAGES.indexOf(status);

  return (
    <div className="upload-page fade-in">
      <div className="container">
        <div className="upload-header">
          <h1>Upload Your <span className="text-gradient">Resume</span></h1>
          <p>Drop your PDF or DOCX file and let our AI analyze it in seconds.</p>
        </div>

        {!jobId ? (
          <div className="upload-area glass-card">
            <div
              className={`dropzone ${dragOver ? 'dropzone-active' : ''} ${file ? 'dropzone-has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                hidden
              />
              {file ? (
                <div className="dropzone-file">
                  <span className="file-icon">📄</span>
                  <div>
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="file-remove">✕</button>
                </div>
              ) : (
                <div className="dropzone-empty">
                  <div className="dropzone-icon">📤</div>
                  <p className="dropzone-title">Drag & drop your resume here</p>
                  <p className="dropzone-desc">or click to browse • PDF, DOC, DOCX up to 5MB</p>
                </div>
              )}
            </div>

            {error && <div className="auth-error" style={{ marginTop: 16 }}>{error}</div>}

            <button
              className="btn btn-primary btn-lg upload-btn"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? <span className="loader loader-sm" /> : '🚀 Analyze Resume'}
            </button>
          </div>
        ) : (
          <div className="processing-area glass-card">
            <div className="processing-header">
              <div className="processing-spinner" />
              <h2>Analyzing Your Resume...</h2>
              <p>Our AI is working on it. This usually takes 10-30 seconds.</p>
            </div>
            <div className="processing-stages">
              {STAGES.map((stage, i) => (
                <div key={stage} className={`stage ${i <= currentStage ? 'stage-active' : ''} ${i === currentStage ? 'stage-current' : ''}`}>
                  <div className="stage-dot">
                    {i < currentStage ? '✓' : i === currentStage ? <span className="stage-pulse" /> : ''}
                  </div>
                  <span className="stage-label">
                    {stage === 'queued' ? '⏳ Queued' : stage === 'processing' ? '🔄 Processing' : stage === 'extracting' ? '📄 Extracting Text' : stage === 'analyzing' ? '🧠 AI Analyzing' : '✅ Complete'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
