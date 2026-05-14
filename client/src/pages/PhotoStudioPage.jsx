import { useState } from 'react';
import { imageAPI } from '../api/client';
import './PhotoStudioPage.css';

export default function PhotoStudioPage() {
  const [activeTab, setActiveTab] = useState('headshot');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState('');

  // Headshot options
  const [headshotStyle, setHeadshotStyle] = useState('corporate');
  const [gender, setGender] = useState('neutral');
  const [headshotDetails, setHeadshotDetails] = useState('');

  // Cover options
  const [industry, setIndustry] = useState('technology');
  const [role, setRole] = useState('');
  const [coverDetails, setCoverDetails] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setGeneratedImage(null);

    try {
      let res;
      if (activeTab === 'headshot') {
        res = await imageAPI.generateHeadshot({
          style: headshotStyle, gender, additionalDetails: headshotDetails,
        });
      } else {
        res = await imageAPI.generateCoverPhoto({
          industry, role, additionalDetails: coverDetails,
        });
      }
      setGeneratedImage(res.data.image);
    } catch (err) {
      setError(err.message || 'Image generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `careerai-${activeTab}-${Date.now()}.png`;
    link.click();
  };

  const headshotStyles = [
    { id: 'corporate', label: '🏢 Corporate', desc: 'Professional business attire' },
    { id: 'tech', label: '💻 Tech', desc: 'Smart casual, modern feel' },
    { id: 'creative', label: '🎨 Creative', desc: 'Artistic, approachable' },
    { id: 'academic', label: '📚 Academic', desc: 'Scholarly, professional' },
    { id: 'healthcare', label: '🏥 Healthcare', desc: 'Medical professional' },
  ];

  const industries = [
    { id: 'technology', label: '💻 Technology' },
    { id: 'finance', label: '💰 Finance' },
    { id: 'creative', label: '🎨 Creative' },
    { id: 'healthcare', label: '🏥 Healthcare' },
    { id: 'education', label: '📚 Education' },
    { id: 'general', label: '🌐 General' },
  ];

  return (
    <div className="photo-page">
      <div className="photo-header">
        <span className="photo-badge">📸 AI STUDIO</span>
        <h1>Professional <span className="gradient-text">Photo Studio</span></h1>
        <p>Generate stunning AI-powered professional photos for your LinkedIn profile</p>
      </div>

      <div className="photo-tabs">
        <button className={`tab ${activeTab === 'headshot' ? 'active' : ''}`}
          onClick={() => { setActiveTab('headshot'); setGeneratedImage(null); }}>
          👤 Professional Headshot
        </button>
        <button className={`tab ${activeTab === 'cover' ? 'active' : ''}`}
          onClick={() => { setActiveTab('cover'); setGeneratedImage(null); }}>
          🖼️ Cover Photo
        </button>
      </div>

      <div className="photo-content">
        <div className="options-panel glass-card">
          {activeTab === 'headshot' ? (
            <>
              <h3>Choose Your Style</h3>
              <div className="style-grid">
                {headshotStyles.map((s) => (
                  <button
                    key={s.id}
                    className={`style-option ${headshotStyle === s.id ? 'selected' : ''}`}
                    onClick={() => setHeadshotStyle(s.id)}
                  >
                    <span className="style-label">{s.label}</span>
                    <span className="style-desc">{s.desc}</span>
                  </button>
                ))}
              </div>

              <div className="option-group">
                <label>Appearance</label>
                <div className="radio-group">
                  {['male', 'female', 'neutral'].map((g) => (
                    <button key={g} className={`radio-btn ${gender === g ? 'selected' : ''}`}
                      onClick={() => setGender(g)}>
                      {g === 'male' ? '👨' : g === 'female' ? '👩' : '🧑'} {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="option-group">
                <label>Additional Details (optional)</label>
                <input type="text" value={headshotDetails}
                  onChange={(e) => setHeadshotDetails(e.target.value)}
                  placeholder="e.g., dark hair, glasses, warm smile" />
              </div>
            </>
          ) : (
            <>
              <h3>Choose Your Industry</h3>
              <div className="style-grid industry-grid">
                {industries.map((ind) => (
                  <button key={ind.id}
                    className={`style-option ${industry === ind.id ? 'selected' : ''}`}
                    onClick={() => setIndustry(ind.id)}>
                    <span className="style-label">{ind.label}</span>
                  </button>
                ))}
              </div>

              <div className="option-group">
                <label>Your Role / Title</label>
                <input type="text" value={role} onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Senior Software Engineer" />
              </div>

              <div className="option-group">
                <label>Additional Details (optional)</label>
                <input type="text" value={coverDetails}
                  onChange={(e) => setCoverDetails(e.target.value)}
                  placeholder="e.g., include data visualization elements" />
              </div>
            </>
          )}

          {error && <div className="photo-error">{error}</div>}

          <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <span className="loading-text"><span className="spinner"></span> Generating...</span>
            ) : (
              `✨ Generate ${activeTab === 'headshot' ? 'Headshot' : 'Cover Photo'}`
            )}
          </button>
        </div>

        <div className="preview-panel glass-card">
          {generatedImage ? (
            <>
              <img src={generatedImage} alt={`Generated ${activeTab}`} className="generated-image" />
              <div className="preview-actions">
                <button className="btn-download" onClick={handleDownload}>⬇️ Download</button>
                <button className="btn-regenerate" onClick={handleGenerate} disabled={loading}>🔄 Regenerate</button>
              </div>
            </>
          ) : (
            <div className="preview-placeholder">
              <span className="placeholder-icon">{activeTab === 'headshot' ? '👤' : '🖼️'}</span>
              <p>Your generated {activeTab === 'headshot' ? 'headshot' : 'cover photo'} will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
