import { Link } from 'react-router-dom';
import heroBg from '../assets/hero-bg.png';
import aiIllustration from '../assets/ai-illustration.png';
import './LandingPage.css';

const features = [
  { icon: '🧠', title: 'AI-Powered Analysis', desc: 'Gemini 2.5 Pro evaluates your resume against 15+ ATS criteria with section-level scores.' },
  { icon: '🎯', title: 'Job Match Scoring', desc: 'Compare your resume against any job description to see your exact match percentage and gaps.' },
  { icon: '🔗', title: 'LinkedIn Optimizer', desc: 'Paste your LinkedIn profile for AI-driven improvement tips and keyword optimization.' },
  { icon: '📄', title: 'AI Resume Generator', desc: 'Generate ATS-optimized resumes from your LinkedIn profile in one click.' },
  { icon: '📸', title: 'Professional Photos', desc: 'Generate stunning AI headshots and cover photos for your LinkedIn profile.' },
  { icon: '📈', title: 'Track Progress', desc: 'Keep history of all analyses and track your career improvement over time.' },
];

const steps = [
  { num: '01', title: 'Upload Resume', desc: 'Drop your PDF or DOCX file — it takes just 2 seconds.' },
  { num: '02', title: 'AI Analyzes', desc: 'Our AI engine extracts, scores, and evaluates every section.' },
  { num: '03', title: 'Get Results', desc: 'Receive detailed scores, skills, strengths, and improvement tips.' },
];

const stats = [
  { value: '50K+', label: 'Resumes Analyzed' },
  { value: '95%', label: 'User Satisfaction' },
  { value: '3s', label: 'Avg Processing' },
  { value: '85%', label: 'Interview Rate Increase' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ─── Hero Section ──────────────────────────────── */}
      <section className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="hero-overlay" />
        <div className="hero-content container">
          <div className="hero-text slide-up">
            <div className="hero-badge badge badge-purple">
              <span>✨</span> AI-Powered Resume Intelligence
            </div>
            <h1 className="hero-title">
              Accelerate Your Career with{' '}
              <span className="text-gradient">AI-Powered</span>{' '}
              Career Intelligence
            </h1>
            <p className="hero-subtitle">
              Upload your resume for AI scoring, optimize your LinkedIn profile, generate ATS-friendly resumes, 
              and create professional photos — all powered by Gemini 2.5 Pro.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg">
                Analyze Your Resume Free →
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </div>
          </div>
          <div className="hero-visual slide-up-delay">
            <img src={aiIllustration} alt="AI Resume Analysis" className="hero-illustration" />
            <div className="hero-glow" />
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─────────────────────────────────── */}
      <section className="stats-bar">
        <div className="container stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-item">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Section ──────────────────────────── */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2 className="section-title">Everything You Need to <span className="text-gradient">Perfect Your Resume</span></h2>
            <p className="section-desc">Powered by Google Gemini 2.5 Pro, our platform provides the most comprehensive career intelligence available.</p>
          </div>
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card glass-card">
                <span className="feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────── */}
      <section className="how-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">Three Simple Steps to a <span className="text-gradient">Better Resume</span></h2>
          </div>
          <div className="steps-grid">
            {steps.map((step) => (
              <div key={step.num} className="step-card">
                <div className="step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                <div className="step-line" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card glass-card">
            <h2>Ready to Perfect Your Resume?</h2>
            <p>Join thousands of professionals who've improved their resumes with AI-powered analysis.</p>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started Free →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────── */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <span className="brand-text">Career<span className="text-gradient">AI</span></span>
            <p>AI-powered career intelligence for modern professionals.</p>
          </div>
          <div className="footer-links">
            <Link to="/pricing">Pricing</Link>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
          </div>
          <p className="footer-copy">© 2026 CareerAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
